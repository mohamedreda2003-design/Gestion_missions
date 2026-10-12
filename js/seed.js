const pool = require('./db');

async function seed() {
  console.log('🌱 Insertion des données de démo...\n');
  
  try {
    // ============ DIRECTIONS ============
    await pool.query(`
      INSERT IGNORE INTO directions (idDirection, codeDirection, libelle, idDirectionParent, actif) VALUES
      (1,'DAF','Direction Administrative et Financière',NULL,1),
      (2,'DRH','Direction des Ressources Humaines',NULL,1),
      (3,'DSI','Direction des Systèmes d\\'Information',NULL,1),
      (4,'DAJ','Direction des Affaires Juridiques',NULL,1),
      (5,'DAAJ','Direction des Affaires Administratives et Juridiques',NULL,1),
      (6,'SSPA','Service de Support et du Parc Auto',5,1)
    `);
    console.log('  ✓ directions');

    // ============ STATUTS ============
    await pool.query(`
      INSERT IGNORE INTO statuts (idStatut, code, libelle) VALUES
      (1,'BROUILLON','Brouillon'),
      (2,'SOUMIS','Soumis au directeur'),
      (3,'VALIDE_N1','Validé par le directeur — en attente DAAJ'),
      (4,'VALIDE_N2','Validé par le DAAJ — transmis au SSPA'),
      (5,'VALIDE','Validé définitivement'),
      (6,'REJETE','Rejeté'),
      (7,'EN_COURS','Mission en cours'),
      (8,'CLOTURE','Clôturé'),
      (9,'ANNULE','Annulé'),
      (10,'TRANSMIS_SSPA','Transmis au SSPA pour traitement'),
      (11,'OM_ETABLI','Ordre de mission établi')
    `);
    console.log('  ✓ statuts');

    // ============ STATUTS VÉHICULE ============
    await pool.query(`
      INSERT IGNORE INTO statuts_vehicule (idStatut, code, libelle) VALUES
      (1,'BROUILLON','Brouillon'),
      (2,'SOUMIS','Soumis — en attente'),
      (3,'VALIDE','Validé'),
      (4,'REFUSE','Refusé'),
      (5,'AFFECTE','Véhicule affecté'),
      (6,'TERMINE','Terminé'),
      (7,'ANNULE','Annulé')
    `);
    console.log('  ✓ statuts_vehicule');

    // ============ TRANSPORTS ============
    await pool.query(`
      INSERT IGNORE INTO transports (idTransport, code, libelle, tarifKm) VALUES
      (1,'VEH_SERV','Véhicule de service',0),
      (2,'VEH_PERS','Véhicule personnel',3.5),
      (3,'TRAIN','Train',0),
      (4,'AVION','Avion',0),
      (5,'BUS','Autocar / Bus',0),
      (6,'TAXI','Taxi',0)
    `);
    console.log('  ✓ transports');

    // ============ TYPES FRAIS ============
    await pool.query(`
      INSERT IGNORE INTO types_frais (idTypeFrais, code, libelle, plafondUnitaire) VALUES
      (1,'HEBERGEMENT','Hébergement',500),
      (2,'REPAS','Restauration',150),
      (3,'TRANSPORT','Frais de transport',0),
      (4,'CARBURANT','Carburant',0),
      (5,'PEAGE','Péages',0),
      (6,'DIVERS','Frais divers',200)
    `);
    console.log('  ✓ types_frais');

    // ============ DESTINATIONS ============
    await pool.query(`
      INSERT IGNORE INTO destinations (idDestination, code, libelle, ville, pays, region, distanceRef, actif) VALUES
      (1,'RABAT','Rabat','Rabat','Maroc','Rabat-Salé-Kénitra',0,1),
      (2,'CASABLANCA','Casablanca','Casablanca','Maroc','Casablanca-Settat',90,1),
      (3,'MARRAKECH','Marrakech','Marrakech','Maroc','Marrakech-Safi',240,1),
      (4,'FES','Fès','Fès','Maroc','Fès-Meknès',200,1),
      (5,'TANGER','Tanger','Tanger','Maroc','Tanger-Tétouan-Al Hoceïma',250,1),
      (6,'AGADIR','Agadir','Agadir','Maroc','Souss-Massa',570,1),
      (7,'PARIS','Paris','Paris','France','Île-de-France',2000,1),
      (8,'MADRID','Madrid','Madrid','Espagne','Communauté de Madrid',1200,1),
      (9,'BRUXELLES','Bruxelles','Bruxelles','Belgique','Bruxelles-Capitale',2300,1),
      (10,'GENEVE','Genève','Genève','Suisse','Genève',2200,1)
    `);
    console.log('  ✓ destinations');

    // ============ AGENTS ============
    await pool.query(`
      INSERT IGNORE INTO agents (idAgent, matricule, nom, prenom, email, telephone, adresse, fonction, grade, taux, idDirection, idSuperieur, affectation, actif) VALUES
      (1,'AG001','BENANI','Karim','k.benani@gov.ma','+212 6 61 11 22 33','12, Rue Oued Fès, Agdal, Rabat','Directeur','Administrateur 1er grade',500,1,NULL,'Direction Générale',1),
      (2,'AG002','EL FASSI','Salma','s.elfassi@gov.ma','+212 6 62 22 33 44','45, Avenue Mohammed V, Hassan, Rabat','Chef de service','Administrateur 2e grade',400,1,1,'Service Administration',1),
      (3,'AG003','TAZI','Youssef','y.tazi@gov.ma','+212 6 63 33 44 55','8, Rue Ibn Sina, Agdal, Rabat','Rédacteur','Rédacteur principal',300,1,2,'Bureau d\\'ordre',1),
      (4,'AG004','AMRANI','Nadia','n.amrani@gov.ma','+212 6 64 44 55 66','22, Boulevard Zerktouni, Casablanca','Directrice','Administrateur 1er grade',500,2,NULL,'Direction DRH',1),
      (5,'AG005','CHAKIR','Hassan','h.chakir@gov.ma','+212 6 65 55 66 77','3, Rue Al Massira, Hay Riad, Rabat','Chef de service','Administrateur 2e grade',400,2,4,'Service Formation',1),
      (6,'AG006','BOUZID','Leila','l.bouzid@gov.ma','+212 6 66 66 77 88','17, Rue Oum Rabia, Agdal, Rabat','Ingénieur','Ingénieur d\\'État',350,3,7,'Service Études',1),
      (7,'AG007','SAIDI','Omar','o.saidi@gov.ma','+212 6 67 77 88 99','60, Avenue Al Amir Moulay Abdellah, Rabat','Directeur','Administrateur 1er grade',500,3,NULL,'Direction DSI',1),
      (8,'AG008','ALAOUI','Fatima','f.alaoui@gov.ma','+212 6 68 88 99 00','5, Rue Tanger, Quartier Administratif, Rabat','Contrôleur DAF','Administrateur 2e grade',400,1,1,'Contrôle de gestion',1),
      (9,'AG009','ZEROUALI','Ahmed','a.zerouali@gov.ma','+212 6 69 99 00 11','19, Rue Meknès, Agdal, Rabat','Chef de mission','Administrateur 3e grade',350,3,7,'Service Projets',1),
      (10,'AG010','HADDAD','Rachid','r.haddad@gov.ma','+212 6 70 00 11 22','14, Rue Salé, Takaddoum, Rabat','Chauffeur','Agent technique',200,1,2,'Parc Auto',1),
      (11,'AG011','BERRADA','Mounir','m.berrada@gov.ma','+212 6 71 11 22 33','25, Avenue Hassan II, Agdal, Rabat','Directeur DAAJ','Administrateur 1er grade',500,5,NULL,'Direction DAAJ',1),
      (12,'AG012','LAMRANI','Sanaa','s.lamrani@gov.ma','+212 6 72 22 33 44','30, Rue Oued Ziz, Agdal, Rabat','Chef de service SSPA','Administrateur 2e grade',400,6,11,'Service Support',1),
      (13,'AG013','IDRISSI','Hicham','h.idrissi@gov.ma','+212 6 73 33 44 55','8, Rue Tafilalet, Agdal, Rabat','Agent SSPA','Rédacteur principal',300,6,12,'Parc Auto',1)
    `);
    console.log('  ✓ agents');

    // ============ RÔLES ============
    await pool.query(`
      INSERT IGNORE INTO roles (idRole, code, libelle, couleur, isSystem, actif, pages) VALUES
      (1,'ADMIN','Administrateur','#d4a017',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","directions","destinations","statistiques","comptes","roles"]'),
      (2,'DIRECTEUR','Directeur','#0b3d91',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","directions","destinations","statistiques"]'),
      (3,'CHEF_SERVICE','Chef de service','#117a8b',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","statistiques"]'),
      (4,'DAF','DAF','#6c757d',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","directions","destinations","statistiques"]'),
      (5,'DAAJ','DAAJ','#004085',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","directions","destinations","statistiques"]'),
      (6,'SSPA','SSPA','#1e7e34',1,1,'["dashboard","missions","validation","vehicules","parc_auto","agents","statistiques"]'),
      (7,'AGENT','Agent','#6c757d',1,1,'["dashboard","missions","vehicules"]')
    `);
    console.log('  ✓ roles');

    // ============ USERS ============
    await pool.query(`
      INSERT IGNORE INTO users (idUtilisateur, login, password : 'admin', idAgent, role, actif) VALUES
      (1,'k.benani','demo',1,'DIRECTEUR',1),
      (2,'s.elfassi','demo',2,'CHEF_SERVICE',1),
      (3,'y.tazi','demo',3,'AGENT',1),
      (4,'f.alaoui','demo',8,'DAF',1),
      (5,'admin','admin',NULL,'ADMIN',1),
      (6,'daaj','demo',11,'DAAJ',1),
      (7,'sspa','demo',12,'SSPA',1)
    `);
    console.log('  ✓ users');

    console.log('\n✅ Toutes les données de démo ont été insérées !');
    console.log('   Vous pouvez maintenant vous connecter avec :');
    console.log('   - admin / admin');
    console.log('   - y.tazi / demo\n');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  }
}

seed();