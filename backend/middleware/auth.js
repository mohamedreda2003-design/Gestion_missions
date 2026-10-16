const crypto = require('crypto');
const db = require('../db');

const COOKIE_NAME = 'gm_session';
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('SESSION_SECRET doit contenir au moins 32 caractères aléatoires.');
  }
  return value;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readSession(token) {
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(data.sub) && data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch { return null; }
}

function setSessionCookie(res, userId) {
  const secure = process.env.NODE_ENV !== 'development' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${createSession(userId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV !== 'development' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function cookieValue(req) {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : '';
}

function requestToken(req) {
  try { return decodeURIComponent(cookieValue(req)); } catch { return ''; }
}

async function loadUser(token) {
  const session = readSession(token);
  if (!session) return null;
  const [rows] = await db.query(
    'SELECT idUtilisateur, login, role, idAgent, actif FROM users WHERE idUtilisateur = ? AND actif = 1',
    [session.sub]
  );
  return rows[0] || null;
}

async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(requestToken(req));
    if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
    next();
  } catch (err) { next(err); }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Accès réservé à un administrateur' });
  next();
}

module.exports = { COOKIE_NAME, createSession, loadUser, requestToken, setSessionCookie, clearSessionCookie, requireAuth, requireAdmin };
