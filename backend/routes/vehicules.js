const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicules ORDER BY immatriculation');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicules WHERE idVehicule = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Véhicule introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const v = req.body;
    const sql = `INSERT INTO vehicules 
      (immatriculation, marque, modele, type, genre, categorie, dateMiseCirculation, cv, chassis, carburant,
       idDirection, service, affectation, utilisateur, assurance, ville, capacite, statut, notes, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      v.immatriculation || '', v.marque || '', v.modele || '',
      v.type || null, v.genre || null, v.categorie || null,
      v.dateMiseCirculation || null, v.cv || 0, v.chassis || null, v.carburant || null,
      v.idDirection || null, v.service || null, v.affectation || null,
      v.utilisateur || null, v.assurance || null, v.ville || null,
      v.capacite || 5, v.statut || 'DISPONIBLE', v.notes || null, v.actif !== false ? 1 : 0
    ]);
    res.status(201).json({ idVehicule: result.insertId, ...v });
  } catch (err) { res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage }); }
});

router.put('/:id', async (req, res) => {
  try {
    const v = req.body;
    const sql = `UPDATE vehicules SET 
      immatriculation=?, marque=?, modele=?, type=?, genre=?, categorie=?, dateMiseCirculation=?,
      cv=?, chassis=?, carburant=?, idDirection=?, service=?, affectation=?, utilisateur=?,
      assurance=?, ville=?, capacite=?, statut=?, notes=?, actif=?
      WHERE idVehicule=?`;
    await db.query(sql, [
      v.immatriculation || '', v.marque || '', v.modele || '',
      v.type || null, v.genre || null, v.categorie || null,
      v.dateMiseCirculation || null, v.cv || 0, v.chassis || null, v.carburant || null,
      v.idDirection || null, v.service || null, v.affectation || null,
      v.utilisateur || null, v.assurance || null, v.ville || null,
      v.capacite || 5, v.statut || 'DISPONIBLE', v.notes || null, v.actif !== false ? 1 : 0,
      req.params.id
    ]);
    res.json({ idVehicule: Number(req.params.id), ...v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vehicules WHERE idVehicule = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;