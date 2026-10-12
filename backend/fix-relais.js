const pool = require('./db');

async function seedDemandes() {
  console.log('Insertion des demandes de véhicules...\n');
  try {
    await pool.query("SET NAMES utf8mb4");

    // 1. Voir les colonnes existantes
    const [cols] = await pool.query("SHOW COLUMNS FROM demandes_vehicules");
    const nomsColonnes = cols.map(c => c.Field);
    console.log('Colonnes disponibles :', nomsColonnes.join(', '), '\n');

    // 2. Vérifier si vide
    const [count] = await pool.query("SELECT COUNT(*) AS n FROM demandes_vehicules");
    if (count[0].n > 0) {
      console.log(`La table contient déjà ${count[0].n} demande(s). Rien à faire.`);
      process.exit(0);
    }

    // 3. Insérer une demande test avec les colonnes qui existent
    const demande = {
      numeroDemande: 'DV/2026/TEST1',
      idDemandeur: 3,
      idDirection: 1,
      objet: 'Deplacement pour reunion de coordination',
      destination: 'Casablanca',
      destinations: '["Casablanca"]',
      dateDepart: '2026-10-15 08:00:00',
      dateRetour: '2026-10-15 18:00:00',
      nbPassagers: 3,
      personnesTransportees: '["Youssef TAZI","Ahmed ZEROUALI"]',
      motif: 'Reunion avec la direction regionale',
      statut: 'SOUMIS',
      dateCreation: '2026-10-01 10:00:00'
    };

    // Ne garder que les colonnes qui existent
    const data = {};
    Object.keys(demande).forEach(k => {
      if (nomsColonnes.includes(k)) data[k] = demande[k];
    });

    console.log('Colonnes utilisées :', Object.keys(data).join(', '), '\n');

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO demandes_vehicules (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${placeholders})`;

    const [result] = await pool.query(sql, values);
    console.log(`✅ Demande insérée avec succès (idDemande = ${result.insertId})\n`);

    // Vérification
    const [final] = await pool.query("SELECT * FROM demandes_vehicules");
    console.log(`Total de demandes en base : ${final.length}`);
    final.forEach(d => {
      console.log(`   #${d.idDemande} ${d.numeroDemande} — ${d.objet} (${d.statut})`);
    });

    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  }
}

seedDemandes();