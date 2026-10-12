const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM directions ORDER BY codeDirection');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM directions WHERE idDirection = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Direction introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const sql = `INSERT INTO directions (codeDirection, libelle, idDirectionParent, actif) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      d.codeDirection || '', d.libelle || '', d.idDirectionParent || null, d.actif !== false ? 1 : 0
    ]);
    res.status(201).json({ idDirection: result.insertId, ...d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const sql = `UPDATE directions SET codeDirection=?, libelle=?, idDirectionParent=?, actif=? WHERE idDirection=?`;
    await db.query(sql, [
      d.codeDirection || '', d.libelle || '', d.idDirectionParent || null,
      d.actif !== false ? 1 : 0, req.params.id
    ]);
    res.json({ idDirection: Number(req.params.id), ...d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM directions WHERE idDirection = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;