const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { loadUser, requestToken, setSessionCookie, clearSessionCookie } = require('../middleware/auth');

const router = express.Router();
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

router.post('/login', async (req, res) => {
  const login = typeof req.body?.login === 'string' ? req.body.login.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!login || !password || login.length > 100 || password.length > 256) {
    return res.status(400).json({ error: 'Identifiant ou mot de passe invalide' });
  }
  const attemptKey = `${req.ip}:${login.toLowerCase()}`;
  const now = Date.now();
  const recent = (attempts.get(attemptKey) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)));
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
  }
  try {
    const [rows] = await db.query(
      'SELECT idUtilisateur, password_hash FROM users WHERE login = ? AND actif = 1', [login]
    );
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      recent.push(now);
      attempts.set(attemptKey, recent);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    attempts.delete(attemptKey);
    await db.query('UPDATE users SET dateLogin = CURRENT_TIMESTAMP WHERE idUtilisateur = ?', [rows[0].idUtilisateur]);
    setSessionCookie(res, rows[0].idUtilisateur);
    const user = await loadUser(require('../middleware/auth').createSession(rows[0].idUtilisateur));
    res.set('Cache-Control', 'no-store').json({ user });
  } catch (err) {
    console.error('POST /api/auth/login:', err.message);
    res.status(500).json({ error: 'Échec de la connexion' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await loadUser(requestToken(req));
    if (!user) return res.status(401).json({ error: 'Session expirée' });
    res.set('Cache-Control', 'no-store').json({ user });
  } catch (err) {
    console.error('GET /api/auth/me:', err.message);
    res.status(500).json({ error: 'Impossible de vérifier la session' });
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

module.exports = router;
