const express = require('express');
const router = express.Router();
const db = require('../db');

function parseWorkflow(w) {
  return { ...w, etapes: safeJSON(w.etapes) };
}
function safeJSON(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM workflows WHERE actif = 1 ORDER BY idWorkflow');
    res.json(rows.map(parseWorkflow));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM workflows WHERE idWorkflow = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Workflow introuvable' });
    res.json(parseWorkflow(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const w = req.body;
    const [result] = await db.query(
      'INSERT INTO workflows (code, libelle, actif, etapes) VALUES (?, ?, ?, ?)',
      [w.code || '', w.libelle || '', w.actif !== false ? 1 : 0, JSON.stringify(w.etapes || [])]
    );
    res.status(201).json({ idWorkflow: result.insertId, ...w });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const w = req.body;
    await db.query(
      'UPDATE workflows SET code=?, libelle=?, actif=?, etapes=? WHERE idWorkflow=?',
      [w.code || '', w.libelle || '', w.actif !== false ? 1 : 0, JSON.stringify(w.etapes || []), req.params.id]
    );
    res.json({ idWorkflow: Number(req.params.id), ...w });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM workflows WHERE idWorkflow = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;