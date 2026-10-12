const pool = require('./db');

async function seedVehicules() {
  console.log('Insertion vehicules et demandes...\n');
  try {
    await pool.query('SET NAMES utf8mb4');

    // 1. VEHICULES
    await pool.query(`
      INSERT IGNORE INTO vehicules 
      (idVehicule, immatriculation, marque, modele, type, genre, categorie, 
       dateMiseCirculation, cv, chassis, carburant, idDirection, service, 
       affectation, utilisateur, assurance, ville, capacite, statut, actif) VALUES
      (1,'12345-A-6','Dacia','Logan','Berline','Vehicule de tourisme','M1','2022-03-15',5,'VF1LZ000123456789','Diesel',6,'Parc Auto','Direction SSPA','Agent SSPA','AXA Assurance','Rabat',5,'DISPONIBLE',1),
      (2,'23456-B-6','Renault','Clio','Citadine','Vehicule de tourisme','M1','2021-06-20',4,'VF1RJA000234567890','Essence',6,'Parc Auto','Direction DRH','Hassan CHAKIR','Wafa Assurance','Rabat',5,'DISPONIBLE',1),
      (3,'34567-C-6','Toyota','Hilux','Pick-up','Camionnette','N1','2020-01-10',7,'AHTFR22G000345678','Diesel',6,'Parc Auto','Service Technique','Ahmed ZEROUALI','Atlanta Sanad','Casablanca',5,'DISPONIBLE',1),
      (4,'45678-D-6','Ford','Transit','Fourgon','Camionnette','N1','2019-11-05',6,'WF0XXXTTG00045678','Diesel',6,'Parc Auto','Direction DSI','Leila BOUZID','MCMA','Rabat',9,'DISPONIBLE',1)
    `);
    console.log('  OK vehicules');

        // 2. DEMANDES DE VEHICULES
    await pool.query(`
      INSERT IGNORE INTO demandes_vehicules 
      (idDemande, numeroDemande, idDemandeur, idDirection, objet, 
       destination, destinations, dateDepart, dateRetour, nbPassagers, 
       personnesTransportees, motif, statut, dateCreation) VALUES
      (1,'DV/2026/00001',3,1,'Deplacement pour reunion de coordination',
       'Casablanca','["Casablanca"]','2026-10-15 08:00:00','2026-10-15 18:00:00',
       3,'["Youssef TAZI","Ahmed ZEROUALI","Karim BENANI"]',
       'Reunion avec la direction regionale','SOUMIS','2026-10-01 10:00:00'),
      (2,'DV/2026/00002',6,3,'Transport materiel informatique',
       'Marrakech','["Marrakech"]','2026-11-10 07:00:00','2026-11-11 19:00:00',
       2,'["Leila BOUZID","Omar SAIDI"]',
       'Livraison de materiel','SOUMIS','2026-11-01 14:00:00'),
      (3,'DV/2026/00003',5,2,'Visite de terrain - audit',
       'Rabat','["Rabat"]','2026-09-28 08:00:00','2026-09-28 17:00:00',
       1,'["Hassan CHAKIR"]',
       'Audit interne','BROUILLON','2026-09-25 09:00:00')
    `);
    console.log('  OK demandes_vehicules');

    // 3. Verification
    const [v] = await pool.query('SELECT COUNT(*) AS n FROM vehicules');
    const [d] = await pool.query('SELECT COUNT(*) AS n FROM demandes_vehicules');
    console.log('\nVehicules en base : ' + v[0].n);
    console.log('Demandes en base  : ' + d[0].n);
    console.log('\nTermine !');
    process.exit(0);
  } catch (e) {
    console.error('Erreur : ' + e.message);
    process.exit(1);
  }
}

seedVehicules();