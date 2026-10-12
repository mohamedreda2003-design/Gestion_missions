const pool = require('./db');

async function seedAgents() {
  console.log('Insertion des agents...\n');
  try {
    await pool.query("SET NAMES utf8mb4");

    const [count] = await pool.query("SELECT COUNT(*) AS n FROM agents");
    if (count[0].n > 0) {
      console.log(`La table contient déjà ${count[0].n} agent(s). Affichage :`);
      const [rows] = await pool.query("SELECT idAgent, matricule, nom, prenom FROM agents ORDER BY idAgent");
      rows.forEach(a => console.log(`   #${a.idAgent} ${a.matricule} ${a.prenom} ${a.nom}`));
      process.exit(0);
    }

    await pool.query(`
      INSERT INTO agents (idAgent, matricule, nom, prenom, email, telephone, adresse, fonction, grade, taux, idDirection, idSuperieur, affectation, actif) VALUES
      (1,'AG001','BENANI','Karim','k.benani@gov.ma','+212 6 61 11 22 33','12 Rue Oued Fes Agdal Rabat','Directeur','Administrateur 1er grade',500,1,NULL,'Direction Generale',1),
      (2,'AG002','EL FASSI','Salma','s.elfassi@gov.ma','+212 6 62 22 33 44','45 Avenue Mohammed V Hassan Rabat','Chef de service','Administrateur 2e grade',400,1,1,'Service Administration',1),
      (3,'AG003','TAZI','Youssef','y.tazi@gov.ma','+212 6 63 33 44 55','8 Rue Ibn Sina Agdal Rabat','Redacteur','Redacteur principal',300,1,2,'Bureau ordre',1),
      (4,'AG004','AMRANI','Nadia','n.amrani@gov.ma','+212 6 64 44 55 66','22 Boulevard Zerktouni Casablanca','Directrice','Administrateur 1er grade',500,2,NULL,'Direction DRH',1),
      (5,'AG005','CHAKIR','Hassan','h.chakir@gov.ma','+212 6 65 55 66 77','3 Rue Al Massira Hay Riad Rabat','Chef de service','Administrateur 2e grade',400,2,4,'Service Formation',1),
      (6,'AG006','BOUZID','Leila','l.bouzid@gov.ma','+212 6 66 66 77 88','17 Rue Oum Rabia Agdal Rabat','Ingenieur','Ingenieur Etat',350,3,7,'Service Etudes',1),
      (7,'AG007','SAIDI','Omar','o.saidi@gov.ma','+212 6 67 77 88 99','60 Avenue Al Amir Moulay Abdellah Rabat','Directeur','Administrateur 1er grade',500,3,NULL,'Direction DSI',1),
      (8,'AG008','ALAOUI','Fatima','f.alaoui@gov.ma','+212 6 68 88 99 00','5 Rue Tanger Quartier Administratif Rabat','Controleur DAF','Administrateur 2e grade',400,1,1,'Controle de gestion',1),
      (9,'AG009','ZEROUALI','Ahmed','a.zerouali@gov.ma','+212 6 69 99 00 11','19 Rue Meknes Agdal Rabat','Chef de mission','Administrateur 3e grade',350,3,7,'Service Projets',1),
      (10,'AG010','HADDAD','Rachid','r.haddad@gov.ma','+212 6 70 00 11 22','14 Rue Sale Takaddoum Rabat','Chauffeur','Agent technique',200,1,2,'Parc Auto',1),
      (11,'AG011','BERRADA','Mounir','m.berrada@gov.ma','+212 6 71 11 22 33','25 Avenue Hassan II Agdal Rabat','Directeur DAAJ','Administrateur 1er grade',500,5,NULL,'Direction DAAJ',1),
      (12,'AG012','LAMRANI','Sanaa','s.lamrani@gov.ma','+212 6 72 22 33 44','30 Rue Oued Ziz Agdal Rabat','Chef de service SSPA','Administrateur 2e grade',400,6,11,'Service Support',1),
      (13,'AG013','IDRISSI','Hicham','h.idrissi@gov.ma','+212 6 73 33 44 55','8 Rue Tafilalet Agdal Rabat','Agent SSPA','Redacteur principal',300,6,12,'Parc Auto',1)
    `);
    console.log('13 agents inseres.');

    const [rows] = await pool.query("SELECT idAgent, matricule, nom, prenom FROM agents ORDER BY idAgent");
    console.log('\nAgents en base :');
    rows.forEach(a => console.log(`   #${a.idAgent} ${a.matricule} ${a.prenom} ${a.nom}`));
    console.log('\nTermine !');
    process.exit(0);
  } catch (e) {
    console.error('Erreur :', e.message);
    process.exit(1);
  }
}

seedAgents();