/* =====================================================
   5. MODULE IMPRESSION
   ===================================================== */
const Printer = (() => {
  function entete(titre, sousTitre) {
    const session = Auth.session();
    const agent = Auth.currentAgent();
    const nom = agent ? `${agent.prenom} ${agent.nom}` : (session?.login || '—');
    const date = new Date().toLocaleString('fr-FR');
    return `
      <div class="print-header">
        <div class="print-brand">
          <div class="print-logo">GM</div>
          <div><div class="print-title-main">Gestion des Ordres de Mission</div>
            <div class="print-title-sub">Administration Publique</div></div>
        </div>
        <div class="print-meta">
          <div><strong>Édité le :</strong> ${date}</div>
          <div><strong>Par :</strong> ${Utils.esc(nom)} (${Utils.esc(session?.role || '')})</div>
        </div>
      </div>
      <h1 class="print-h1">${titre}</h1>
      ${sousTitre ? `<div class="print-subtitle">${sousTitre}</div>` : ''}`;
  }
  function pied() {
    return `<div class="print-footer">Document généré automatiquement — © ${new Date().getFullYear()} Direction des Affaires Administratives et Juridiques</div>`;
  }
  function feuille() {
    return `
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; color: #212529; font-size: 11px; margin: 0; padding: 0; }
      .print-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 3px solid #0b3d91; margin-bottom: 14px; }
      .print-brand { display: flex; align-items: center; gap: 10px; }
      .print-logo { width: 38px; height: 38px; background: #d4a017; border-radius: 50%; display: grid; place-items: center; font-weight: bold; color: #082a66; font-size: 16px; flex-shrink: 0; }
      .print-title-main { font-weight: 700; font-size: 15px; color: #082a66; }
      .print-title-sub { font-size: 10px; color: #6c757d; }
      .print-meta { text-align: right; font-size: 10px; color: #495057; line-height: 1.6; }
      .print-h1 { font-size: 16px; color: #0b3d91; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: .5px; }
      .print-subtitle { font-size: 11px; color: #6c757d; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #dee2e6; }
      .print-footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #dee2e6; font-size: 9px; color: #6c757d; text-align: center; }
      table.print-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      table.print-table thead th { background: #e6ecf7; color: #082a66; text-align: left; padding: 6px 8px; border: 1px solid #adb5bd; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; }
      table.print-table tbody td { padding: 5px 8px; border: 1px solid #dee2e6; vertical-align: top; }
      table.print-table tbody tr:nth-child(even) { background: #f8f9fa; }
      .print-kpi { display: flex; gap: 10px; margin: 10px 0 16px; flex-wrap: wrap; }
      .print-kpi .kpi-box { flex: 1; min-width: 120px; padding: 8px 12px; border: 1px solid #dee2e6; border-left: 3px solid #0b3d91; background: #fff; }
      .print-kpi .kpi-label { font-size: 9px; color: #6c757d; text-transform: uppercase; letter-spacing: .3px; font-weight: 600; }
      .print-kpi .kpi-value { font-size: 16px; font-weight: 700; color: #082a66; margin-top: 2px; }
      .print-section { margin: 18px 0 10px; padding: 6px 10px; background: #e6ecf7; color: #082a66; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; border-left: 4px solid #0b3d91; }
      .print-signature { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      .print-signature .sig { padding-top: 40px; border-top: 1px solid #000; text-align: center; font-size: 11px; color: #495057; }
      @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
    `;
  }

  function ouvrir(titre, sousTitre, contenu, kpis = []) {
    const kpisHtml = kpis.length
      ? `<div class="print-kpi">${kpis.map(k => `<div class="kpi-box"><div class="kpi-label">${Utils.esc(k.label)}</div><div class="kpi-value">${Utils.esc(k.value)}</div></div>`).join('')}</div>`
      : '';
    const html = `
      <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${Utils.esc(titre)}</title>
      <style>${feuille()}</style></head><body>
        ${entete(titre, sousTitre)}${kpisHtml}${contenu}${pied()}
      </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const lancerImpression = () => {
      setTimeout(function() {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          Utils.toast('Erreur lors de l\'impression : ' + e.message, 'error');
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 1500);
        }
      }, 300);
    };

    if (iframe.contentWindow.document.readyState === 'complete') {
      lancerImpression();
    } else {
      iframe.onload = lancerImpression;
    }
  }

  function imprimerListeVehicules() {
    const vehicules = Scope.vehiculesParc().slice().sort((a,b) => (a.immatriculation||'').localeCompare(b.immatriculation||''));
    if (!vehicules.length) { Utils.toast('Aucun véhicule à imprimer', 'warning'); return; }

    const lignes = vehicules.map(v => {
      const dir = API.getDirection(v.idDirection);
      return `
        <tr>
          <td><strong>${Utils.esc(v.immatriculation)}</strong></td>
          <td>${Utils.esc(v.marque)}</td>
          <td>${Utils.esc(v.modele)}</td>
          <td>${Utils.esc(v.type || '—')}</td>
          <td>${Utils.esc(v.genre || '—')}</td>
          <td>${Utils.esc(v.categorie || '—')}</td>
          <td>${Utils.formatDate(v.dateMiseCirculation)}</td>
          <td style="text-align:center">${v.cv || 0}</td>
          <td>${Utils.esc(v.chassis || '—')}</td>
          <td>${Utils.esc(v.carburant || '—')}</td>
          <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
          <td>${Utils.esc(v.service || '—')}</td>
          <td>${Utils.esc(v.affectation || '—')}</td>
          <td>${Utils.esc(v.utilisateur || '—')}</td>
          <td>${Utils.esc(v.assurance || '—')}</td>
          <td>${Utils.esc(v.ville || '—')}</td>
          <td>${Utils.esc(v.statut || '—')}</td>
        </tr>`;
    }).join('');

    const contenu = `
      <table class="print-table">
        <thead>
          <tr>
            <th>Matricule</th><th>Marque</th><th>Modèle</th><th>Type</th><th>Genre</th>
            <th>Catégorie</th><th>Mise en circ.</th><th style="text-align:center">CV</th>
            <th>Chassis</th><th>Carburant</th><th>Direction</th><th>Service</th>
            <th>Affectation</th><th>Utilisateur</th><th>Assurance</th><th>Ville</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>${lignes}</tbody>
      </table>`;

    const total = vehicules.length;
    const dispo = vehicules.filter(v => v.statut === 'DISPONIBLE').length;
    const affectes = vehicules.filter(v => v.statut === 'AFFECTE').length;
    const maintenance = vehicules.filter(v => v.statut === 'MAINTENANCE').length;
    const horsService = vehicules.filter(v => v.statut === 'HORS_SERVICE').length;

    ouvrir('Liste des véhicules du parc auto',
      `${total} véhicule(s) — Édité le ${new Date().toLocaleDateString('fr-FR')}`,
      contenu,
      [
        {label:'Total', value: total},
        {label:'Disponibles', value: dispo},
        {label:'Affectés', value: affectes},
        {label:'Maintenance', value: maintenance},
        {label:'Hors service', value: horsService}
      ]);
  }

  function imprimerListeAgents(agents) {
    const liste = (agents || Scope.agents()).slice().sort((a,b) => (a.nom||'').localeCompare(b.nom||''));
    if (!liste.length) { Utils.toast('Aucun agent à imprimer', 'warning'); return; }

    const lignes = liste.map(a => {
      const dir = API.getDirection(a.idDirection);
      const sup = a.idSuperieur ? API.getAgent(a.idSuperieur) : null;
      return `
        <tr>
          <td><strong>${Utils.esc(a.matricule)}</strong></td>
          <td>${Utils.esc(a.nom)}</td>
          <td>${Utils.esc(a.prenom)}</td>
          <td>${Utils.esc(a.fonction || '—')}</td>
          <td>${Utils.esc(a.grade || '—')}</td>
          <td>${Utils.esc(a.affectation || '—')}</td>
          <td style="text-align:right">${Utils.formatMoney(a.taux || 0)}</td>
          <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
          <td>${sup ? Utils.esc(sup.prenom + ' ' + sup.nom) : '—'}</td>
          <td>${Utils.esc(a.email || '—')}</td>
          <td>${Utils.esc(a.telephone || '—')}</td>
          <td>${Utils.esc(a.adresse || '—')}</td>
          <td>${a.actif ? 'Actif' : 'Inactif'}</td>
        </tr>`;
    }).join('');

    const contenu = `
      <table class="print-table">
        <thead>
          <tr>
            <th>Matricule</th><th>Nom</th><th>Prénom</th><th>Fonction</th><th>Grade</th>
            <th>Affectation</th>
            <th style="text-align:right">Taux (MAD/j)</th><th>Direction</th><th>Supérieur</th>
            <th>Email</th><th>Téléphone</th><th>Adresse</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>${lignes}</tbody>
      </table>`;

    const total = liste.length;
    const actifs = liste.filter(a => a.actif).length;
    const inactifs = liste.filter(a => !a.actif).length;
    const directionsUniques = [...new Set(liste.map(a => a.idDirection))].length;
    const tauxMoyen = total ? Math.round(liste.reduce((s, a) => s + (a.taux || 0), 0) / total) : 0;

    ouvrir('Liste des agents',
      `${total} agent(s) — Édité le ${new Date().toLocaleDateString('fr-FR')}`,
      contenu,
      [
        {label:'Total', value: total},
        {label:'Actifs', value: actifs},
        {label:'Inactifs', value: inactifs},
        {label:'Directions', value: directionsUniques},
        {label:'Taux moyen (MAD/j)', value: tauxMoyen}
      ]);
  }

  function imprimerFicheVehicule(idVehicule) {
    const v = API.getVehicule(idVehicule);
    if (!v) { Utils.toast('Véhicule introuvable', 'error'); return; }
    const dir = API.getDirection(v.idDirection);
    const esc = Utils.esc;

    const contenu = `
      <style>
        .fv-page { font-family: 'Segoe UI', Tahoma, sans-serif; color: #000; padding: 6mm 8mm; font-size: 13px; line-height: 1.8; }
        .fv-header { text-align: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px double #0b3d91; }
        .fv-header .fv-org { font-size: 12px; color: #495057; margin-bottom: 6px; }
        .fv-header h1 { font-size: 24px; color: #0b3d91; text-transform: uppercase; letter-spacing: 2px; }
        .fv-section { margin-bottom: 18px; }
        .fv-section h2 { font-size: 13px; color: #0b3d91; text-transform: uppercase; border-bottom: 2px solid #e6ecf7; padding-bottom: 4px; margin-bottom: 10px; }
        .fv-grid { display: grid; grid-template-columns: 200px 1fr 200px 1fr; gap: 6px 12px; }
        .fv-grid .lbl { font-weight: 700; color: #082a66; }
        .fv-grid .val { border-bottom: 1px dotted #adb5bd; padding: 2px 0; }
        .fv-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .fv-signatures .sig { text-align: center; padding-top: 60px; border-top: 1px solid #000; font-size: 12px; color: #495057; }
      </style>
      <div class="fv-page">
        <div class="fv-header">
          <div class="fv-org">Royaume du Maroc — Administration Publique</div>
          <div class="fv-org">${esc(dir?.libelle || '—')}</div>
          <h1>Fiche véhicule</h1>
          <div class="fv-org">Immatriculation : <strong>${esc(v.immatriculation)}</strong></div>
        </div>
        <div class="fv-section">
          <h2>Identification</h2>
          <div class="fv-grid">
            <div class="lbl">Immatriculation :</div><div class="val"><strong>${esc(v.immatriculation)}</strong></div>
            <div class="lbl">Chassis :</div><div class="val">${esc(v.chassis || '—')}</div>
            <div class="lbl">Marque :</div><div class="val">${esc(v.marque || '—')}</div>
            <div class="lbl">Modèle :</div><div class="val">${esc(v.modele || '—')}</div>
            <div class="lbl">Type :</div><div class="val">${esc(v.type || '—')}</div>
            <div class="lbl">Genre :</div><div class="val">${esc(v.genre || '—')}</div>
            <div class="lbl">Catégorie :</div><div class="val">${esc(v.categorie || '—')}</div>
            <div class="lbl">Carburant :</div><div class="val">${esc(v.carburant || '—')}</div>
            <div class="lbl">CV :</div><div class="val">${v.cv || 0}</div>
            <div class="lbl">Capacité :</div><div class="val">${v.capacite || 0} places</div>
            <div class="lbl">Date de mise en circulation :</div><div class="val">${Utils.formatDate(v.dateMiseCirculation)}</div>
            <div class="lbl">Ville :</div><div class="val">${esc(v.ville || '—')}</div>
          </div>
        </div>
        <div class="fv-section">
          <h2>Affectation administrative</h2>
          <div class="fv-grid">
            <div class="lbl">Direction :</div><div class="val">${dir ? esc(dir.codeDirection + ' — ' + dir.libelle) : '—'}</div>
            <div class="lbl">Service :</div><div class="val">${esc(v.service || '—')}</div>
            <div class="lbl">Affectation :</div><div class="val">${esc(v.affectation || '—')}</div>
            <div class="lbl">Utilisateur :</div><div class="val">${esc(v.utilisateur || '—')}</div>
            <div class="lbl">Assurance :</div><div class="val">${esc(v.assurance || '—')}</div>
            <div class="lbl">Statut :</div><div class="val"><strong>${esc(v.statut || '—')}</strong></div>
          </div>
        </div>
        ${v.notes ? `
          <div class="fv-section">
            <h2>Observations</h2>
            <p style="white-space:pre-line">${esc(v.notes)}</p>
          </div>
        ` : ''}
        <div class="fv-signatures">
          <div class="sig">Le Responsable du Parc Auto</div>
          <div class="sig">Le Directeur</div>
        </div>
      </div>`;

    ouvrir(`Fiche véhicule — ${v.immatriculation}`, `${v.marque} ${v.modele}`, contenu, []);
  }

  function imprimerDemandesVehicules() {
    const demandes = Scope.demandesVehicules().slice().sort((a,b) => (b.dateCreation||'').localeCompare(a.dateCreation||''));
    if (!demandes.length) { Utils.toast('Aucune demande à imprimer', 'warning'); return; }
    const lignes = demandes.map(d => {
      const demandeur = API.getAgent(d.idDemandeur);
      const direction = API.getDirection(d.idDirection);
      return `
      <tr>
        <td><strong>${Utils.esc(d.numeroDemande)}</strong></td>
        <td>${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'}
          <div style="font-size:9px;color:#6c757d">${demandeur ? Utils.esc(demandeur.matricule || '') : ''}</div>
        </td>
        <td>${direction ? Utils.esc(direction.codeDirection) : '—'}</td>
        <td>${Utils.esc(Utils.destsLabel(d))}</td>
        <td>${Utils.formatDateTime(d.dateDepart)}</td>
        <td>${Utils.formatDateTime(d.dateRetour)}</td>
        <td>${Utils.esc(Utils.personnesList(d).join(' • ') || '—')}</td>
        <td>${Utils.esc(API.getStatutVehiculeByCode(d.statut)?.libelle || d.statut)}</td>
      </tr>
    `;
    }).join('');
    const total = demandes.length;
    const affectees = demandes.filter(d => d.statut === 'AFFECTE' || d.statut === 'TERMINE').length;
    const enAttente = demandes.filter(d => d.statut === 'SOUMIS').length;
    const contenu = `
      <table class="print-table">
        <thead>
          <tr>
            <th>N° Demande</th><th>Demandeur</th><th>Direction</th><th>Destination(s)</th>
            <th>Départ</th><th>Retour</th><th>Personnes transportées</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>${lignes}</tbody>
      </table>`;
    ouvrir('Demandes de véhicules', `${total} demande(s)`, contenu, [
      {label:'Total', value: total},
      {label:'Affectées', value: affectees},
      {label:'En attente', value: enAttente}
    ]);
  }

  function imprimerEtatDemandes() {
    const demandes = Scope.demandesVehicules().slice().sort((a,b) => (b.dateCreation||'').localeCompare(a.dateCreation||''));
    if (!demandes.length) { Utils.toast('Aucune demande à imprimer', 'warning'); return; }

    const byStatut = {};
    const byDirection = {};
    const byVehicule = {};
    let totalPersonnes = 0;
    let totalJours = 0;

    demandes.forEach(d => {
      byStatut[d.statut] = (byStatut[d.statut] || 0) + 1;
      const dir = API.getDirection(d.idDirection);
      const dirLbl = dir ? dir.codeDirection : '—';
      const nbPers = Utils.personnesList(d).length;
      byDirection[dirLbl] = byDirection[dirLbl] || {total: 0, personnes: 0, jours: 0, affectees: 0};
      byDirection[dirLbl].total++;
      byDirection[dirLbl].personnes += nbPers;
      byDirection[dirLbl].jours += Utils.dureeJours(d.dateDepart, d.dateRetour);
      if (d.statut === 'AFFECTE' || d.statut === 'TERMINE') byDirection[dirLbl].affectees++;

      if (d.idVehicule) {
        const v = API.getVehicule(d.idVehicule);
        const lbl = v ? `${v.immatriculation} (${v.marque} ${v.modele})` : 'Inconnu';
        byVehicule[lbl] = byVehicule[lbl] || {count: 0, personnes: 0, jours: 0};
        byVehicule[lbl].count++;
        byVehicule[lbl].personnes += nbPers;
        byVehicule[lbl].jours += Utils.dureeJours(d.dateDepart, d.dateRetour);
      }

      totalPersonnes += nbPers;
      totalJours += Utils.dureeJours(d.dateDepart, d.dateRetour);
    });

    const syntheseRows = Object.entries(byStatut).map(([code, count]) => {
      const statut = API.getStatutVehiculeByCode(code);
      return `<tr>
        <td><strong>${Utils.esc(statut?.libelle || code)}</strong></td>
        <td style="text-align:center">${count}</td>
        <td style="text-align:center">${((count / demandes.length) * 100).toFixed(1)} %</td>
      </tr>`;
    }).join('');

    const dirRows = Object.entries(byDirection).sort((a,b) => b[1].total - a[1].total).map(([code, s]) => `
      <tr>
        <td><strong>${Utils.esc(code)}</strong></td>
        <td style="text-align:center">${s.total}</td>
        <td style="text-align:center">${s.affectees}</td>
        <td style="text-align:center">${s.personnes}</td>
        <td style="text-align:center">${s.jours} j</td>
      </tr>`).join('');

    const vehiculeRows = Object.entries(byVehicule).sort((a,b) => b[1].count - a[1].count).map(([lbl, s]) => `
      <tr>
        <td><strong>${Utils.esc(lbl)}</strong></td>
        <td style="text-align:center">${s.count}</td>
        <td style="text-align:center">${s.personnes}</td>
        <td style="text-align:center">${s.jours} j</td>
      </tr>`).join('');

    const detailRows = demandes.map(d => {
      const demandeur = API.getAgent(d.idDemandeur);
      const dir = API.getDirection(d.idDirection);
      const statut = API.getStatutVehiculeByCode(d.statut);
      return `<tr>
        <td><strong>${Utils.esc(d.numeroDemande)}</strong></td>
        <td>${Utils.esc(d.objet || '—')}</td>
        <td>${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'}
          <div style="font-size:9px;color:#6c757d">${demandeur ? Utils.esc(demandeur.matricule || '') : ''}</div>
        </td>
        <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
        <td>${Utils.esc(Utils.destsLabel(d))}</td>
        <td>${Utils.formatDate(d.dateDepart)}</td>
        <td>${Utils.formatDate(d.dateRetour)}</td>
        <td style="text-align:center">${Utils.dureeJours(d.dateDepart, d.dateRetour)} j</td>
        <td>${Utils.esc(Utils.personnesList(d).join(' • ') || '—')}</td>
        <td>${d.idVehicule ? Utils.esc(Utils.vehiculeLabel(d.idVehicule)) : '—'}</td>
        <td>${d.idChauffeur ? Utils.esc(Utils.agentNom(d.idChauffeur)) : '—'}</td>
        <td>${Utils.esc(statut?.libelle || d.statut)}</td>
      </tr>`;
    }).join('');

    const contenu = `
      <div class="print-section">📊 Synthèse par statut</div>
      <table class="print-table">
        <thead><tr>
          <th>Statut</th>
          <th style="text-align:center">Nombre</th>
          <th style="text-align:center">%</th>
        </tr></thead>
        <tbody>${syntheseRows}</tbody>
      </table>

      <div class="print-section">🏢 Répartition par direction</div>
      <table class="print-table">
        <thead><tr>
          <th>Direction</th>
          <th style="text-align:center">Demandes</th>
          <th style="text-align:center">Affectées</th>
          <th style="text-align:center">Personnes</th>
          <th style="text-align:center">Jours cumulés</th>
        </tr></thead>
        <tbody>${dirRows || '<tr><td colspan="5" style="text-align:center;color:#6c757d">Aucune donnée</td></tr>'}</tbody>
      </table>

      <div class="print-section">🚗 Répartition par véhicule affecté</div>
      <table class="print-table">
        <thead><tr>
          <th>Véhicule (immat. + modèle)</th>
          <th style="text-align:center">Nombre de demandes</th>
          <th style="text-align:center">Personnes cumulées</th>
          <th style="text-align:center">Jours cumulés</th>
        </tr></thead>
        <tbody>${vehiculeRows || '<tr><td colspan="4" style="text-align:center;color:#6c757d">Aucun véhicule affecté</td></tr>'}</tbody>
      </table>

      <div class="print-section">📋 Détail des demandes (${demandes.length})</div>
      <table class="print-table">
        <thead><tr>
          <th>N° Demande</th>
          <th>Objet</th>
          <th>Demandeur</th>
          <th>Direction</th>
          <th>Destination(s)</th>
          <th>Départ</th>
          <th>Retour</th>
          <th style="text-align:center">Durée</th>
          <th>Personnes transportées</th>
          <th>Véhicule</th>
          <th>Chauffeur</th>
          <th>Statut</th>
        </tr></thead>
        <tbody>${detailRows}</tbody>
      </table>

      <div class="print-signature">
        <div class="sig">Le Responsable du Parc Auto</div>
        <div class="sig">Le Directeur</div>
      </div>`;

    const totalDemandes = demandes.length;
    const affectees = demandes.filter(d => d.statut === 'AFFECTE').length;
    const terminees = demandes.filter(d => d.statut === 'TERMINE').length;
    const refused = demandes.filter(d => d.statut === 'REFUSE').length;

    ouvrir('État général des demandes de véhicules',
      `${totalDemandes} demande(s) — Édité le ${new Date().toLocaleDateString('fr-FR')}`,
      contenu,
      [
        {label: 'Total demandes', value: totalDemandes},
        {label: 'Affectées', value: affectees},
        {label: 'Terminées', value: terminees},
        {label: 'Refusées', value: refused},
        {label: 'Personnes cumulées', value: totalPersonnes},
        {label: 'Jours cumulés', value: totalJours}
      ]);
  }

  const BV_STYLES = `
    .bv-page {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      color: #000; padding: 6mm 8mm; font-size: 13px; line-height: 1.8;
      box-sizing: border-box;
    }
    .bv-header { text-align: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px double #0b3d91; }
    .bv-header .bv-org { font-size: 12px; color: #495057; margin-bottom: 6px; }
    .bv-header h1 { font-size: 26px; color: #0b3d91; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
    .bv-header .bv-ref { font-size: 12px; color: #6c757d; margin-top: 4px; }
    .bv-section { margin-bottom: 18px; }
    .bv-section h2 { font-size: 14px; color: #0b3d91; text-transform: uppercase; border-bottom: 2px solid #e6ecf7; padding-bottom: 4px; margin-bottom: 10px; }
    .bv-grid { display: grid; grid-template-columns: 200px 1fr 200px 1fr; gap: 6px 12px; }
    .bv-grid .lbl { font-weight: 700; color: #082a66; }
    .bv-grid .val { border-bottom: 1px dotted #adb5bd; padding: 2px 0; }
    .bv-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
    .bv-signatures .sig { text-align: center; padding-top: 60px; border-top: 1px solid #000; font-size: 12px; color: #495057; }
    .bv-demandeur-box {
      background: linear-gradient(135deg, #e6ecf7, #f8f9fa);
      border-left: 5px solid #0b3d91;
      padding: 14px 18px;
      margin-bottom: 18px;
      border-radius: 6px;
      display: flex; align-items: center; gap: 16px;
    }
    .bv-demandeur-box .avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #0b3d91, #082a66);
      color: #fff; display: grid; place-items: center;
      font-weight: bold; font-size: 20px; flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(11,61,145,.35);
    }
    .bv-demandeur-box .info { flex: 1; }
    .bv-demandeur-box .info .nom { font-weight: 700; font-size: 16px; color: #082a66; margin-bottom: 4px; }
    .bv-demandeur-box .info .meta { font-size: 12px; color: #495057; line-height: 1.7; }
    .bv-demandeur-box .info .meta strong { color: #082a66; }
  `;

  function _htmlBonVehicule(d) {
    const demandeur = API.getAgent(d.idDemandeur);
    const createur = d.idCreateur && d.idCreateur !== d.idDemandeur ? API.getAgent(d.idCreateur) : null;
    const direction = API.getDirection(d.idDirection);
    const esc = Utils.esc;

    const destsArr = Array.isArray(d.destinations) && d.destinations.length
      ? d.destinations
      : (d.destination ? [d.destination] : []);
    const personnesArr = Utils.personnesList(d);

    const initiales = demandeur ? ((demandeur.prenom||'').charAt(0) + (demandeur.nom||'').charAt(0)).toUpperCase() : '?';

    return `
      <div class="bv-page">
        <div class="bv-header">
          <div class="bv-org">Royaume du Maroc — Administration Publique</div>
          <div class="bv-org">${esc(direction?.libelle || '—')}</div>
          <h1>Demande de véhicule</h1>
          <div class="bv-ref">N° ${esc(d.numeroDemande)} — Émis le ${Utils.formatDate(d.dateCreation)}</div>
        </div>

        <div class="bv-demandeur-box">
          <div class="avatar">${esc(initiales)}</div>
          <div class="info">
            <div class="nom">👤 Demandeur : ${esc(demandeur ? demandeur.prenom + ' ' + demandeur.nom : '—')}</div>
            <div class="meta">
              ${demandeur?.matricule ? `<strong>Matricule :</strong> ${esc(demandeur.matricule)}` : ''}
              ${demandeur?.fonction ? ` &nbsp;•&nbsp; <strong>Fonction :</strong> ${esc(demandeur.fonction)}` : ''}
              ${demandeur?.grade ? ` &nbsp;•&nbsp; <strong>Grade :</strong> ${esc(demandeur.grade)}` : ''}
              <br>
              ${direction ? `<strong>Direction :</strong> ${esc(direction.codeDirection)} — ${esc(direction.libelle)}` : ''}
              ${demandeur?.telephone ? ` &nbsp;•&nbsp; <strong>Tél :</strong> ${esc(demandeur.telephone)}` : ''}
              ${demandeur?.email ? ` &nbsp;•&nbsp; <strong>Email :</strong> ${esc(demandeur.email)}` : ''}
              <br>
              <strong>Date de la demande :</strong> ${Utils.formatDateTime(d.dateCreation)}
              ${createur ? ` &nbsp;•&nbsp; <strong>Saisie par :</strong> ${esc(createur.prenom + ' ' + createur.nom)}` : ''}
            </div>
          </div>
        </div>

        <div class="bv-section">
          <h2>Objet du déplacement</h2>
          <div class="bv-grid">
            <div class="lbl">Objet :</div>
            <div class="val" style="grid-column: span 3">${esc(d.objet || '—')}</div>
            <div class="lbl">Destination(s) :</div>
            <div class="val" style="grid-column: span 3">${destsArr.length ? esc(destsArr.join('  →  ')) : '—'}</div>
            <div class="lbl">Personnes transportées :</div>
            <div class="val" style="grid-column: span 3">${personnesArr.length ? esc(personnesArr.join(' • ')) : '—'}</div>
            <div class="lbl">Motif :</div>
            <div class="val" style="grid-column: span 3">${esc(d.motif || '—')}</div>
          </div>
        </div>

        <div class="bv-section">
          <h2>Période</h2>
          <div class="bv-grid">
            <div class="lbl">Départ :</div><div class="val">${Utils.formatDateTime(d.dateDepart)}</div>
            <div class="lbl">Retour :</div><div class="val">${Utils.formatDateTime(d.dateRetour)}</div>
          </div>
        </div>

        <div class="bv-signatures">
          <div class="sig">Le demandeur<br><small>${esc(demandeur ? demandeur.prenom + ' ' + demandeur.nom : '')}</small></div>
          <div class="sig">Le responsable du parc</div>
          <div class="sig">Le Directeur</div>
        </div>
      </div>`;
  }

  function imprimerBonVehicule(idDemande) {
    const d = API.getDemandeVehicule(idDemande);
    if (!d) { Utils.toast('Demande introuvable', 'error'); return; }

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>Demande de véhicule — ${Utils.esc(d.numeroDemande)}</title>
      <style>
        @page { size: A4 portrait; margin: 0; }
        html, body { height: 100%; margin: 0; padding: 0; background: #fff; }
        * { box-sizing: border-box; }
        ${BV_STYLES}
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style></head><body>
        ${_htmlBonVehicule(d)}
      </body></html>`;

    _imprimerHtml(html);
  }

  function imprimerBonsVehicules() {
    const demandes = Scope.demandesVehicules()
      .filter(d => d.idVehicule)
      .slice()
      .sort((a, b) => (a.dateDepart || '').localeCompare(b.dateDepart || ''));

    if (!demandes.length) {
      Utils.toast('Aucune demande avec véhicule affecté à imprimer', 'warning');
      return;
    }

    const bons = demandes.map(d => _htmlBonVehicule(d)).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>Demandes de véhicule — ${demandes.length} demande(s)</title>
      <style>
        @page { size: A4 portrait; margin: 0; }
        html, body { height: 100%; margin: 0; padding: 0; background: #fff; }
        * { box-sizing: border-box; }
        ${BV_STYLES}
        .bv-page {
          page-break-after: always;
          break-after: page;
          min-height: 297mm;
        }
        .bv-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bv-page { page-break-inside: avoid; break-inside: avoid; }
        }
      </style></head><body>
        ${bons}
      </body></html>`;

    _imprimerHtml(html);
  }

  function _imprimerHtml(html) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();

    const lancer = () => setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
      catch (e) { Utils.toast('Erreur impression : ' + e.message, 'error'); }
      finally { setTimeout(() => document.body.contains(iframe) && document.body.removeChild(iframe), 1500); }
    }, 300);

    if (doc.readyState === 'complete') lancer(); else iframe.onload = lancer;
  }

  function _htmlOrdreMission(m) {
    const esc = Utils.esc;
    const direction = API.getDirection(m.idDirection);
    const participants = (m.participants || []).map(p => {
      const a = API.getAgent(p.idAgent);
      return a ? {...a, roleMission: p.roleMission, ordrePassage: p.ordrePassage} : null;
    }).filter(Boolean).sort((a,b) => (a.ordrePassage||0) - (b.ordrePassage||0));

    const driver = participants.find(p => (p.fonction||'').toLowerCase().includes('chauffeur')) || participants[0] || null;
    const accompagnants = participants.filter(p => !driver || p.idAgent !== driver.idAgent);

    let vehicule = null;
    const demandes = API.getDemandesVehicules().filter(d =>
      d.idDemandeur === m.idDemandeur && d.idVehicule
    );
    if (demandes.length) vehicule = API.getVehicule(demandes[0].idVehicule);
    if (!vehicule) {
      const itin = (m.itineraires || []).find(i => i.idTransport === 1);
      if (itin) {
        const parc = API.getVehicules().filter(v => v.actif !== false);
        if (parc.length) vehicule = parc[0];
      }
    }

    const numeroOm = m.numeroOm || '—';
    const dateEmission = Utils.formatDate(m.dateEmission);
    const lieuEmission = m.lieuDepart || 'الرباط';

    const fmtJMA = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt)) return '—';
      const pad = (n) => String(n).padStart(2,'0');
      return `${dt.getFullYear()}/${pad(dt.getMonth()+1)}/${pad(dt.getDate())}`;
    };
    const dateDepart = fmtJMA(m.dateDepart);
    const dateRetour = fmtJMA(m.dateRetour);

    const trajetDe = m.lieuDepart || 'الرباط';
    const trajetVers = m.lieuPrincipal || '—';
    const objet = m.objet || 'حاجيات المصلحة';
    const dirLabel = direction?.libelle || '—';

    return `
      <style>
        .om-doc {
          font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif;
          direction: rtl;
          text-align: right;
          color: #000;
          font-size: 11px;
          line-height: 1.15;
          background: #fff;
          display: flex;
          flex-direction: column;
          min-height: 273mm;
          box-sizing: border-box;
          padding: 20px 40px;
        }
        .om-content { flex: 1; display: flex; flex-direction: column; }
        .om-meta {
          display: flex; justify-content: space-between;
          font-size: 11px; margin: 0 0 14px; line-height: 1.2;
        }
        .om-title {
          text-align: center;
          font-size: 30px;
          font-weight: bold;
          margin: 8px 0 4px;
          letter-spacing: 3px;
          line-height: 1.1;
        }
        .om-title-line {
          width: 170px; height: 2px; background: #000;
          margin: 0 auto 12px;
        }
        .om-fields { font-size: 11px; line-height: 1.15; }
        .om-field {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 10px;
          padding: 3px 0;
          align-items: baseline;
          line-height: 1.15;
        }
        .om-field-label { font-weight: bold; line-height: 1.2; }
        .om-field-label::after { content: ' :'; }
        .om-field-value {
          border-bottom: 1px dotted #999;
          padding-bottom: 1px;
          line-height: 1.2;
        }
        .om-para {
          margin: 10px 50px;
          text-align: right;
          font-size: 11px;
          line-height: 1.25;
        }
        .om-footer {
          margin-top: auto;
          flex-shrink: 0;
          padding-top: 6px;
          border-top: 1px solid #999;
          display: flex;
          justify-content: space-between;
          font-size: 7.5px;
          direction: ltr;
          color: #333;
          gap: 14px;
          line-height: 1.15;
        }
        .om-footer-left { text-align: left; flex: 1; line-height: 1.15; }
        .om-footer-right { text-align: right; flex: 1; direction: rtl; line-height: 1.15; }
        .om-footer strong { display: block; font-size: 8px; margin-bottom: 1px; }
        .om-stamp {
          display: inline-block; width: 48px; height: 48px;
          border: 2px dashed #1e7e34; border-radius: 50%;
          text-align: center; padding: 4px;
          font-size: 5.5px; color: #1e7e34;
          font-weight: bold; line-height: 1.05;
          margin-right: 6px;
          vertical-align: top;
        }
      </style>

      <div class="om-doc">
        <div class="om-content">
          <div class="om-meta">
            <div>${esc(lieuEmission)}، في: <strong>${dateEmission}</strong></div>
            <div>الرقم : <strong>${esc(numeroOm)}</strong></div>
          </div>

          <div class="om-title">أمر بمهمة</div>
          <div class="om-title-line"></div>

          <div class="om-fields">
            <div class="om-field">
              <div class="om-field-label">الإسم</div>
              <div class="om-field-value">${driver ? esc(driver.prenom + ' ' + driver.nom) : '—'}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">الدرجة</div>
              <div class="om-field-value">${driver ? esc(driver.grade || '—') : '—'}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">الوظيفة</div>
              <div class="om-field-value">${driver ? esc(driver.fonction || '—') : '—'}</div>
            </div>
          </div>

          <div class="om-para">
            يسمح له(ا) باستعمال سيارة المصلحة المشار إليها أسفله للتنقل من
            <strong>${esc(trajetDe)}</strong>
            إلى
            <strong>${esc(trajetVers)}</strong>.
          </div>

          <div class="om-fields">
            <div class="om-field">
              <div class="om-field-label">لأجل</div>
              <div class="om-field-value">${esc(objet)}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">تاريخ الذهاب</div>
              <div class="om-field-value">${dateDepart}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">تاريخ الإياب</div>
              <div class="om-field-value">${dateRetour}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">وسيلة النقل</div>
              <div class="om-field-value">${vehicule ? esc(vehicule.immatriculation) : '—'}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">السائق</div>
              <div class="om-field-value">${driver ? 'المعني(ة) بالأمر' : '—'}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">الأشخاص المرافقون</div>
              <div class="om-field-value">${accompagnants.length ? esc(accompagnants.map(a => a.prenom + ' ' + a.nom).join(' — ')) : '—'}</div>
            </div>
            <div class="om-field">
              <div class="om-field-label">المديرية المستفيدة</div>
              <div class="om-field-value">${esc(dirLabel)}</div>
            </div>
          </div>
        </div>

        <div class="om-footer">
          <div class="om-footer-left">
            <span class="om-stamp">GENERATION<br>GREEN<br>2020 – 2030</span>
            <strong>DIRECTION DES AFFAIRES ADMINISTRATIVES ET JURIDIQUES</strong>
            B.P : 607, Station Dbagh, Avenue Hassan II - Rabat<br>
            Tél. : (+212) 537 10 35 00 / 37 00 &nbsp;—&nbsp; Fax : (+212) 537 69 84 01
          </div>
          <div class="om-footer-right">
            <strong>مديرية الشؤون الإدارية والقانونية</strong>
            صندوق البريد : 607 محطة الدباغ شارع الحسن الثاني - الرباط<br>
            الهاتف : (+212) 537 10 35 00 / 37 00 &nbsp;—&nbsp; الفاكس : (+212) 537 69 84 01
          </div>
        </div>
      </div>`;
  }

  function previsualiserOrdreMission(idMission) {
    const m = API.getMission(idMission);
    if (!m) { Utils.toast('Mission introuvable', 'error'); return; }
    const contenu = _htmlOrdreMission(m);
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>📄 Aperçu — Ordre de mission <code style="font-size:13px">${Utils.esc(m.numeroOm)}</code></h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body" style="background:#e9ecef">
            <div style="background:#fff;padding:20px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.12)">
              ${contenu}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
            <button class="btn" onclick="Printer.imprimerOrdreMission(${idMission})">🖨️ Imprimer</button>
          </div>
        </div>
      </div>`);
  }

  function imprimerOrdreMission(idMission) {
    const m = API.getMission(idMission);
    if (!m) { Utils.toast('Mission introuvable', 'error'); return; }
    const contenu = _htmlOrdreMission(m);
    const titre = `Ordre de mission ${m.numeroOm}`;
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <title>${Utils.esc(titre)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 0; }
        html, body { height: 100%; margin: 0; padding: 0; background: #fff; }
        * { box-sizing: border-box; }
        body { font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif; color: #212529; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .om-doc { padding: 12mm 15mm !important; }
        }
      </style></head><body>${contenu}</body></html>`;

    _imprimerHtml(html);
  }

  return {
    imprimerDemandesVehicules,
    imprimerEtatDemandes,
    imprimerBonVehicule,
    imprimerBonsVehicules,
    imprimerListeVehicules,
    imprimerFicheVehicule,
    imprimerListeAgents,
    previsualiserOrdreMission,
    imprimerOrdreMission
  };
})();