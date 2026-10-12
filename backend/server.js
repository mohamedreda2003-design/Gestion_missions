/* =====================================================
   SERVEUR EXPRESS — Gestion des Missions
   ===================================================== */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARES ---------- */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- SERVIR LE FRONTEND ---------- */
// ⭐ Sert tous les fichiers statiques (index.html, CSS, JS, images...)
// depuis le dossier PARENT de backend/
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

/* ---------- ROUTE PAR DÉFAUT : renvoyer index.html ---------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ---------- GESTION D'ERREURS ---------- */
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err);
  res.status(500).json({ error: err.message });
});

/* ---------- DÉMARRAGE ---------- */
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré avec succès !`);
  console.log(`📂 Frontend : http://localhost:${PORT}`);
  console.log(`🔌 API : http://localhost:${PORT}/api/...`);
  console.log(`✅ Connecté à la base de données MySQL`);
});