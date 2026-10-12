const express = require('express');
const router = express.Router();
const db = require('../db');

/* =====================================================
   GET /api/users — Liste des utilisateurs
   ===================================================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY login');
    res.json(rows);
  } catch (err) {
    console.error('❌ GET /api/users :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   GET /api/users/:id
   ===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE idUtilisateur = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ GET /api/users/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   POST /api/users — Créer un utilisateur
   ===================================================== */
router.post('/', async (req, res) => {
  try {
    const u = req.body;
    const [result] = await db.query(
      'INSERT INTO users (login, password, role, idAgent, actif) VALUES (?, ?, ?, ?, ?)',
      [u.login || '', u.password || '', u.role || 'AGENT', u.idAgent || null, u.actif !== false ? 1 : 0]
    );
    res.status(201).json({ idUtilisateur: result.insertId, ...u });
  } catch (err) {
    console.error('❌ POST /api/users :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
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
    if (u.password !== undefined) { champs.push('password = ?'); valeurs.push(u.password); }
    if (u.role !== undefined) { champs.push('role = ?'); valeurs.push(u.role); }
    if (u.idAgent !== undefined) { champs.push('idAgent = ?'); valeurs.push(u.idAgent); }
    if (u.actif !== undefined) { champs.push('actif = ?'); valeurs.push(u.actif ? 1 : 0); }
    if (u.dateLogin !== undefined) { champs.push('dateLogin = ?'); valeurs.push(u.dateLogin); }
    if (!champs.length) return res.json({ idUtilisateur: Number(req.params.id), ...u });
    valeurs.push(req.params.id);
    await db.query(`UPDATE users SET ${champs.join(', ')} WHERE idUtilisateur = ?`, valeurs);
    res.json({ idUtilisateur: Number(req.params.id), ...u });
  } catch (err) {
    console.error('❌ PUT /api/users/:id :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   DELETE /api/users/:id
   ===================================================== */
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE idUtilisateur = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /api/users/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;