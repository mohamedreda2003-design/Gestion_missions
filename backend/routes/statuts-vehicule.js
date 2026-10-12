const express = require('express');
const router = express.Router();
const db = require('../db');

/* =====================================================
   GET /api/statuts-vehicule
   ===================================================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM statuts_vehicule ORDER BY idStatut');
    res.json(rows);
  } catch (err) {
    console.error('❌ GET /api/statuts-vehicule :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   GET /api/statuts-vehicule/:id
   ===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM statuts_vehicule WHERE idStatut = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Statut véhicule introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ GET /api/statuts-vehicule/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   POST /api/statuts-vehicule
   ===================================================== */
router.post('/', async (req, res) => {
  try {
    const s = req.body;
    const [result] = await db.query(
      'INSERT INTO statuts_vehicule (code, libelle) VALUES (?, ?)',
      [s.code || '', s.libelle || '']
    );
    res.status(201).json({ idStatut: result.insertId, ...s });
  } catch (err) {
    console.error('❌ POST /api/statuts-vehicule :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   PUT /api/statuts-vehicule/:id
   ===================================================== */
router.put('/:id', async (req, res) => {
  try {
    const s = req.body;
    await db.query(
      'UPDATE statuts_vehicule SET code = ?, libelle = ? WHERE idStatut = ?',
      [s.code || '', s.libelle || '', req.params.id]
    );
    res.json({ idStatut: Number(req.params.id), ...s });
  } catch (err) {
    console.error('❌ PUT /api/statuts-vehicule/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   DELETE /api/statuts-vehicule/:id
   ===================================================== */
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM statuts_vehicule WHERE idStatut = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /api/statuts-vehicule/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;