const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM types_frais ORDER BY idTypeFrais');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM types_frais WHERE idTypeFrais = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Type de frais introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const t = req.body;
    const [result] = await db.query('INSERT INTO types_frais (libelle) VALUES (?)', [t.libelle || '']);
    res.status(201).json({ idTypeFrais: result.insertId, ...t });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const t = req.body;
    await db.query('UPDATE types_frais SET libelle=? WHERE idTypeFrais=?', [t.libelle || '', req.params.id]);
    res.json({ idTypeFrais: Number(req.params.id), ...t });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM types_frais WHERE idTypeFrais = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;