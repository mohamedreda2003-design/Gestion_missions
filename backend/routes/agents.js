const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM agents ORDER BY nom, prenom');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM agents WHERE idAgent = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Agent introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const a = req.body;
    const sql = `INSERT INTO agents 
      (matricule, nom, prenom, email, telephone, adresse, fonction, grade, affectation, taux, idDirection, idSuperieur, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valeurs = [
      a.matricule || null, a.nom || '', a.prenom || '', a.email || null,
      a.telephone || null, a.adresse || null, a.fonction || null, a.grade || null,
      a.affectation || null, a.taux || 0, a.idDirection || null,
      a.idSuperieur || null, a.actif !== false ? 1 : 0
    ];
    const [result] = await db.query(sql, valeurs);
    res.status(201).json({ idAgent: result.insertId, ...a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const a = req.body;
    const sql = `UPDATE agents SET 
      matricule=?, nom=?, prenom=?, email=?, telephone=?, adresse=?, 
      fonction=?, grade=?, affectation=?, taux=?, idDirection=?, idSuperieur=?, actif=?
      WHERE idAgent=?`;
    const valeurs = [
      a.matricule || null, a.nom || '', a.prenom || '', a.email || null,
      a.telephone || null, a.adresse || null, a.fonction || null, a.grade || null,
      a.affectation || null, a.taux || 0, a.idDirection || null,
      a.idSuperieur || null, a.actif !== false ? 1 : 0, req.params.id
    ];
    await db.query(sql, valeurs);
    res.json({ idAgent: Number(req.params.id), ...a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM agents WHERE idAgent = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;