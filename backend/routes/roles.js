const express = require('express');
const router = express.Router();
const db = require('../db');

function parseRole(r) {
  return {
    ...r,
    isSystem: r.isSystem === 1,
    actif: r.actif !== 0,
    pages: safeJSON(r.pages)
  };
}
function safeJSON(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY code');
    res.json(rows.map(parseRole));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles WHERE idRole = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rôle introuvable' });
    res.json(parseRole(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const r = req.body;
    const [result] = await db.query(
      'INSERT INTO roles (code, libelle, couleur, isSystem, actif, pages) VALUES (?, ?, ?, ?, ?, ?)',
      [r.code || '', r.libelle || '', r.couleur || '#6c757d', 0, r.actif !== false ? 1 : 0, JSON.stringify(r.pages || [])]
    );
    res.status(201).json({ idRole: result.insertId, ...r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = req.body;
    await db.query(
      'UPDATE roles SET code=?, libelle=?, couleur=?, actif=?, pages=? WHERE idRole=?',
      [r.code || '', r.libelle || '', r.couleur || '#6c757d', r.actif !== false ? 1 : 0, JSON.stringify(r.pages || []), req.params.id]
    );
    res.json({ idRole: Number(req.params.id), ...r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM roles WHERE idRole = ? AND isSystem = 0', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;