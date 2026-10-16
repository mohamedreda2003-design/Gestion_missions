-- Exécuter dans la base configurée par DB_NAME (local) ou MYSQLDATABASE (Railway).

-- Schéma correspondant aux noms de colonnes utilisés par backend/routes/*.js.
CREATE TABLE IF NOT EXISTS roles (
  idRole INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(120) NOT NULL,
  couleur VARCHAR(20) NOT NULL DEFAULT '#6c757d',
  isSystem TINYINT(1) NOT NULL DEFAULT 0,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  pages JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS directions (
  idDirection INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codeDirection VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(180) NOT NULL,
  idDirectionParent INT UNSIGNED NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_directions_parent FOREIGN KEY (idDirectionParent) REFERENCES directions(idDirection) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agents (
  idAgent INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  matricule VARCHAR(40) NULL UNIQUE,
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL,
  telephone VARCHAR(40) NULL,
  adresse VARCHAR(255) NULL,
  fonction VARCHAR(150) NULL,
  grade VARCHAR(150) NULL,
  taux DECIMAL(12,2) NOT NULL DEFAULT 0,
  idDirection INT UNSIGNED NULL,
  idSuperieur INT UNSIGNED NULL,
  affectation VARCHAR(180) NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_agents_direction FOREIGN KEY (idDirection) REFERENCES directions(idDirection) ON DELETE SET NULL,
  CONSTRAINT fk_agents_superieur FOREIGN KEY (idSuperieur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  INDEX idx_agents_nom (nom, prenom)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  idUtilisateur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  idAgent INT UNSIGNED NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'AGENT',
  actif TINYINT(1) NOT NULL DEFAULT 1,
  dateLogin DATETIME NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_agent FOREIGN KEY (idAgent) REFERENCES agents(idAgent) ON DELETE SET NULL,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS destinations (
  idDestination INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(140) NOT NULL,
  ville VARCHAR(140) NOT NULL DEFAULT '',
  pays VARCHAR(100) NOT NULL DEFAULT 'Maroc',
  region VARCHAR(140) NULL,
  distanceRef DECIMAL(10,2) NOT NULL DEFAULT 0,
  actif TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS statuts (
  idStatut INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  libelle VARCHAR(180) NOT NULL,
  couleur VARCHAR(20) NULL,
  UNIQUE KEY uq_statuts_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS statuts_vehicule (
  idStatut INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(180) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transports (
  idTransport INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL DEFAULT '',
  libelle VARCHAR(140) NOT NULL,
  tarifKm DECIMAL(10,2) NOT NULL DEFAULT 0,
  actif TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS types_frais (
  idTypeFrais INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL DEFAULT '',
  libelle VARCHAR(140) NOT NULL,
  plafondUnitaire DECIMAL(12,2) NOT NULL DEFAULT 0,
  actif TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflows (
  idWorkflow INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(160) NOT NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  etapes JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS missions (
  idMission INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numeroOm VARCHAR(40) NOT NULL UNIQUE,
  objet VARCHAR(255) NOT NULL,
  contexte TEXT NULL,
  dateEmission DATE NULL,
  dateDepart DATETIME NULL,
  dateRetour DATETIME NULL,
  lieuDepart VARCHAR(140) NULL,
  lieuPrincipal VARCHAR(140) NULL,
  pays VARCHAR(100) NULL,
  budgetPrevisionnel DECIMAL(14,2) NOT NULL DEFAULT 0,
  montantTotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  idDemandeur INT UNSIGNED NULL,
  idDirection INT UNSIGNED NULL,
  idStatut INT UNSIGNED NOT NULL DEFAULT 1,
  idWorkflow INT UNSIGNED NULL,
  participants JSON NOT NULL,
  itineraires JSON NOT NULL,
  frais JSON NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_missions_demandeur FOREIGN KEY (idDemandeur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  CONSTRAINT fk_missions_direction FOREIGN KEY (idDirection) REFERENCES directions(idDirection) ON DELETE SET NULL,
  INDEX idx_missions_statut (idStatut),
  INDEX idx_missions_dates (dateDepart, dateRetour)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validations (
  idValidation INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  idMission INT UNSIGNED NOT NULL,
  idValidateur INT UNSIGNED NULL,
  niveau SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  libelleEtape VARCHAR(180) NULL,
  decision VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
  commentaire TEXT NULL,
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateDecision DATETIME NULL,
  CONSTRAINT fk_validations_mission FOREIGN KEY (idMission) REFERENCES missions(idMission) ON DELETE CASCADE,
  CONSTRAINT fk_validations_agent FOREIGN KEY (idValidateur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  INDEX idx_validations_mission (idMission),
  INDEX idx_validations_decision (decision)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicules (
  idVehicule INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  immatriculation VARCHAR(30) NOT NULL UNIQUE,
  marque VARCHAR(80) NOT NULL,
  modele VARCHAR(80) NOT NULL,
  type VARCHAR(80) NULL,
  genre VARCHAR(100) NULL,
  categorie VARCHAR(40) NULL,
  dateMiseCirculation DATE NULL,
  cv SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  chassis VARCHAR(80) NULL,
  carburant VARCHAR(40) NULL,
  idDirection INT UNSIGNED NULL,
  service VARCHAR(140) NULL,
  affectation VARCHAR(140) NULL,
  utilisateur VARCHAR(140) NULL,
  assurance VARCHAR(140) NULL,
  ville VARCHAR(100) NULL,
  capacite SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  statut VARCHAR(40) NOT NULL DEFAULT 'DISPONIBLE',
  actif TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  CONSTRAINT fk_vehicules_direction FOREIGN KEY (idDirection) REFERENCES directions(idDirection) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS demandes_vehicules (
  idDemande INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numeroDemande VARCHAR(40) NOT NULL UNIQUE,
  idDemandeur INT UNSIGNED NULL,
  idCreateur INT UNSIGNED NULL,
  idDirection INT UNSIGNED NULL,
  objet VARCHAR(255) NOT NULL,
  destination VARCHAR(180) NULL,
  destinations JSON NOT NULL,
  dateDepart DATETIME NULL,
  dateRetour DATETIME NULL,
  nbPassagers SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  personnesTransportees JSON NOT NULL,
  motif TEXT NULL,
  statut VARCHAR(40) NOT NULL DEFAULT 'BROUILLON',
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idVehicule INT UNSIGNED NULL,
  idChauffeur INT UNSIGNED NULL,
  commentaireValidateur TEXT NULL,
  dateSoumission DATETIME NULL,
  dateValidation DATETIME NULL,
  dateAffectation DATETIME NULL,
  dateFin DATETIME NULL,
  historique JSON NOT NULL,
  CONSTRAINT fk_dv_demandeur FOREIGN KEY (idDemandeur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  CONSTRAINT fk_dv_createur FOREIGN KEY (idCreateur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  CONSTRAINT fk_dv_direction FOREIGN KEY (idDirection) REFERENCES directions(idDirection) ON DELETE SET NULL,
  CONSTRAINT fk_dv_vehicule FOREIGN KEY (idVehicule) REFERENCES vehicules(idVehicule) ON DELETE SET NULL,
  CONSTRAINT fk_dv_chauffeur FOREIGN KEY (idChauffeur) REFERENCES agents(idAgent) ON DELETE SET NULL,
  INDEX idx_dv_dates (dateDepart, dateRetour),
  INDEX idx_dv_statut (statut)
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (code, libelle, couleur, isSystem, pages) VALUES
 ('ADMIN','Administrateur','#d4a017',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','directions','destinations','statistiques','comptes','roles')),
 ('DIRECTEUR','Directeur','#0b3d91',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','directions','destinations','statistiques')),
 ('CHEF_SERVICE','Chef de service','#117a8b',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','statistiques')),
 ('DAF','DAF','#6c757d',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','directions','destinations','statistiques')),
 ('DAAJ','DAAJ','#004085',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','directions','destinations','statistiques')),
 ('SSPA','SSPA','#1e7e34',1,JSON_ARRAY('dashboard','missions','validation','vehicules','parc_auto','agents','statistiques')),
 ('AGENT','Agent','#6c757d',1,JSON_ARRAY('dashboard','missions','vehicules'));

INSERT IGNORE INTO statuts (code, libelle) VALUES
 ('BROUILLON','Brouillon'),('SOUMIS','Soumis au directeur'),
 ('VALIDE_N1','Validé par le directeur — en attente DAAJ'),
 ('VALIDE_N2','Validé par le DAAJ — transmis au SSPA'),
 ('VALIDE','Validé définitivement'),('REJETE','Rejeté'),('EN_COURS','Mission en cours'),
 ('CLOTURE','Clôturé'),('ANNULE','Annulé'),('TRANSMIS_SSPA','Transmis au SSPA pour traitement'),
 ('OM_ETABLI','Ordre de mission établi');

INSERT IGNORE INTO statuts_vehicule (code, libelle) VALUES
 ('BROUILLON','Brouillon'),('SOUMIS','Soumis — en attente'),('VALIDE','Validé'),
 ('REFUSE','Refusé'),('AFFECTE','Véhicule affecté'),('TERMINE','Terminé'),('ANNULE','Annulé');

INSERT IGNORE INTO destinations (code, libelle, ville, pays, region, distanceRef) VALUES
 ('RABAT','Rabat','Rabat','Maroc','Rabat-Salé-Kénitra',0),
 ('CASABLANCA','Casablanca','Casablanca','Maroc','Casablanca-Settat',90),
 ('MARRAKECH','Marrakech','Marrakech','Maroc','Marrakech-Safi',240),
 ('FES','Fès','Fès','Maroc','Fès-Meknès',200),
 ('TANGER','Tanger','Tanger','Maroc','Tanger-Tétouan-Al Hoceïma',250),
 ('AGADIR','Agadir','Agadir','Maroc','Souss-Massa',570);

INSERT IGNORE INTO transports (code, libelle, tarifKm) VALUES
 ('VEH_SERV','Véhicule de service',0),('VEH_PERS','Véhicule personnel',3.5),
 ('TRAIN','Train',0),('AVION','Avion',0),('BUS','Autocar / Bus',0),('TAXI','Taxi',0);

INSERT IGNORE INTO types_frais (code, libelle, plafondUnitaire) VALUES
 ('HEBERGEMENT','Hébergement',500),('REPAS','Restauration',150),
 ('TRANSPORT','Frais de transport',0),('CARBURANT','Carburant',0),
 ('PEAGE','Péages',0),('DIVERS','Frais divers',200);

INSERT IGNORE INTO workflows (code, libelle, actif, etapes) VALUES
 ('WF_STANDARD','Workflow standard',1,JSON_ARRAY(JSON_OBJECT('niveau',1,'libelle','Visa chef de service','roleRequis','CHEF_SERVICE'),JSON_OBJECT('niveau',2,'libelle','Visa directeur','roleRequis','DIRECTEUR'),JSON_OBJECT('niveau',3,'libelle','Contrôle DAF','roleRequis','DAF'))),
 ('WF_ADMIN','Workflow administratif',1,JSON_ARRAY(JSON_OBJECT('niveau',1,'libelle','Visa du Directeur','roleRequis','DIRECTEUR'),JSON_OBJECT('niveau',2,'libelle','Validation DAAJ','roleRequis','DAAJ'),JSON_OBJECT('niveau',3,'libelle','Établissement de l’OM — SSPA','roleRequis','SSPA')));

-- Compte administrateur créé séparément par `npm run bootstrap-admin`.
-- Aucun compte ni mot de passe de démonstration n'est installé par ce schéma.
