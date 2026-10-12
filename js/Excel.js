/* =====================================================
   6. MODULE EXCEL
   ===================================================== */
const Excel = (() => {
  function normaliserCle(cle) {
    return String(cle)
      .trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }
  function normaliserLigne(row) {
    const out = {};
    Object.keys(row).forEach(k => { out[normaliserCle(k)] = row[k]; });
    return out;
  }
  function lireValeur(row, ...nomsPossibles) {
    for (const nom of nomsPossibles) {
      const cle = normaliserCle(nom);
      if (row[cle] !== undefined && row[cle] !== null && row[cle] !== '') {
        return row[cle];
      }
    }
    return '';
  }

  function exporter(tableau, nomFichier, nomFeuille = 'Données') {
    if (!tableau || !tableau.length) { Utils.toast('Aucune donnée à exporter', 'warning'); return; }
    const ws = XLSX.utils.json_to_sheet(tableau);
    const cols = Object.keys(tableau[0]).map(k => ({wch: Math.min(40, Math.max(k.length + 2, ...tableau.map(r => String(r[k] ?? '').length + 2)))}));
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nomFeuille);
    const fname = `${nomFichier}_${new Date().toISOString().substring(0,10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    Utils.toast(`Export réussi : ${fname}`, 'success');
  }
  function agentsVersLignes() {
    return Scope.agents().map(a => {
      const dir = API.getDirection(a.idDirection);
      const sup = a.idSuperieur ? API.getAgent(a.idSuperieur) : null;
      return {'Matricule':a.matricule,'Nom':a.nom,'Prénom':a.prenom,'Fonction':a.fonction,
        'Grade':a.grade||'','Affectation':a.affectation||'','Taux (MAD/jour)':a.taux||0,'Code direction':dir?.codeDirection||'',
        'Direction':dir?.libelle||'','Email':a.email,'Téléphone':a.telephone||'','Adresse':a.adresse||'',
        'Supérieur':sup ? `${sup.prenom} ${sup.nom}` : '','Matricule supérieur':sup?.matricule||'',
        'Statut':a.actif ? 'Actif' : 'Inactif'};
    });
  }
  function directionsVersLignes() {
    return Scope.directions().map(d => ({
      'Code':d.codeDirection,'Libellé':d.libelle,
      'Code parent':d.idDirectionParent ? (API.getDirection(d.idDirectionParent)?.codeDirection || '') : '',
      'Nb agents':API.getAgents().filter(a => a.idDirection === d.idDirection).length,
      'Nb missions':API.getMissions().filter(m => m.idDirection === d.idDirection).length,
      'Statut':d.actif ? 'Active' : 'Inactive'}));
  }
  function destinationsVersLignes() {
    return API.getDestinations().map(d => ({
      'Code':d.code,'Libellé':d.libelle,'Ville':d.ville||'','Pays':d.pays||'',
      'Région':d.region||'','Distance réf. (km)':d.distanceRef ?? 0,
      'Nb missions':API.getMissions().filter(m => (m.lieuPrincipal||'').toLowerCase() === (d.libelle||'').toLowerCase()).length,
      'Statut':d.actif ? 'Active' : 'Inactive'}));
  }
  function missionsVersLignes() {
    return Scope.missions().map(m => {
      const wf = API.getWorkflow(m.idWorkflow);
      const destinations = (m.itineraires || []).map(i => i.lieuArrivee).filter(Boolean);
      const participants = (m.participants || []).map(p => API.getAgent(p.idAgent)).filter(Boolean);
      return {'N° OM':m.numeroOm,'Objet':m.objet,'Contexte':m.contexte||'',
        'Date émission':m.dateEmission,'Date départ':m.dateDepart,'Date retour':m.dateRetour,
        'Durée (jours)':Utils.dureeJours(m.dateDepart, m.dateRetour),'Lieu départ':m.lieuDepart||'',
        'Destination principale':m.lieuPrincipal||'','Destinations':destinations.join(' ; '),
        'Participants':participants.map(a => `${a.prenom} ${a.nom}`).join(' ; '),
        'Nb participants':participants.length,'Pays':m.pays||'',
        'Budget prévisionnel (MAD)':m.budgetPrevisionnel||0,'Montant total (MAD)':m.montantTotal||0,
        'Code direction':API.getDirection(m.idDirection)?.codeDirection||'',
        'Matricule demandeur':API.getAgent(m.idDemandeur)?.matricule||'',
        'Workflow':wf?.code||'','Statut':Utils.statutLibelle(m)};
    });
  }
  function demandesVehiculesVersLignes() {
    return Scope.demandesVehicules().map(d => {
      const arrDests = Array.isArray(d.destinations) && d.destinations.length
        ? d.destinations
        : (d.destination ? [d.destination] : []);
      const personnes = Utils.personnesList(d);
      const demandeur = API.getAgent(d.idDemandeur);
      const createur = d.idCreateur ? API.getAgent(d.idCreateur) : null;
      return {
        'N° Demande': d.numeroDemande,
        'Date création': Utils.formatDateTime(d.dateCreation),
        'Demandeur': Utils.agentNom(d.idDemandeur),
        'Matricule demandeur': demandeur?.matricule || '',
        'Fonction demandeur': demandeur?.fonction || '',
        'Saisie par': createur ? `${createur.prenom} ${createur.nom}` : '',
        'Direction': API.getDirection(d.idDirection)?.codeDirection || '',
        'Objet': d.objet,
        'Destination': arrDests.length ? arrDests[0] : '',
        'Destinations (détail)': arrDests.join(' ; '),
        'Date départ': d.dateDepart,
        'Date retour': d.dateRetour,
        'Durée (jours)': Utils.dureeJours(d.dateDepart, d.dateRetour),
        'Nb personnes transportées': personnes.length,
        'Personnes transportées (détail)': personnes.join(' ; '),
        'Véhicule affecté': d.idVehicule ? Utils.vehiculeLabel(d.idVehicule) : '',
        'Chauffeur': d.idChauffeur ? Utils.agentNom(d.idChauffeur) : '',
        'Motif': d.motif || '',
        'Statut': API.getStatutVehiculeByCode(d.statut)?.libelle || d.statut,
        'Commentaire': d.commentaireValidateur || ''
      };
    });
  }
  function parcAutoVersLignes() {
    return Scope.vehiculesParc().map(v => {
      const dir = API.getDirection(v.idDirection);
      return {
        'Matricule': v.immatriculation,
        'Marque': v.marque,
        'Modèle': v.modele,
        'Type': v.type || '',
        'Genre': v.genre || '',
        'Catégorie': v.categorie || '',
        'Date de Mise en Circulation': Utils.formatDate(v.dateMiseCirculation),
        'CV': v.cv || 0,
        'Chassis': v.chassis || '',
        'Carburant': v.carburant || '',
        'Direction': dir ? dir.codeDirection + ' — ' + dir.libelle : '—',
        'Service': v.service || '',
        'Affectation': v.affectation || '',
        'Utilisateur': v.utilisateur || '',
        'Assurance': v.assurance || '',
        'Ville': v.ville || ''
      };
    });
  }
  function validationsVersLignes() {
    return API.getValidations().map(v => {
      const m = API.getMission(v.idMission);
      return {'N° OM':m?.numeroOm||'','Objet':m?.objet||'','Niveau':v.niveau,'Étape':v.libelleEtape||'',
        'Matricule validateur':API.getAgent(v.idValidateur)?.matricule||'','Décision':v.decision,
        'Commentaire':v.commentaire||'','Date création':v.dateCreation||'','Date décision':v.dateDecision||''};
    });
  }
  function statistiquesVersLignes() {
    const stats = Scope.getStatistiques();
    const lignes = [];
    lignes.push({'Indicateur':'Total missions','Valeur': stats.total});
    lignes.push({'Indicateur':'Jours cumulés','Valeur': stats.totalJours});
    lignes.push({'Indicateur':'Coût total (MAD)','Valeur': stats.totalMontant});
    Object.entries(stats.byStatut).forEach(([k, v]) => lignes.push({'Indicateur':`Statut: ${k}`,'Valeur':v}));
    Object.entries(stats.byDirection).forEach(([k, d]) => lignes.push({'Indicateur':`Direction: ${k} — missions`,'Valeur':d.count}));
    Object.entries(stats.byDirection).forEach(([k, d]) => lignes.push({'Indicateur':`Direction: ${k} — jours`,'Valeur':d.jours}));
    Object.entries(stats.byDirection).forEach(([k, d]) => lignes.push({'Indicateur':`Direction: ${k} — coût (MAD)`,'Valeur':d.montant}));
    Object.entries(stats.byMois).forEach(([k, v]) => lignes.push({'Indicateur':`Mois: ${k}`,'Valeur':v}));
    return lignes;
  }

  function lireFichier(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {type: 'array', cellDates: true});
          const premiereFeuille = workbook.SheetNames[0];
          const feuille = workbook.Sheets[premiereFeuille];
          const lignes = XLSX.utils.sheet_to_json(feuille, {defval: '', raw: true});
          resolve({nomFeuille: premiereFeuille, lignes});
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  async function importerAgents(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    for (const rowBrut of lignes) {
      try {
        const row = normaliserLigne(rowBrut);
        const nom = String(lireValeur(row, 'Nom', 'NOM')).trim();
        const prenom = String(lireValeur(row, 'Prénom', 'Prenom', 'PRENOM')).trim();
        if (!nom || !prenom) throw new Error('Nom et prénom obligatoires');
        const codeDir = String(lireValeur(row, 'Code direction', 'Code Direction', 'Direction code')).trim().toUpperCase();
        let dir = codeDir ? API.getDirectionByCode(codeDir) : null;
        if (!dir) dir = API.getDirections()[0];
        const matricule = String(lireValeur(row, 'Matricule', 'MATRICULE')).trim();
        const existant = matricule ? API.getAgentByMatricule(matricule) : null;
        const payload = {
          nom: nom.toUpperCase(), prenom,
          matricule: matricule || null,
          email: String(lireValeur(row, 'Email', 'E-mail', 'Mail')).trim(),
          telephone: String(lireValeur(row, 'Téléphone', 'Telephone', 'Tel', 'Tél')).trim(),
          adresse: String(lireValeur(row, 'Adresse', 'Adresse (ou ville)', 'Ville')).trim(),
          fonction: String(lireValeur(row, 'Fonction', 'Poste')).trim(),
          grade: String(lireValeur(row, 'Grade')).trim(),
          affectation: String(lireValeur(row, 'Affectation', 'Service')).trim(),
          taux: Number(lireValeur(row, 'Taux (MAD/jour)', 'Taux (MAD/j)', 'Taux')) || 0,
          idDirection: dir.idDirection,
          idSuperieur: null
        };
        if (existant) API.updateAgent(existant.idAgent, payload);
        else API.createAgent(payload);
        ok++;
      } catch (e) { erreurs.push(`Ligne ${ok + err + 2} : ${e.message}`); err++; }
    }
    return {ok, err, erreurs};
  }

  async function importerDirections(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    for (const rowBrut of lignes) {
      try {
        const row = normaliserLigne(rowBrut);
        const code = String(lireValeur(row, 'Code', 'Code direction')).trim().toUpperCase();
        const libelle = String(lireValeur(row, 'Libellé', 'Libelle')).trim();
        if (!code || !libelle) throw new Error('Code et libellé obligatoires');
        const codeParent = String(lireValeur(row, 'Code parent', 'Parent')).trim().toUpperCase();
        const parent = codeParent ? API.getDirectionByCode(codeParent) : null;
        const existant = API.getDirectionByCode(code);
        const statut = String(lireValeur(row, 'Statut')).trim();
        const payload = {
          codeDirection: code, libelle,
          idDirectionParent: parent ? parent.idDirection : null,
          actif: statut.toLowerCase() !== 'inactive' && statut.toLowerCase() !== 'inactif'
        };
        if (existant) API.updateDirection(existant.idDirection, payload);
        else API.createDirection(payload);
        ok++;
      } catch (e) { erreurs.push(`Ligne ${ok + err + 2} : ${e.message}`); err++; }
    }
    return {ok, err, erreurs};
  }

  async function importerDestinations(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    for (const rowBrut of lignes) {
      try {
        const row = normaliserLigne(rowBrut);
        const code = String(lireValeur(row, 'Code')).trim().toUpperCase();
        const libelle = String(lireValeur(row, 'Libellé', 'Libelle')).trim();
        if (!code || !libelle) throw new Error('Code et libellé obligatoires');
        const existant = API.getDestinationByCode(code);
        const statut = String(lireValeur(row, 'Statut')).trim();
        const payload = {
          code, libelle,
          ville: String(lireValeur(row, 'Ville')).trim(),
          pays: String(lireValeur(row, 'Pays') || 'Maroc').trim(),
          region: String(lireValeur(row, 'Région', 'Region')).trim(),
          distanceRef: Number(lireValeur(row, 'Distance réf. (km)', 'Distance ref. (km)', 'Distance (km)', 'Distance')) || 0,
          actif: statut.toLowerCase() !== 'inactive' && statut.toLowerCase() !== 'inactif'
        };
        if (existant) API.updateDestination(existant.idDestination, payload);
        else API.createDestination(payload);
        ok++;
      } catch (e) { erreurs.push(`Ligne ${ok + err + 2} : ${e.message}`); err++; }
    }
    return {ok, err, erreurs};
  }

  async function importerMissions(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    const session = Auth.session();
    const agent = Auth.currentAgent();
    for (const rowBrut of lignes) {
      try {
        const row = normaliserLigne(rowBrut);
        const objet = String(lireValeur(row, 'Objet')).trim();
        if (!objet) throw new Error('Objet obligatoire');
        const numOm = String(lireValeur(row, 'N° OM', 'N OM', 'Numero OM')).trim();
        const existante = numOm ? API.getMissions().find(m => m.numeroOm === numOm) : null;
        const codeDir = String(lireValeur(row, 'Code direction', 'Direction')).trim().toUpperCase();
        const dir = codeDir ? API.getDirectionByCode(codeDir) : null;
        const dateDepart = lireValeur(row, 'Date départ', 'Date depart');
        const dateRetour = lireValeur(row, 'Date retour');
        if (!dateDepart || !dateRetour) throw new Error('Dates obligatoires');
        const lieuPrincipal = String(lireValeur(row, 'Destination principale', 'Destination')).trim() || 'Rabat';
        const destObj = API.getDestinationByLibelle(lieuPrincipal);
        const payload = {
          objet,
          contexte: String(lireValeur(row, 'Contexte')).trim(),
          dateEmission: lireValeur(row, 'Date émission', 'Date emission') || new Date().toISOString().substring(0,10),
          dateDepart, dateRetour,
          lieuDepart: String(lireValeur(row, 'Lieu départ', 'Lieu depart') || 'Rabat').trim(),
          lieuPrincipal,
          pays: destObj?.pays || 'Maroc',
          budgetPrevisionnel: Number(lireValeur(row, 'Budget prévisionnel (MAD)', 'Budget')) || 0,
          idDirection: dir ? dir.idDirection : (agent?.idDirection || 1),
          itineraires: [{
            ordreEtape: 1,
            lieuDepart: String(lireValeur(row, 'Lieu départ', 'Lieu depart') || 'Rabat').trim(),
            lieuArrivee: lieuPrincipal,
            dateDepart, dateArrivee: dateRetour,
            distanceKm: destObj?.distanceRef || 0,
            idTransport: 1
          }]
        };
        if (existante) {
          API.updateMission(existante.idMission, payload);
        } else {
          payload.idDemandeur = session?.idAgent || 1;
          payload.idWorkflow = 3;
          payload.participants = payload.idDemandeur ? [{idAgent: payload.idDemandeur, roleMission: 'CHEF_MISSION', ordrePassage: 1}] : [];
          API.createMission(payload);
        }
        ok++;
      } catch (e) { erreurs.push(`Ligne ${ok + err + 2} : ${e.message}`); err++; }
    }
    return {ok, err, erreurs};
  }

  async function importerDemandesVehicules(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    const session = Auth.session();
    const agent = Auth.currentAgent();
    for (const rowBrut of lignes) {
      try {
        const row = normaliserLigne(rowBrut);
        const objet = String(lireValeur(row, 'Objet')).trim();
        const destRaw = String(lireValeur(row, 'Destinations (détail)', 'Destinations', 'Destination')).trim();
        const destArr = destRaw.split(/\s*;\s*/).map(s => s.trim()).filter(Boolean);
        const dateDepart = lireValeur(row, 'Date départ', 'Date depart');
        const dateRetour = lireValeur(row, 'Date retour');
        if (!objet || !destArr.length || !dateDepart || !dateRetour)
          throw new Error('Objet, destination et dates obligatoires');

        const persRaw = String(lireValeur(row,
          'Personnes transportées (détail)', 'Personnes transportées',
          'Passagers', 'Nb passagers')).trim();
        const personnesArr = persRaw ? persRaw.split(/\s*;\s*/).map(s => s.trim()).filter(Boolean) : [];

        const numDemande = String(lireValeur(row, 'N° Demande', 'N Demande', 'Numero Demande')).trim();
        const existante = numDemande ? API.getDemandesVehicules().find(d => d.numeroDemande === numDemande) : null;
        const codeDir = String(lireValeur(row, 'Direction')).trim().toUpperCase();
        const dir = codeDir ? API.getDirectionByCode(codeDir) : null;
        const statutRaw = String(lireValeur(row, 'Statut') || 'BROUILLON').trim();
        const statut = API.getStatutVehiculeByCode(statutRaw) ? statutRaw : 'BROUILLON';
        const payload = {
          objet,
          destination: destArr[0],
          destinations: destArr,
          dateDepart, dateRetour,
          personnesTransportees: personnesArr,
          nbPassagers: personnesArr.length,
          motif: String(lireValeur(row, 'Motif')).trim(),
          statut,
          commentaireValidateur: String(lireValeur(row, 'Commentaire')).trim()
        };
        if (existante) {
          API.updateDemandeVehicule(existante.idDemande, payload);
        } else {
          payload.idDemandeur = session?.idAgent || 1;
          payload.idCreateur = session?.idAgent || 1;
          payload.idDirection = dir ? dir.idDirection : (agent?.idDirection || 1);
          payload.dateCreation = new Date().toISOString();
          API.createDemandeVehicule(payload);
        }
        ok++;
      } catch (e) { erreurs.push(`Ligne ${ok + err + 2} : ${e.message}`); err++; }
    }
    return {ok, err, erreurs};
  }

  async function importerParcAuto(file) {
    const {lignes} = await lireFichier(file);
    if (!lignes.length) throw new Error('Fichier vide');
    let ok = 0, err = 0;
    const erreurs = [];
    for (let i = 0; i < lignes.length; i++) {
      const rowBrut = lignes[i];
      const ligneNum = i + 2;
      try {
        const row = normaliserLigne(rowBrut);
        const immatriculation = String(lireValeur(row, 'Matricule', 'Immatriculation')).trim();
        if (!immatriculation) throw new Error('Matricule obligatoire');
        const marque = String(lireValeur(row, 'Marque')).trim();
        if (!marque) throw new Error('Marque obligatoire');
        const modele = String(lireValeur(row, 'Modèle', 'Modele')).trim();
        if (!modele) throw new Error('Modèle obligatoire');

        const dirLabel = String(lireValeur(row, 'Direction')).trim();
        let dir = null;
        if (dirLabel) {
          const codePart = dirLabel.split('—')[0].trim().toUpperCase();
          dir = API.getDirectionByCode(codePart);
          if (!dir) {
            dir = API.getDirections().find(d =>
              (d.libelle||'').toLowerCase() === dirLabel.toLowerCase() ||
              (d.codeDirection||'').toLowerCase() === dirLabel.toLowerCase()
            );
          }
        }

        const statutRaw = String(lireValeur(row, 'Statut') || 'DISPONIBLE').trim().toUpperCase().replace(/\s+/g, '_');
        const statutsValides = ['DISPONIBLE','AFFECTE','MAINTENANCE','HORS_SERVICE'];
        const statut = statutsValides.includes(statutRaw) ? statutRaw : 'DISPONIBLE';

        const rawDate = lireValeur(row, 'Date de Mise en Circulation', 'Date Mise en Circulation', 'DateMiseCirculation', 'Date mise en circulation');
        const dateMiseCirculation = Utils.excelDateToISO(rawDate);

        const payload = {
          immatriculation,
          marque,
          modele,
          type: String(lireValeur(row, 'Type')).trim(),
          genre: String(lireValeur(row, 'Genre')).trim(),
          categorie: String(lireValeur(row, 'Catégorie', 'Categorie')).trim(),
          dateMiseCirculation,
          cv: Number(lireValeur(row, 'CV')) || 0,
          chassis: String(lireValeur(row, 'Chassis')).trim(),
          carburant: String(lireValeur(row, 'Carburant')).trim(),
          idDirection: dir ? dir.idDirection : null,
          service: String(lireValeur(row, 'Service')).trim(),
          affectation: String(lireValeur(row, 'Affectation')).trim(),
          utilisateur: String(lireValeur(row, 'Utilisateur')).trim(),
          assurance: String(lireValeur(row, 'Assurance')).trim(),
          ville: String(lireValeur(row, 'Ville')).trim(),
          capacite: Number(lireValeur(row, 'Capacité', 'Capacite')) || 5,
          statut,
          actif: true
        };

        const existant = API.getVehiculeByImmat(immatriculation);
        if (existant) {
          API.updateVehicule(existant.idVehicule, payload);
        } else {
          API.createVehicule(payload);
        }
        ok++;
      } catch (e) {
        erreurs.push(`Ligne ${ligneNum} : ${e.message}`);
        err++;
      }
    }
    return {ok, err, erreurs};
  }

  return {exporter, agentsVersLignes, directionsVersLignes, destinationsVersLignes,
    missionsVersLignes, demandesVehiculesVersLignes, parcAutoVersLignes, validationsVersLignes, statistiquesVersLignes,
    importerAgents, importerDirections, importerDestinations, importerMissions, importerDemandesVehicules,
    importerParcAuto, normaliserLigne};
})();