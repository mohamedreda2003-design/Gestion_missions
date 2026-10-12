const pool = require('./db');

async function seedDemandes() {
  console.log('Insertion des demandes de vehicules...\n');
  try {
    await pool.query("SET NAMES utf8mb4");

    const [count] = await pool.query("SELECT COUNT(*) AS n FROM demandes_vehicules");
    console.log(`Lignes existantes : ${count[0].n}`);
    if (count[0].n > 0) {
      const [rows] = await pool.query("SELECT idDemande, numeroDemande, objet, statut FROM demandes_vehicules");
      rows.forEach(d => console.log(`   #${d.idDemande} ${d.numeroDemande} — ${d.objet} [${d.statut}]`));
      process.exit(0);
    }

    // Récupérer 4 agents actifs existants
    const [agents] = await pool.query(
      "SELECT idAgent, idDirection, nom, prenom, matricule FROM agents WHERE actif = 1 ORDER BY idAgent LIMIT 4"
    );
    if (agents.length < 4) {
      console.log(`ERREUR : il faut 4 agents actifs. Trouve : ${agents.length}`);
      process.exit(1);
    }
    console.log('Agents utilises :');
    agents.forEach(a => console.log(`   #${a.idAgent} ${a.matricule} ${a.prenom} ${a.nom} (dir ${a.idDirection})`));
    console.log('');

    const demandes = [
      { numeroDemande:'DV/2026/00001', idDemandeur:agents[0].idAgent, idDirection:agents[0].idDirection||1,
        objet:'Deplacement pour reunion de coordination', destination:'Casablanca', destinations:'["Casablanca"]',
        dateDepart:'2026-10-15 08:00:00', dateRetour:'2026-10-15 18:00:00', nbPassagers:3,
        personnesTransportees:'["Agent A","Agent B","Agent C"]', motif:'Reunion', statut:'SOUMIS' },
      { numeroDemande:'DV/2026/00002', idDemandeur:agents[1].idAgent, idDirection:agents[1].idDirection||1,
        objet:'Transport materiel informatique', destination:'Marrakech', destinations:'["Marrakech"]',
        dateDepart:'2026-11-10 07:00:00', dateRetour:'2026-11-11 19:00:00', nbPassagers:2,
        personnesTransportees:'["Agent D","Agent E"]', motif:'Livraison', statut:'VALIDE' },
      { numeroDemande:'DV/2026/00003', idDemandeur:agents[2].idAgent, idDirection:agents[2].idDirection||1,
        objet:'Visite de terrain - audit interne', destination:'Rabat', destinations:'["Rabat"]',
        dateDepart:'2026-09-28 08:00:00', dateRetour:'2026-09-28 17:00:00', nbPassagers:1,
        personnesTransportees:'["Agent F"]', motif:'Audit', statut:'BROUILLON' },
      { numeroDemande:'DV/2026/00004', idDemandeur:agents[3].idAgent, idDirection:agents[3].idDirection||1,
        objet:'Deplacement aeroport - mission etrangere', destination:'Casablanca', destinations:'["Casablanca"]',
        dateDepart:'2026-11-15 06:00:00', dateRetour:'2026-11-15 12:00:00', nbPassagers:2,
        personnesTransportees:'["Agent G","Agent H"]', motif:'Mission officielle', statut:'BROUILLON' }
    ];

    let ok = 0;
    for (const d of demandes) {
      try {
        const [result] = await pool.query(`
          INSERT INTO demandes_vehicules 
          (numeroDemande, idDemandeur, idDirection, objet, destination, destinations,
           dateDepart, dateRetour, nbPassagers, personnesTransportees, motif, statut, dateCreation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [d.numeroDemande, d.idDemandeur, d.idDirection, d.objet, d.destination, d.destinations,
            d.dateDepart, d.dateRetour, d.nbPassagers, d.personnesTransportees, d.motif, d.statut]);
        console.log(`   OK #${result.insertId} ${d.numeroDemande} [${d.statut}]`);
        ok++;
      } catch (e) {
        console.log(`   ERREUR sur ${d.numeroDemande} : ${e.message}`);
      }
    }

    console.log(`\n${ok} / 4 demandes inserees.\n`);
    process.exit(0);
  } catch (e) {
    console.error('\nErreur :', e.message, '\n');
    process.exit(1);
  }
}

seedDemandes();