const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM validations ORDER BY dateCreation DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM validations WHERE idValidation = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Validation introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const v = req.body;
    const sql = `INSERT INTO validations 
      (idMission, idValidateur, niveau, libelleEtape, decision, commentaire, dateCreation, dateDecision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      v.idMission || null, v.idValidateur || null, v.niveau || 1,
      v.libelleEtape || null, v.decision || 'EN_ATTENTE',
      v.commentaire || null, v.dateCreation || new Date(), v.dateDecision || null
    ]);
    res.status(201).json({ idValidation: result.insertId, ...v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const v = req.body;
    const sql = `UPDATE validations SET 
      idMission=?, idValidateur=?, niveau=?, libelleEtape=?, decision=?, commentaire=?, dateDecision=?
      WHERE idValidation=?`;
    await db.query(sql, [
      v.idMission || null, v.idValidateur || null, v.niveau || 1,
      v.libelleEtape || null, v.decision || 'EN_ATTENTE',
      v.commentaire || null, v.dateDecision || null, req.params.id
    ]);
    res.json({ idValidation: Number(req.params.id), ...v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM validations WHERE idValidation = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suppression en masse par mission
router.delete('/mission/:idMission', async (req, res) => {
  try {
    await db.query('DELETE FROM validations WHERE idMission = ?', [req.params.idMission]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;