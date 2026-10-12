/* =====================================================
   ROUTES DEMANDES DE VÉHICULES
   ===================================================== */
const express = require('express');
const router = express.Router();
const db = require('../db');

/* =====================================================
   GET /api/demandes-vehicules — Liste toutes les demandes
   ===================================================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM demandes_vehicules ORDER BY dateCreation DESC');
    // Parser les JSON stockés en TEXT
    const demandes = rows.map(d => ({
      ...d,
      destinations:           safeParseJSON(d.destinations),
      personnesTransportees:  safeParseJSON(d.personnesTransportees),
      historique:             safeParseJSON(d.historique)
    }));
    res.json(demandes);
  } catch (err) {
    console.error('❌ GET demandes-vehicules :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET /api/demandes-vehicules/:id — Détail d'une demande
   ===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM demandes_vehicules WHERE idDemande = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Demande introuvable' });
    const d = rows[0];
    res.json({
      ...d,
      destinations:           safeParseJSON(d.destinations),
      personnesTransportees:  safeParseJSON(d.personnesTransportees),
      historique:             safeParseJSON(d.historique)
    });
  } catch (err) {
    console.error('❌ GET demandes-vehicules/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   POST /api/demandes-vehicules — Créer une demande
   ⭐ C'EST ICI QUE SE TROUVE LE CORRECTIF
   ===================================================== */
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    console.log('📥 POST /demandes-vehicules reçu :', JSON.stringify(d, null, 2));

    // ⭐ Génération auto du numéro si absent
    let numeroDemande = d.numeroDemande;
    if (!numeroDemande) {
      const annee = new Date().getFullYear();
      const [maxRows] = await db.query('SELECT COUNT(*) as total FROM demandes_vehicules');
      const nextId = (maxRows[0].total || 0) + 1;
      numeroDemande = `DV/${annee}/${String(nextId).padStart(5, '0')}`;
    }

    // ⭐ Sérialisation JSON obligatoire pour les colonnes longtext
    const destinationsJson = typeof d.destinations === 'string'
      ? d.destinations
      : JSON.stringify(d.destinations || []);
    const personnesJson = typeof d.personnesTransportees === 'string'
      ? d.personnesTransportees
      : JSON.stringify(d.personnesTransportees || []);

    const sql = `
      INSERT INTO demandes_vehicules 
      (numeroDemande, idDemandeur, idDirection, objet, destination, destinations,
       dateDepart, dateRetour, nbPassagers, personnesTransportees, motif, statut, 
       dateCreation, idVehicule, idChauffeur, commentaireValidateur, historique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valeurs = [
      numeroDemande,
      d.idDemandeur      || null,
      d.idDirection      || null,
      d.objet            || '',
      d.destination      || null,
      destinationsJson,
      d.dateDepart       || null,
      d.dateRetour       || null,
      d.nbPassagers      || 0,
      personnesJson,
      d.motif            || null,
      d.statut           || 'BROUILLON',
      d.dateCreation     || new Date(),
      d.idVehicule       || null,
      d.idChauffeur      || null,
      d.commentaireValidateur || null,
      JSON.stringify(d.historique || [])
    ];

    const [result] = await db.query(sql, valeurs);
    console.log('✅ Demande insérée, idDemande =', result.insertId);

    // Retourner l'objet complet
    const [newRows] = await db.query('SELECT * FROM demandes_vehicules WHERE idDemande = ?', [result.insertId]);
    const nouvelle = newRows[0];
    res.status(201).json({
      ...nouvelle,
      destinations:          safeParseJSON(nouvelle.destinations),
      personnesTransportees: safeParseJSON(nouvelle.personnesTransportees),
      historique:            safeParseJSON(nouvelle.historique)
    });
  } catch (err) {
    console.error('❌ POST /demandes-vehicules :', err);
    res.status(500).json({ 
      error: err.message,
      sqlMessage: err.sqlMessage,
      sqlCode: err.code
    });
  }
});

/* =====================================================
   PUT /api/demandes-vehicules/:id — Modifier une demande
   ===================================================== */
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    const id = req.params.id;

    const destinationsJson = typeof d.destinations === 'string'
      ? d.destinations
      : JSON.stringify(d.destinations || []);
    const personnesJson = typeof d.personnesTransportees === 'string'
      ? d.personnesTransportees
      : JSON.stringify(d.personnesTransportees || []);

    const sql = `
      UPDATE demandes_vehicules SET
        objet = ?, destination = ?, destinations = ?,
        dateDepart = ?, dateRetour = ?, nbPassagers = ?, personnesTransportees = ?,
        motif = ?, statut = ?, idVehicule = ?, idChauffeur = ?,
        commentaireValidateur = ?, dateSoumission = ?, dateValidation = ?,
        dateAffectation = ?, dateFin = ?, historique = ?
      WHERE idDemande = ?
    `;

    const valeurs = [
      d.objet            || '',
      d.destination      || null,
      destinationsJson,
      d.dateDepart       || null,
      d.dateRetour       || null,
      d.nbPassagers      || 0,
      personnesJson,
      d.motif            || null,
      d.statut           || 'BROUILLON',
      d.idVehicule       || null,
      d.idChauffeur      || null,
      d.commentaireValidateur || null,
      d.dateSoumission   || null,
      d.dateValidation   || null,
      d.dateAffectation  || null,
      d.dateFin          || null,
      JSON.stringify(d.historique || []),
      id
    ];

    const [result] = await db.query(sql, valeurs);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Demande introuvable' });

    const [newRows] = await db.query('SELECT * FROM demandes_vehicules WHERE idDemande = ?', [id]);
    const maj = newRows[0];
    res.json({
      ...maj,
      destinations:          safeParseJSON(maj.destinations),
      personnesTransportees: safeParseJSON(maj.personnesTransportees),
      historique:            safeParseJSON(maj.historique)
    });
  } catch (err) {
    console.error('❌ PUT /demandes-vehicules/:id :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   DELETE /api/demandes-vehicules/:id
   ===================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM demandes_vehicules WHERE idDemande = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Demande introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /demandes-vehicules/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   UTILITAIRE : parse JSON safe
   ===================================================== */
function safeParseJSON(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { 
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch { 
    return []; 
  }
}

module.exports = router;