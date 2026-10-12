const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM destinations ORDER BY code');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM destinations WHERE idDestination = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Destination introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const sql = `INSERT INTO destinations (code, libelle, ville, pays, region, distanceRef, actif) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      d.code || '', d.libelle || '', d.ville || null, d.pays || 'Maroc',
      d.region || null, d.distanceRef || 0, d.actif !== false ? 1 : 0
    ]);
    res.status(201).json({ idDestination: result.insertId, ...d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const sql = `UPDATE destinations SET code=?, libelle=?, ville=?, pays=?, region=?, distanceRef=?, actif=? WHERE idDestination=?`;
    await db.query(sql, [
      d.code || '', d.libelle || '', d.ville || null, d.pays || 'Maroc',
      d.region || null, d.distanceRef || 0, d.actif !== false ? 1 : 0, req.params.id
    ]);
    res.json({ idDestination: Number(req.params.id), ...d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM destinations WHERE idDestination = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;