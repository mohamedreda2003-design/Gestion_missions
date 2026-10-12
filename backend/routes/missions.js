const express = require('express');
const router = express.Router();
const db = require('../db');

function parseMission(m) {
  return {
    ...m,
    frais:        safeJSON(m.frais),
    itineraires:  safeJSON(m.itineraires),
    participants: safeJSON(m.participants)
  };
}
function safeJSON(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

/* Convertit en YYYY-MM-DD */
function toDateOnly(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.substring(0, 10);
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/* Convertit en YYYY-MM-DD HH:MM:SS */
function toDateTime(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    const s = d.replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) return s + ':00';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + ' 00:00:00';
    return s;
  }
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

/* =====================================================
   GET /api/missions
   ===================================================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM missions ORDER BY dateEmission DESC');
    res.json(rows.map(parseMission));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =====================================================
   GET /api/missions/:id
   ===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM missions WHERE idMission = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Mission introuvable' });
    res.json(parseMission(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =====================================================
   POST /api/missions — Créer une mission
   ⭐ CORRECTION : Retire idVehicule et idChauffeur (n'existent pas)
   ===================================================== */
router.post('/', async (req, res) => {
  try {
    const m = req.body;
    console.log('📥 POST /api/missions reçu :', JSON.stringify(m, null, 2));

    // Générer numeroOm UNIQUE
    const annee = new Date().getFullYear();
    const [maxRows] = await db.query('SELECT MAX(idMission) AS maxId FROM missions');
    const nextId = (maxRows[0].maxId || 0) + 1;
    let numeroOm = m.numeroOm;
    if (!numeroOm || numeroOm.trim() === '') {
      numeroOm = `OM/${annee}/${String(nextId).padStart(5, '0')}`;
    }
    const [exist] = await db.query('SELECT idMission FROM missions WHERE numeroOm = ?', [numeroOm]);
    if (exist.length) {
      numeroOm = `OM/${annee}/${String(nextId + 1).padStart(5, '0')}`;
    }
    console.log('📌 numeroOm final =', numeroOm);

    // ⭐ SQL SANS idVehicule ni idChauffeur
    const sql = `INSERT INTO missions 
      (numeroOm, objet, contexte, dateEmission, dateDepart, dateRetour, 
       lieuDepart, lieuPrincipal, pays, budgetPrevisionnel, montantTotal, 
       idDemandeur, idDirection, idStatut, idWorkflow, 
       participants, itineraires, frais)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const valeurs = [
      numeroOm,
      m.objet || '',
      m.contexte || null,
      toDateOnly(m.dateEmission) || toDateOnly(new Date()),
      toDateTime(m.dateDepart),
      toDateTime(m.dateRetour),
      m.lieuDepart || null,
      m.lieuPrincipal || null,
      m.pays || 'Maroc',
      m.budgetPrevisionnel || 0,
      m.montantTotal || 0,
      m.idDemandeur || null,
      m.idDirection || null,
      m.idStatut || 1,
      m.idWorkflow || null,
      JSON.stringify(m.participants || []),
      JSON.stringify(m.itineraires || []),
      JSON.stringify(m.frais || [])
    ];

    const [result] = await db.query(sql, valeurs);
    console.log('✅ Mission insérée, idMission =', result.insertId);

    res.status(201).json({ idMission: result.insertId, numeroOm, ...m });
  } catch (err) {
    console.error('❌ POST /api/missions :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage, sqlCode: err.code });
  }
});

/* =====================================================
   PUT /api/missions/:id — Modifier une mission
   ⭐ CORRECTION : Retire idVehicule et idChauffeur
   ===================================================== */
router.put('/:id', async (req, res) => {
  try {
    const m = req.body;
    const sql = `UPDATE missions SET 
      objet=?, contexte=?, dateEmission=?, dateDepart=?, dateRetour=?, 
      lieuDepart=?, lieuPrincipal=?, pays=?, budgetPrevisionnel=?, montantTotal=?, 
      idDirection=?, idWorkflow=?, idStatut=?, 
      frais=?, itineraires=?, participants=?
      WHERE idMission=?`;

    await db.query(sql, [
      m.objet || '',
      m.contexte || null,
      toDateOnly(m.dateEmission),
      toDateTime(m.dateDepart),
      toDateTime(m.dateRetour),
      m.lieuDepart || null,
      m.lieuPrincipal || null,
      m.pays || 'Maroc',
      m.budgetPrevisionnel || 0,
      m.montantTotal || 0,
      m.idDirection || null,
      m.idWorkflow || null,
      m.idStatut || 1,
      JSON.stringify(m.frais || []),
      JSON.stringify(m.itineraires || []),
      JSON.stringify(m.participants || []),
      req.params.id
    ]);
    res.json({ idMission: Number(req.params.id), ...m });
  } catch (err) {
    console.error('❌ PUT /api/missions/:id :', err);
    res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
  }
});

/* =====================================================
   DELETE /api/missions/:id
   ===================================================== */
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM missions WHERE idMission = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;