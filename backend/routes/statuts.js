const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM statuts ORDER BY idStatut');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM statuts WHERE idStatut = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Statut introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const s = req.body;
    const [result] = await db.query(
      'INSERT INTO statuts (code, libelle, couleur) VALUES (?, ?, ?)',
      [s.code || '', s.libelle || '', s.couleur || null]
    );
    res.status(201).json({ idStatut: result.insertId, ...s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const s = req.body;
    await db.query('UPDATE statuts SET code=?, libelle=?, couleur=? WHERE idStatut=?',
      [s.code || '', s.libelle || '', s.couleur || null, req.params.id]);
    res.json({ idStatut: Number(req.params.id), ...s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM statuts WHERE idStatut = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;