/* =====================================================
   SERVEUR EXPRESS — Gestion des Missions
   ===================================================== */
const express = require('express');
const path = require('path');
const db = require('./db');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

/* ---------- MIDDLEWARES ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Health check MySQL failed:', err.message);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/auth', require('./routes/auth'));

// Toutes les routes métier exigent un compte actif et une session serveur signée.
app.use('/api', requireAuth);

/* ---------- SERVIR LE FRONTEND ---------- */
app.use(express.static(path.join(__dirname, '..')));

/* ---------- ROUTES API ---------- */
app.use('/api/agents',              require('./routes/agents'));
app.use('/api/directions',          require('./routes/directions'));
app.use('/api/destinations',        require('./routes/destinations'));
app.use('/api/missions',            require('./routes/missions'));
app.use('/api/validations',         require('./routes/validations'));
app.use('/api/workflows',           require('./routes/workflows'));
app.use('/api/statuts',             require('./routes/statuts'));
app.use('/api/transports',          require('./routes/transports'));
app.use('/api/types-frais',         require('./routes/types-frais'));
app.use('/api/users',               require('./routes/users'));
app.use('/api/roles',               require('./routes/roles'));
app.use('/api/vehicules',           require('./routes/vehicules'));
app.use('/api/demandes-vehicules',  require('./routes/demandes-vehicules'));
app.use('/api/statuts-vehicule',    require('./routes/statuts-vehicule'));

/* ---------- ROUTE PAR DÉFAUT ---------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ---------- GESTION D'ERREURS ---------- */
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

/* ---------- DÉMARRAGE ---------- */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Frontend et API prêts ; MySQL sera vérifié par /api/health.`);
});
