const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

/* =====================================================
   GET /api/users — Liste des utilisateurs
   ===================================================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT idUtilisateur, login, role, idAgent, actif, dateLogin FROM users ORDER BY login');
    res.json(rows);
  } catch (err) {
    console.error('❌ GET /api/users :', err);
    res.status(500).json({ error: 'Impossible de charger le compte.' });
  }
});

/* =====================================================
   GET /api/users/:id
   ===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT idUtilisateur, login, role, idAgent, actif, dateLogin FROM users WHERE idUtilisateur = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ GET /api/users/:id :', err);
    res.status(500).json({ error: 'Impossible de charger le compte.' });
  }
});

/* =====================================================
   POST /api/users — Créer un utilisateur
   ===================================================== */
router.post('/', async (req, res) => {
  try {
    const u = req.body;
    if (typeof u.login !== 'string' || u.login.trim().length < 3 || typeof u.password !== 'string' || u.password.length < 12) {
      return res.status(400).json({ error: 'Identifiant requis et mot de passe de 12 caractères minimum.' });
    }
    const [result] = await db.query(
      'INSERT INTO users (login, password_hash, role, idAgent, actif) VALUES (?, ?, ?, ?, ?)',
      [u.login.trim(), hashPassword(u.password), u.role || 'AGENT', u.idAgent || null, u.actif !== false ? 1 : 0]
    );
    res.status(201).json({ idUtilisateur: result.insertId, login: u.login.trim(), role: u.role || 'AGENT', idAgent: u.idAgent || null, actif: u.actif !== false });
  } catch (err) {
    console.error('❌ POST /api/users :', err);
    res.status(500).json({ error: 'Impossible de créer le compte.' });
  }
});

/* =====================================================
   PUT /api/users/:id — Modifier un utilisateur
   ===================================================== */
router.put('/:id', async (req, res) => {
  try {
    const u = req.body;
    const champs = [];
    const valeurs = [];
    if (u.password !== undefined) {
      if (typeof u.password !== 'string' || u.password.length < 12) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères.' });
      champs.push('password_hash = ?'); valeurs.push(hashPassword(u.password));
    }
    if (u.role !== undefined) { champs.push('role = ?'); valeurs.push(u.role); }
    if (u.idAgent !== undefined) { champs.push('idAgent = ?'); valeurs.push(u.idAgent); }
    if (u.actif !== undefined) { champs.push('actif = ?'); valeurs.push(u.actif ? 1 : 0); }
    if (req.params.id === String(req.user.idUtilisateur) && u.actif === false) return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    if (req.params.id === String(req.user.idUtilisateur) && u.role !== undefined && u.role !== req.user.role) return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' });
    if (!champs.length) return res.json({ idUtilisateur: Number(req.params.id), ...u });
    valeurs.push(req.params.id);
    const [result] = await db.query(`UPDATE users SET ${champs.join(', ')} WHERE idUtilisateur = ?`, valeurs);
    if (!result.affectedRows) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ idUtilisateur: Number(req.params.id), login: u.login, role: u.role, idAgent: u.idAgent, actif: u.actif });
  } catch (err) {
    console.error('❌ PUT /api/users/:id :', err);
    res.status(500).json({ error: 'Impossible de modifier le compte.' });
  }
});

/* =====================================================
   DELETE /api/users/:id
   ===================================================== */
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user.idUtilisateur)) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    await db.query('DELETE FROM users WHERE idUtilisateur = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /api/users/:id :', err);
    res.status(500).json({ error: 'Impossible de supprimer le compte.' });
  }
});

module.exports = router;
