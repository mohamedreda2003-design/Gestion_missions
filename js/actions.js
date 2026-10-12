/* =====================================================
   9. ACTIONS
   ===================================================== */
const Actions = {
  importerExcel(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const handlers = {
        agents: Excel.importerAgents,
        directions: Excel.importerDirections,
        destinations: Excel.importerDestinations,
        missions: Excel.importerMissions,
        vehicules: Excel.importerDemandesVehicules,
        parc_auto: Excel.importerParcAuto
      };
      const handler = handlers[type];
      if (!handler) { Utils.toast('Type d\'import inconnu', 'error'); return; }
      Utils.toast('Import en cours...', 'info', 1500);
      try {
        const res = await handler(file);
        if (res.ok) Utils.toast(`${res.ok} ligne(s) importée(s) avec succès`, 'success', 4000);
        if (res.err) {
          res.erreurs.slice(0, 3).forEach(m => Utils.toast(m, 'error', 5000));
          if (res.erreurs.length > 3) Utils.toast(`…et ${res.erreurs.length - 3} autre(s) erreur(s)`, 'error', 5000);
        }
        App.refresh();
      } catch (err) {
        Utils.toast('Erreur d\'import : ' + err.message, 'error', 5000);
      }
    };
    input.click();
  },

  resetFiltres() {
    document.getElementById('filter-statut').value = '';
    document.getElementById('filter-mission-direction').value = '';
    document.getElementById('filter-search').value = '';
    Actions.renderMissions();
  },
  resetFiltresVehicules() {
    const s = document.getElementById('filter-veh-statut');
    const d = document.getElementById('filter-veh-direction');
    const q = document.getElementById('filter-veh-search');
    if (s) s.value = ''; if (d) d.value = ''; if (q) q.value = '';
    Actions.renderVehicules();
  },
  resetFiltresParcAuto() {
    const q = document.getElementById('filter-parc-auto');
    const s = document.getElementById('filter-parc-auto-statut');
    const d = document.getElementById('filter-parc-auto-direction');
    if (q) q.value = ''; if (s) s.value = ''; if (d) d.value = '';
    Actions.renderParcAuto();
  },
  resetFiltresAgents() {
    const q = document.getElementById('filter-agent');
    const d = document.getElementById('filter-agent-direction');
    const s = document.getElementById('filter-agent-statut');
    if (q) q.value = ''; if (d) d.value = ''; if (s) s.value = '';
    Actions.renderAgents();
  },
  workflowViz(idMission) {
    const m = API.getMission(idMission);
    if (!m) return '';
    const wf = API.getWorkflow(m.idWorkflow);
    if (!wf || !wf.etapes) return '';
    const vals = API.getValidationsByMission(idMission);
    const steps = wf.etapes.map(e => {
      const v = vals.find(x => x.niveau === e.niveau);
      let cls = '';
      if (v) {
        if (v.decision === 'VALIDE') cls = 'done';
        else if (v.decision === 'REJETE') cls = 'rejected';
        else if (v.decision === 'EN_ATTENTE') cls = 'current';
      }
      return `<div class="step ${cls}" title="${Utils.esc(e.libelle)}${v ? ' • '+v.decision : ''}">
        <span class="num">${e.niveau}</span>
        <span>${Utils.esc(e.libelle.substring(0,30))}${e.libelle.length>30?'…':''}</span></div>`;
    }).join('<span class="arrow">→</span>');
    return `<div class="workflow-viz">${steps}</div>`;
  },

  /* ==================== MISSIONS ==================== */
  renderMissions() {
    const tbody = document.getElementById('missions-tbody');
    if (!tbody) return;
    const fStatut = document.getElementById('filter-statut')?.value || '';
    const fDir = document.getElementById('filter-mission-direction')?.value || '';
    const fSearch = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();
    let list = Scope.missions();
    if (fStatut) list = list.filter(m => String(m.idStatut) === fStatut);
    if (fDir) list = list.filter(m => m.idDirection == fDir);
    if (fSearch) list = list.filter(m =>
      (m.numeroOm||'').toLowerCase().includes(fSearch) ||
      (m.objet||'').toLowerCase().includes(fSearch) ||
      (m.lieuPrincipal||'').toLowerCase().includes(fSearch) ||
      (m.contexte||'').toLowerCase().includes(fSearch)
    );
    list.sort((a,b) => (b.dateEmission||'').localeCompare(a.dateEmission||''));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted" style="padding:30px">Aucune mission</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(m => {
      const demandeur = API.getAgent(m.idDemandeur);
      const direction = API.getDirection(m.idDirection);
      const participants = m.participants || [];
      const dests = (m.itineraires || []).map(i => i.lieuArrivee).filter(Boolean);
      const statutCode = Utils.statutCode(m);
      const canPrintOM = ['OM_ETABLI','VALIDE','EN_COURS','CLOTURE'].includes(statutCode);
      return `
        <tr>
          <td><strong>${Utils.esc(m.numeroOm)}</strong></td>
          <td>${Utils.esc((m.objet||'').substring(0,45))}${(m.objet||'').length>45?'…':''}</td>
          <td>${direction ? Utils.esc(direction.codeDirection) : '—'}</td>
          <td>${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'}</td>
          <td>${Utils.formatDate(m.dateDepart)}</td>
          <td>${Utils.formatDate(m.dateRetour)}</td>
          <td>${dests.length ? Utils.esc(dests.join(' → ')) : Utils.esc(m.lieuPrincipal||'—')}</td>
          <td style="text-align:center">
            <span class="badge badge-SOUMIS" title="${Utils.esc(participants.map(p => Utils.agentNom(p.idAgent)).join(' • '))}">${participants.length} 👤</span>
          </td>
          <td style="text-align:center">${Utils.dureeJours(m.dateDepart, m.dateRetour)} j</td>
          <td>${Utils.badgeStatut(m)}</td>
          <td style="text-align:center">
            ${canPrintOM ? `<button class="om-icon-btn" onclick="Printer.previsualiserOrdreMission(${m.idMission})" title="Aperçu ordre de mission"></button>` : '<span class="text-muted">—</span>'}
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="Actions.detail(${m.idMission})">Détail</button>
              ${statutCode === 'BROUILLON' ? `<button class="btn btn-sm btn-success" onclick="Actions.soumettreMission(${m.idMission})">Soumettre</button>` : ''}
              ${statutCode === 'SOUMIS' ? `<button class="btn btn-sm btn-outline" onclick="Actions.annulerMission(${m.idMission})">Annuler</button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  nouvelleMission() {
    const session = Auth.session();
    const agent = Auth.currentAgent();
    if (!session?.idAgent) { Utils.toast('Compte non relié à un agent', 'error'); return; }
    const directions = Scope.directions();
    const agents = API.getAgents().filter(a => a.actif);
    const destinations = API.getDestinations().filter(d => d.actif !== false);
    const transports = API.getTransports();
    const typesFrais = API.getTypesFrais();

    const dlDestinations = Utils.datalist('dl-mission-dest', destinations.map(d => d.libelle));
    const dlLieuxDepart = Utils.datalist('dl-mission-lieu-depart', destinations.map(d => d.libelle));

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>➕ Nouvelle mission</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            ${dlDestinations}
            ${dlLieuxDepart}
            <form id="form-mission">
              <div class="alert alert-info" style="margin-bottom:14px">
                La mission sera créée en <strong>brouillon</strong>. Vous pourrez la soumettre au circuit de validation ensuite.
              </div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Objet de la mission <span class="required">*</span></label>
                  <input type="text" id="m-objet" class="form-control" required maxlength="200" placeholder="Ex : Mission de contrôle à Casablanca">
                </div>
                <div class="form-group full-width">
                  <label>Contexte / Justification</label>
                  <textarea id="m-contexte" class="form-control" rows="2" maxlength="500" placeholder="Détails complémentaires..."></textarea>
                </div>

                <div class="form-group">
                  <label>Direction <span class="required">*</span></label>
                  <select id="m-direction" class="form-control" required>
                    ${directions.map(d => `<option value="${d.idDirection}" ${agent && agent.idDirection === d.idDirection ? 'selected' : ''}>${Utils.esc(d.codeDirection)} — ${Utils.esc(d.libelle)}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Date d'émission <span class="required">*</span></label>
                  <input type="date" id="m-date-emission" class="form-control" required value="${new Date().toISOString().substring(0,10)}">
                </div>

                <div class="form-group">
                  <label>Lieu de départ <span class="required">*</span></label>
                  <input type="text" id="m-lieu-depart" class="form-control" required list="dl-mission-lieu-depart" value="Rabat" placeholder="Saisir ou choisir...">
                </div>

                <div class="form-group">
                  <label>Destination principale <span class="required">*</span></label>
                  <input type="text" id="m-lieu-principal" class="form-control" required list="dl-mission-dest" placeholder="Saisir ou choisir...">
                </div>

                <div class="form-group">
                  <label>Date & heure de départ <span class="required">*</span></label>
                  <input type="datetime-local" id="m-date-depart" class="form-control" required>
                </div>

                <div class="form-group">
                  <label>Date & heure de retour <span class="required">*</span></label>
                  <input type="datetime-local" id="m-date-retour" class="form-control" required>
                </div>

                <div class="form-group">
                  <label>Budget prévisionnel (MAD)</label>
                  <input type="number" id="m-budget" class="form-control" min="0" step="0.01" value="0">
                </div>

                <div class="form-group">
                  <label>Pays</label>
                  <input type="text" id="m-pays" class="form-control" value="Maroc">
                </div>
              </div>

              <h4 style="margin-top:20px;color:var(--primary-dark);border-bottom:1px solid var(--gray-200);padding-bottom:6px">👥 Participants</h4>
              <div id="m-participants-list" style="margin-top:10px"></div>
              <button type="button" class="btn btn-sm btn-outline mt-2" onclick="Actions.missionAddParticipant()">+ Ajouter un participant</button>

              <h4 style="margin-top:20px;color:var(--primary-dark);border-bottom:1px solid var(--gray-200);padding-bottom:6px">🗺️ Itinéraire</h4>
              <div id="m-itineraires-list" style="margin-top:10px"></div>
              <button type="button" class="btn btn-sm btn-outline mt-2" onclick="Actions.missionAddItineraire()">+ Ajouter une étape</button>

              <h4 style="margin-top:20px;color:var(--primary-dark);border-bottom:1px solid var(--gray-200);padding-bottom:6px">💰 Frais prévus</h4>
              <div id="m-frais-list" style="margin-top:10px"></div>
              <button type="button" class="btn btn-sm btn-outline mt-2" onclick="Actions.missionAddFrais()">+ Ajouter un frais</button>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn btn-success" onclick="Actions.saveMission(true)">Enregistrer &amp; Soumettre</button>
            <button class="btn" onclick="Actions.saveMission(false)">Enregistrer (brouillon)</button>
          </div>
        </div>
      </div>`);

    Actions._missionAgentsList = agents;
    Actions._missionDestList = destinations;
    Actions._missionTransportList = transports;
    Actions._missionTypesFrais = typesFrais;

    if (agent) {
      Actions.missionAddParticipant({idAgent: agent.idAgent, roleMission: 'CHEF_MISSION'});
    } else {
      Actions.missionAddParticipant();
    }
  },

  missionAddParticipant(data = {}) {
    const list = document.getElementById('m-participants-list');
    if (!list) return;
    const agents = Actions._missionAgentsList || [];
    const row = document.createElement('div');
    row.className = 'dyn-row mission-participant-row';
    row.style.alignItems = 'flex-start';
    row.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:220px">
        <input type="text" class="form-control m-part-search"
               placeholder="🔍 Rechercher par nom, matricule, fonction..."
               autocomplete="off">
        <select class="form-control m-part-agent" size="5" style="height:auto">
          <option value="">— Sélectionner un agent —</option>
          ${agents.map(a => `<option value="${a.idAgent}" ${data.idAgent === a.idAgent ? 'selected' : ''}>${Utils.esc(a.prenom + ' ' + a.nom)} (${Utils.esc(a.matricule)}) — ${Utils.esc(a.fonction||'')}</option>`).join('')}
        </select>
        <small class="text-muted m-part-count">${agents.length} agent(s)</small>
      </div>
      <select class="form-control m-part-role" style="max-width:180px">
        <option value="CHEF_MISSION" ${data.roleMission === 'CHEF_MISSION' ? 'selected' : ''}>Chef de mission</option>
        <option value="MEMBRE" ${data.roleMission === 'MEMBRE' || !data.roleMission ? 'selected' : ''}>Membre</option>
      </select>
      <button type="button" class="btn btn-sm btn-danger" style="max-width:40px" onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
    list.appendChild(row);

    const searchInput = row.querySelector('.m-part-search');
    const selectEl = row.querySelector('.m-part-agent');
    const countEl = row.querySelector('.m-part-count');
    if (searchInput && selectEl) {
      const allAgents = agents.map(a => ({
        value: String(a.idAgent),
        label: `${a.prenom} ${a.nom} (${a.matricule}) — ${a.fonction||''}`,
        search: `${a.prenom} ${a.nom} ${a.matricule} ${a.fonction||''} ${a.grade||''}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const norm = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      searchInput.addEventListener('input', () => {
        const q = norm(searchInput.value.trim());
        const sel = selectEl.value;
        const filtres = allAgents.filter(o => !q || norm(o.search).includes(q));
        selectEl.innerHTML = `<option value="">— Sélectionner un agent —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === sel ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (countEl) countEl.textContent = `${filtres.length} / ${allAgents.length} agent(s)`;
      });
    }
  },

  missionAddItineraire(data = {}) {
    const list = document.getElementById('m-itineraires-list');
    if (!list) return;
    const transports = Actions._missionTransportList || [];
    const row = document.createElement('div');
    row.className = 'dyn-row mission-itineraire-row';
    row.style.flexWrap = 'wrap';
    row.innerHTML = `
      <input type="text" class="form-control m-it-lieu-depart" placeholder="Lieu départ" value="${Utils.esc(data.lieuDepart||'')}" style="min-width:120px">
      <input type="text" class="form-control m-it-lieu-arrivee" placeholder="Lieu arrivée" value="${Utils.esc(data.lieuArrivee||'')}" style="min-width:120px">
      <input type="datetime-local" class="form-control m-it-date-depart" value="${data.dateDepart ? Utils.toLocalInput(data.dateDepart) : ''}" style="min-width:170px">
      <input type="datetime-local" class="form-control m-it-date-arrivee" value="${data.dateArrivee ? Utils.toLocalInput(data.dateArrivee) : ''}" style="min-width:170px">
      <input type="number" class="form-control m-it-distance" placeholder="km" min="0" value="${data.distanceKm || 0}" style="max-width:80px">
      <select class="form-control m-it-transport" style="max-width:160px">
        ${transports.map(t => `<option value="${t.idTransport}" ${data.idTransport === t.idTransport ? 'selected' : ''}>${Utils.esc(t.libelle)}</option>`).join('')}
      </select>
      <button type="button" class="btn btn-sm btn-danger" style="max-width:40px" onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
    list.appendChild(row);
  },

  missionAddFrais(data = {}) {
    const list = document.getElementById('m-frais-list');
    if (!list) return;
    const typesFrais = Actions._missionTypesFrais || [];
    const row = document.createElement('div');
    row.className = 'dyn-row mission-frais-row';
    row.innerHTML = `
      <select class="form-control m-fr-type" style="max-width:180px">
        ${typesFrais.map(t => `<option value="${t.idTypeFrais}" ${data.idTypeFrais === t.idTypeFrais ? 'selected' : ''}>${Utils.esc(t.libelle)}</option>`).join('')}
      </select>
      <input type="text" class="form-control m-fr-libelle" placeholder="Libellé" value="${Utils.esc(data.libelle||'')}">
      <input type="number" class="form-control m-fr-qte" placeholder="Qté" min="1" value="${data.quantite || 1}" style="max-width:80px">
      <input type="number" class="form-control m-fr-pu" placeholder="P.U. (MAD)" min="0" step="0.01" value="${data.montantUnitaire || 0}" style="max-width:130px">
      <button type="button" class="btn btn-sm btn-danger" style="max-width:40px" onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
    list.appendChild(row);
  },

  saveMission(submit = false) {
    const form = document.getElementById('form-mission');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const session = Auth.session();
    const agent = Auth.currentAgent();
    if (!session?.idAgent) { Utils.toast('Compte non relié à un agent', 'error'); return; }

    const objet = document.getElementById('m-objet').value.trim();
    const dateDepart = document.getElementById('m-date-depart').value;
    const dateRetour = document.getElementById('m-date-retour').value;
    if (!dateDepart || !dateRetour || dateRetour <= dateDepart) {
      Utils.toast('La date de retour doit être postérieure à la date de départ', 'error');
      return;
    }

    const participants = [];
    document.querySelectorAll('.mission-participant-row').forEach((row, idx) => {
      const idAg = Number(row.querySelector('.m-part-agent').value);
      if (!idAg) return;
      participants.push({
        idAgent: idAg,
        roleMission: row.querySelector('.m-part-role').value,
        ordrePassage: participants.length + 1
      });
    });
    if (!participants.length) { Utils.toast('Au moins un participant requis', 'error'); return; }
    if (!participants.some(p => p.idAgent === session.idAgent)) {
      participants.unshift({idAgent: session.idAgent, roleMission: 'CHEF_MISSION', ordrePassage: 1});
    }

    const itineraires = [];
    document.querySelectorAll('.mission-itineraire-row').forEach((row, idx) => {
      const lD = row.querySelector('.m-it-lieu-depart').value.trim();
      const lA = row.querySelector('.m-it-lieu-arrivee').value.trim();
      const dD = row.querySelector('.m-it-date-depart').value;
      const dA = row.querySelector('.m-it-date-arrivee').value;
      if (!lD || !lA || !dD || !dA) return;
      itineraires.push({
        ordreEtape: itineraires.length + 1,
        lieuDepart: lD,
        lieuArrivee: lA,
        dateDepart: dD,
        dateArrivee: dA,
        distanceKm: Number(row.querySelector('.m-it-distance').value) || 0,
        idTransport: Number(row.querySelector('.m-it-transport').value) || 1
      });
    });

    const frais = [];
    document.querySelectorAll('.mission-frais-row').forEach(row => {
      const type = Number(row.querySelector('.m-fr-type').value);
      const lib = row.querySelector('.m-fr-libelle').value.trim();
      const qte = Number(row.querySelector('.m-fr-qte').value) || 0;
      const pu = Number(row.querySelector('.m-fr-pu').value) || 0;
      if (!type || !qte) return;
      frais.push({
        idTypeFrais: type,
        libelle: lib,
        quantite: qte,
        montantUnitaire: pu,
        montantTotal: qte * pu
      });
    });

    const lieuPrincipal = document.getElementById('m-lieu-principal').value.trim();
    const destObj = API.getDestinationByLibelle(lieuPrincipal);
    const pays = document.getElementById('m-pays').value.trim() || (destObj?.pays || 'Maroc');

    const payload = {
      objet,
      contexte: document.getElementById('m-contexte').value.trim(),
      dateEmission: document.getElementById('m-date-emission').value,
      dateDepart,
      dateRetour,
      lieuDepart: document.getElementById('m-lieu-depart').value.trim(),
      lieuPrincipal,
      pays,
      budgetPrevisionnel: Number(document.getElementById('m-budget').value) || 0,
      idDemandeur: session.idAgent,
      idDirection: Number(document.getElementById('m-direction').value),
      idWorkflow: 3,
      participants,
      itineraires,
      frais
    };

    try {
      const mission = API.createMission(payload);
      if (submit) {
        API.changerStatut(mission.idMission, 'SOUMIS');
        const wf = API.getWorkflow(mission.idWorkflow);
        if (wf && wf.etapes) {
          const dir = API.getDirection(mission.idDirection);
          let validateurId = null;
          if (dir) {
            const directeur = API.getAgents().find(a =>
              a.idDirection === dir.idDirection && (a.fonction||'').toLowerCase().includes('directeur')
            );
            validateurId = directeur?.idAgent || null;
          }
          const etape1 = wf.etapes[0];
          if (etape1 && validateurId) {
            API.createValidation({
              idMission: mission.idMission,
              idValidateur: validateurId,
              niveau: etape1.niveau,
              libelleEtape: etape1.libelle,
              decision: 'EN_ATTENTE'
            });
          }
        }
        Utils.toast('Mission créée et soumise', 'success');
      } else {
        Utils.toast('Mission créée (brouillon)', 'success');
      }
      App.closeModal();
      App.refresh();
    } catch (err) {
      Utils.toast(err.message, 'error');
    }
  },

  soumettreMission(id) {
    if (!Utils.confirm('Soumettre cette mission au circuit de validation ?')) return;
    try {
      const m = API.getMission(id);
      if (!m) return;
      API.changerStatut(id, 'SOUMIS');
      const wf = API.getWorkflow(m.idWorkflow);
      if (wf && wf.etapes && wf.etapes[0]) {
        const dir = API.getDirection(m.idDirection);
        let validateurId = null;
        if (dir) {
          const directeur = API.getAgents().find(a =>
            a.idDirection === dir.idDirection && (a.fonction||'').toLowerCase().includes('directeur')
          );
          validateurId = directeur?.idAgent || null;
        }
        const existante = API.getValidationsByMission(id).find(v => v.niveau === 1);
        if (!existante && validateurId) {
          API.createValidation({
            idMission: id,
            idValidateur: validateurId,
            niveau: wf.etapes[0].niveau,
            libelleEtape: wf.etapes[0].libelle,
            decision: 'EN_ATTENTE'
          });
        }
      }
      Utils.toast('Mission soumise', 'success');
      App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  annulerMission(id) {
    if (!Utils.confirm('Annuler cette soumission ? La mission repassera en brouillon.')) return;
    try {
      API.changerStatut(id, 'BROUILLON');
      API.deleteValidationsByMission(id);
      Utils.toast('Mission ramenée en brouillon', 'success');
      App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  detail(idMission) {
    const m = API.getMission(idMission);
    if (!m) return;
    const demandeur = API.getAgent(m.idDemandeur);
    const direction = API.getDirection(m.idDirection);
    const wf = API.getWorkflow(m.idWorkflow);
    const validations = API.getValidationsByMission(idMission);
    const participants = (m.participants || []).map(p => {
      const a = API.getAgent(p.idAgent);
      return a ? {...a, roleMission: p.roleMission, ordrePassage: p.ordrePassage} : null;
    }).filter(Boolean).sort((a,b) => (a.ordrePassage||0) - (b.ordrePassage||0));
    const itineraires = (m.itineraires || []).slice().sort((a,b) => (a.ordreEtape||0) - (b.ordreEtape||0));
    const frais = m.frais || [];
    const statutCode = Utils.statutCode(m);
    const canPrintOM = ['OM_ETABLI','VALIDE','EN_COURS','CLOTURE'].includes(statutCode);
    const roleLabels = {CHEF_MISSION:'Chef de mission', MEMBRE:'Membre'};

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>📋 Mission ${Utils.esc(m.numeroOm)}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="flex-between" style="margin-bottom:16px">
              <div>
                <h3 style="color:var(--primary-dark);font-size:18px">${Utils.esc(m.objet)}</h3>
                <div class="text-muted" style="font-size:12px;margin-top:4px">
                  Émise le ${Utils.formatDate(m.dateEmission)} — Direction : ${Utils.esc(direction?.codeDirection || '—')}
                </div>
              </div>
              ${Utils.badgeStatut(m)}
            </div>

            ${wf ? `
              <div class="alert alert-info" style="margin-bottom:14px">
                <strong>Circuit de validation :</strong> ${Utils.esc(wf.libelle)}
                ${Actions.workflowViz(idMission)}
              </div>
            ` : ''}

            <div class="form-grid" style="margin-bottom:20px">
              <div><strong>Demandeur :</strong><br>${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'}</div>
              <div><strong>Période :</strong><br>${Utils.formatDateTime(m.dateDepart)} → ${Utils.formatDateTime(m.dateRetour)}</div>
              <div><strong>Durée :</strong><br>${Utils.dureeJours(m.dateDepart, m.dateRetour)} jour(s)</div>
              <div><strong>Lieu de départ :</strong><br>${Utils.esc(m.lieuDepart || '—')}</div>
              <div><strong>Destination principale :</strong><br>${Utils.esc(m.lieuPrincipal || '—')}</div>
              <div><strong>Pays :</strong><br>${Utils.esc(m.pays || '—')}</div>
              <div><strong>Budget prévisionnel :</strong><br>${Utils.formatMoney(m.budgetPrevisionnel || 0)}</div>
              <div><strong>Montant total frais :</strong><br>${Utils.formatMoney(m.montantTotal || 0)}</div>
            </div>

            ${m.contexte ? `
              <h4 style="color:var(--primary-dark);margin-top:16px">Contexte</h4>
              <p style="white-space:pre-line">${Utils.esc(m.contexte)}</p>
            ` : ''}

            <h4 style="color:var(--primary-dark);margin-top:20px;border-bottom:1px solid var(--gray-200);padding-bottom:6px">👥 Participants (${participants.length})</h4>
            <div class="table-wrapper" style="margin-top:10px">
              <table class="data-table">
                <thead><tr><th>#</th><th>Matricule</th><th>Nom & Prénom</th><th>Fonction</th><th>Grade</th><th>Rôle</th></tr></thead>
                <tbody>
                  ${participants.length ? participants.map(p => `
                    <tr>
                      <td>${p.ordrePassage || '—'}</td>
                      <td>${Utils.esc(p.matricule || '—')}</td>
                      <td><strong>${Utils.esc(p.prenom + ' ' + p.nom)}</strong></td>
                      <td>${Utils.esc(p.fonction || '—')}</td>
                      <td>${Utils.esc(p.grade || '—')}</td>
                      <td>${Utils.esc(roleLabels[p.roleMission] || p.roleMission || '—')}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="6" class="text-center text-muted">Aucun participant</td></tr>'}
                </tbody>
              </table>
            </div>

            ${itineraires.length ? `
              <h4 style="color:var(--primary-dark);margin-top:20px;border-bottom:1px solid var(--gray-200);padding-bottom:6px">🗺️ Itinéraire</h4>
              <div class="table-wrapper" style="margin-top:10px">
                <table class="data-table">
                  <thead><tr><th>Étape</th><th>Départ</th><th>Arrivée</th><th>Date départ</th><th>Date arrivée</th><th>Distance</th><th>Transport</th></tr></thead>
                  <tbody>
                    ${itineraires.map(i => {
                      const t = API.getTransports().find(x => x.idTransport === i.idTransport);
                      return `<tr>
                        <td>${i.ordreEtape || '—'}</td>
                        <td>${Utils.esc(i.lieuDepart || '—')}</td>
                        <td>${Utils.esc(i.lieuArrivee || '—')}</td>
                        <td>${Utils.formatDateTime(i.dateDepart)}</td>
                        <td>${Utils.formatDateTime(i.dateArrivee)}</td>
                        <td>${i.distanceKm || 0} km</td>
                        <td>${Utils.esc(t?.libelle || '—')}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${frais.length ? `
              <h4 style="color:var(--primary-dark);margin-top:20px;border-bottom:1px solid var(--gray-200);padding-bottom:6px">💰 Frais prévus</h4>
              <div class="table-wrapper" style="margin-top:10px">
                <table class="data-table">
                  <thead><tr><th>Type</th><th>Libellé</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead>
                  <tbody>
                    ${frais.map(f => {
                      const tf = API.getTypesFrais().find(x => x.idTypeFrais === f.idTypeFrais);
                      return `<tr>
                        <td>${Utils.esc(tf?.libelle || '—')}</td>
                        <td>${Utils.esc(f.libelle || '—')}</td>
                        <td>${f.quantite || 0}</td>
                        <td>${Utils.formatMoney(f.montantUnitaire || 0)}</td>
                        <td>${Utils.formatMoney(f.montantTotal || 0)}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${validations.length ? `
              <h4 style="color:var(--primary-dark);margin-top:20px;border-bottom:1px solid var(--gray-200);padding-bottom:6px">📜 Historique de validation</h4>
              <div class="timeline" style="margin-top:14px">
                ${validations.map(v => {
                  const cls = v.decision === 'VALIDE' ? 'done' : v.decision === 'REJETE' ? 'rejected' : 'pending';
                  return `<div class="timeline-item ${cls}">
                    <div class="tl-title">Niveau ${v.niveau} — ${Utils.esc(v.libelleEtape||'')}</div>
                    <div class="tl-meta">
                      ${Utils.esc(Utils.agentNom(v.idValidateur))} —
                      <strong>${Utils.esc(v.decision)}</strong>
                      ${v.dateDecision ? ` le ${Utils.formatDateTime(v.dateDecision)}` : ''}
                    </div>
                    ${v.commentaire ? `<div class="tl-comment">${Utils.esc(v.commentaire)}</div>` : ''}
                  </div>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
            ${canPrintOM ? `<button class="btn btn-info" onclick="Printer.previsualiserOrdreMission(${idMission})">📄 Aperçu OM</button>` : ''}
            ${statutCode === 'BROUILLON' ? `<button class="btn btn-success" onclick="Actions.soumettreMission(${idMission})">Soumettre</button>` : ''}
          </div>
        </div>
      </div>`);
  },

  /* ==================== VALIDATION ==================== */
  openAction(idValidation) {
    const v = API.getValidations().find(x => x.idValidation === idValidation);
    if (!v) { Utils.toast('Validation introuvable', 'error'); return; }
    const m = API.getMission(v.idMission);
    if (!m) { Utils.toast('Mission introuvable', 'error'); return; }
    const wf = API.getWorkflow(m.idWorkflow);
    const demandeur = API.getAgent(m.idDemandeur);
    const direction = API.getDirection(m.idDirection);
    const participants = (m.participants || []).map(p => API.getAgent(p.idAgent)).filter(Boolean);
    const isFinalStep = wf && wf.etapes && v.niveau === wf.etapes.length;

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal" style="max-width:820px">
          <div class="modal-header">
            <h3>✍️ Traitement — ${Utils.esc(m.numeroOm)}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning" style="margin-bottom:14px">
              <strong>Étape ${v.niveau} / ${wf?.etapes?.length || '?'}</strong> — ${Utils.esc(v.libelleEtape||'')}
            </div>

            <div class="card" style="background:var(--gray-100);padding:14px;margin-bottom:16px">
              <div><strong>Objet :</strong> ${Utils.esc(m.objet)}</div>
              ${m.contexte ? `<div style="margin-top:4px"><strong>Contexte :</strong> ${Utils.esc(m.contexte)}</div>` : ''}
              <div style="margin-top:4px"><strong>Demandeur :</strong> ${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'} (${Utils.esc(direction?.codeDirection || '—')})</div>
              <div style="margin-top:4px"><strong>Période :</strong> ${Utils.formatDateTime(m.dateDepart)} → ${Utils.formatDateTime(m.dateRetour)} (${Utils.dureeJours(m.dateDepart, m.dateRetour)} j)</div>
              <div style="margin-top:4px"><strong>Destination :</strong> ${Utils.esc(m.lieuPrincipal || '—')} — ${Utils.esc(m.pays || '')}</div>
              <div style="margin-top:4px"><strong>Budget prévisionnel :</strong> ${Utils.formatMoney(m.budgetPrevisionnel || 0)}</div>
              ${participants.length ? `<div style="margin-top:4px"><strong>Participants :</strong> ${Utils.esc(participants.map(p => p.prenom + ' ' + p.nom).join(' • '))}</div>` : ''}
            </div>

            ${Actions.workflowViz(m.idMission)}

            <form id="form-validation" style="margin-top:16px">
              <div class="form-group full-width">
                <label>Commentaire <span class="text-muted" style="font-weight:400">(obligatoire en cas de rejet)</span></label>
                <textarea id="v-commentaire" class="form-control" rows="3" maxlength="500" placeholder="Votre appréciation..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn btn-outline" onclick="Actions.detail(${m.idMission})">📋 Voir la mission</button>
            <button class="btn btn-danger" onclick="Actions.deciderValidation(${idValidation}, 'REJETE')">✗ Rejeter</button>
            <button class="btn btn-success" onclick="Actions.deciderValidation(${idValidation}, 'VALIDE')">
              ✓ Valider ${isFinalStep ? '(OM établi)' : ''}
            </button>
          </div>
        </div>
      </div>`);
  },

  deciderValidation(idValidation, decision) {
    const v = API.getValidations().find(x => x.idValidation === idValidation);
    if (!v) return;
    const m = API.getMission(v.idMission);
    if (!m) return;
    const wf = API.getWorkflow(m.idWorkflow);
    const commentaire = (document.getElementById('v-commentaire')?.value || '').trim();

    if (decision === 'REJETE' && !commentaire) {
      Utils.toast('Un commentaire est obligatoire en cas de rejet', 'error');
      return;
    }
    if (!Utils.confirm(`Confirmer la décision : ${decision} ?`)) return;

    try {
      API.updateValidation(idValidation, {
        decision,
        commentaire: commentaire || null,
        dateDecision: new Date().toISOString()
      });

      if (decision === 'REJETE') {
        API.changerStatut(m.idMission, 'REJETE');
        Utils.toast('Mission rejetée', 'warning');
      } else {
        const etapes = wf?.etapes || [];
        const niveauActuel = v.niveau;
        const etapeSuivante = etapes.find(e => e.niveau === niveauActuel + 1);

        if (etapeSuivante) {
          const validateur = Actions._trouverValidateurPourRole(etapeSuivante.roleRequis, m);
          if (validateur) {
            API.createValidation({
              idMission: m.idMission,
              idValidateur: validateur.idAgent,
              niveau: etapeSuivante.niveau,
              libelleEtape: etapeSuivante.libelle,
              decision: 'EN_ATTENTE'
            });
            if (niveauActuel === 1) API.changerStatut(m.idMission, 'VALIDE_N1');
            else if (niveauActuel === 2) API.changerStatut(m.idMission, 'VALIDE_N2');
            Utils.toast('Validé — transmis au niveau suivant', 'success');
          } else {
            Utils.toast('Validé mais aucun validateur trouvé pour l\'étape suivante', 'warning');
            API.changerStatut(m.idMission, 'VALIDE');
          }
        } else {
          API.changerStatut(m.idMission, 'OM_ETABLI');
          Utils.toast('OM établi avec succès ✓', 'success');
        }
      }

      App.closeModal();
      App.refresh();
    } catch (err) {
      Utils.toast(err.message, 'error');
    }
  },

  _trouverValidateurPourRole(roleRequis, mission) {
    const users = API.getUsers();
    const candidats = users.filter(u => u.role === roleRequis && u.actif !== false && u.idAgent);
    if (!candidats.length) {
      const u = users.find(u => u.role === roleRequis && u.actif !== false && u.idAgent);
      return u ? {idAgent: u.idAgent, user: u} : null;
    }
    const dansDirection = candidats.find(u => {
      const a = API.getAgent(u.idAgent);
      return a && a.idDirection === mission.idDirection;
    });
    const choisi = dansDirection || candidats[0];
    return {idAgent: choisi.idAgent, user: choisi};
  },

  /* ==================== APERÇUS ==================== */
  apercuListeVehicules() {
    const vehicules = Scope.vehiculesParc().slice().sort((a,b) => (a.immatriculation||'').localeCompare(b.immatriculation||''));
    if (!vehicules.length) { Utils.toast('Aucun véhicule à afficher', 'warning'); return; }

    const total = vehicules.length;
    const dispo = vehicules.filter(v => v.statut === 'DISPONIBLE').length;
    const affectes = vehicules.filter(v => v.statut === 'AFFECTE').length;
    const maintenance = vehicules.filter(v => v.statut === 'MAINTENANCE').length;
    const horsService = vehicules.filter(v => v.statut === 'HORS_SERVICE').length;

    const lignes = vehicules.map(v => {
      const dir = API.getDirection(v.idDirection);
      const statutClass = v.statut === 'DISPONIBLE' ? 'badge-VALIDE'
        : v.statut === 'AFFECTE' ? 'badge-AFFECTE'
        : v.statut === 'MAINTENANCE' ? 'badge-MAINTENANCE'
        : v.statut === 'HORS_SERVICE' ? 'badge-HORS_SERVICE' : 'badge-BROUILLON';
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
          <td><span class="badge ${statutClass}">${Utils.esc(v.statut || '—')}</span></td>
        </tr>`;
    }).join('');

    const session = Auth.session();
    const agent = Auth.currentAgent();
    const nomEditeur = agent ? `${agent.prenom} ${agent.nom}` : (session?.login || '—');

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>📊 État de la liste des véhicules</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" style="margin-bottom:14px">
              <strong>Aperçu avant impression</strong> — ${total} véhicule(s) — Édité le ${new Date().toLocaleDateString('fr-FR')}
              par ${Utils.esc(nomEditeur)} (${Utils.esc(session?.role || '')})
            </div>

            <div class="kpi-grid" style="margin-bottom:20px">
              <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${total}</div></div>
              <div class="kpi kpi-success"><div class="kpi-label">Disponibles</div><div class="kpi-value">${dispo}</div></div>
              <div class="kpi kpi-warning"><div class="kpi-label">Affectés</div><div class="kpi-value">${affectes}</div></div>
              <div class="kpi kpi-danger"><div class="kpi-label">Maintenance</div><div class="kpi-value">${maintenance}</div></div>
              <div class="kpi kpi-danger"><div class="kpi-label">Hors service</div><div class="kpi-value">${horsService}</div></div>
            </div>

            <div class="table-wrapper" style="max-height:60vh;overflow:auto;border:1px solid var(--gray-200)">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Matricule</th><th>Marque</th><th>Modèle</th><th>Type</th><th>Genre</th><th>Catégorie</th>
                    <th>Mise en circ.</th><th style="text-align:center">CV</th><th>Chassis</th><th>Carburant</th>
                    <th>Direction</th><th>Service</th><th>Affectation</th><th>Utilisateur</th>
                    <th>Assurance</th><th>Ville</th><th>Statut</th>
                  </tr>
                </thead>
                <tbody>${lignes}</tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
            <button class="btn btn-info" onclick="Excel.exporter(Excel.parcAutoVersLignes(),'parc_auto','Parc auto')">📤 Exporter Excel</button>
            <button class="btn" onclick="Printer.imprimerListeVehicules()">🖨️ Imprimer</button>
          </div>
        </div>
      </div>`);
  },

  apercuListeAgents() {
    const agents = Actions.getAgentsFiltres();
    if (!agents.length) { Utils.toast('Aucun agent à afficher', 'warning'); return; }

    const total = agents.length;
    const actifs = agents.filter(a => a.actif).length;
    const inactifs = agents.filter(a => !a.actif).length;
    const directionsUniques = [...new Set(agents.map(a => a.idDirection))].length;
    const tauxMoyen = total ? Math.round(agents.reduce((s, a) => s + (a.taux || 0), 0) / total) : 0;

    const lignes = agents.map(a => {
      const dir = API.getDirection(a.idDirection);
      const sup = a.idSuperieur ? API.getAgent(a.idSuperieur) : null;
      return `
        <tr>
          <td><strong>${Utils.esc(a.matricule)}</strong></td>
          <td>${Utils.esc(a.prenom)} ${Utils.esc(a.nom)}${a.grade ? `<div class="text-muted" style="font-size:11px">${Utils.esc(a.grade)}</div>` : ''}</td>
          <td>${Utils.esc(a.fonction || '—')}</td>
          <td>${Utils.esc(a.affectation || '—')}</td>
          <td style="text-align:right">${Utils.formatMoney(a.taux || 0)}</td>
          <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
          <td>${sup ? Utils.esc(sup.prenom + ' ' + sup.nom) : '—'}</td>
          <td>${Utils.esc(a.email || '—')}</td>
          <td>${Utils.esc(a.telephone || '—')}</td>
          <td>${Utils.esc(a.adresse || '—')}</td>
          <td>${a.actif ? '<span class="badge badge-VALIDE">Actif</span>' : '<span class="badge badge-ANNULE">Inactif</span>'}</td>
        </tr>`;
    }).join('');

    const session = Auth.session();
    const agent = Auth.currentAgent();
    const nomEditeur = agent ? `${agent.prenom} ${agent.nom}` : (session?.login || '—');

    const q = document.getElementById('filter-agent')?.value || '';
    const fDir = document.getElementById('filter-agent-direction')?.value || '';
    const fStatut = document.getElementById('filter-agent-statut')?.value || '';
    const filtresActifs = [];
    if (q) filtresActifs.push(`Recherche : "${Utils.esc(q)}"`);
    if (fDir) {
      const dir = API.getDirection(Number(fDir));
      filtresActifs.push(`Direction : ${Utils.esc(dir?.codeDirection || fDir)}`);
    }
    if (fStatut) filtresActifs.push(`Statut : ${fStatut === 'actif' ? 'Actifs' : 'Inactifs'}`);

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>📊 État de la liste des agents</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" style="margin-bottom:14px">
              <strong>Aperçu avant impression</strong> — ${total} agent(s) — Édité le ${new Date().toLocaleDateString('fr-FR')}
              par ${Utils.esc(nomEditeur)} (${Utils.esc(session?.role || '')})
              ${filtresActifs.length ? `<br><strong>Filtres appliqués :</strong> ${filtresActifs.join(' • ')}` : ''}
            </div>

            <div class="kpi-grid" style="margin-bottom:20px">
              <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${total}</div></div>
              <div class="kpi kpi-success"><div class="kpi-label">Actifs</div><div class="kpi-value">${actifs}</div></div>
              <div class="kpi kpi-danger"><div class="kpi-label">Inactifs</div><div class="kpi-value">${inactifs}</div></div>
              <div class="kpi kpi-info"><div class="kpi-label">Directions</div><div class="kpi-value">${directionsUniques}</div></div>
              <div class="kpi kpi-warning"><div class="kpi-label">Taux moyen (MAD/j)</div><div class="kpi-value">${tauxMoyen}</div></div>
            </div>

            <div class="table-wrapper" style="max-height:60vh;overflow:auto;border:1px solid var(--gray-200)">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Matricule</th><th>Nom</th><th>Fonction</th><th>Affectation</th>
                    <th style="text-align:right">Taux (MAD/j)</th><th>Direction</th><th>Supérieur</th>
                    <th>Email</th><th>Téléphone</th><th>Adresse</th><th>Statut</th>
                  </tr>
                </thead>
                <tbody>${lignes}</tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
            <button class="btn btn-info" onclick="Excel.exporter(Excel.agentsVersLignes(),'agents','Agents')">📤 Exporter Excel</button>
            <button class="btn" onclick="Actions.imprimerListeAgentsFiltres()">🖨️ Imprimer</button>
          </div>
        </div>
      </div>`);
  },

  getAgentsFiltres() {
    const q = (document.getElementById('filter-agent')?.value || '').trim().toLowerCase();
    const fDir = document.getElementById('filter-agent-direction')?.value || '';
    const fStatut = document.getElementById('filter-agent-statut')?.value || '';
    let list = Scope.agents();
    if (fDir) list = list.filter(a => a.idDirection == fDir);
    if (fStatut === 'actif') list = list.filter(a => a.actif);
    if (fStatut === 'inactif') list = list.filter(a => !a.actif);
    if (q) list = list.filter(a => [a.nom, a.prenom, a.matricule, a.email, a.telephone, a.adresse, a.fonction, a.grade, a.affectation].some(v => (v||'').toLowerCase().includes(q)));
    return list.slice().sort((a,b) => (a.nom||'').localeCompare(b.nom||''));
  },

  imprimerListeAgentsFiltres() {
    const agents = Actions.getAgentsFiltres();
    if (!agents.length) { Utils.toast('Aucun agent à imprimer', 'warning'); return; }
    Printer.imprimerListeAgents(agents);
  },

  renderVehicules() {
    const tbody = document.getElementById('vehicules-tbody');
    if (!tbody) return;
    const fStatut = document.getElementById('filter-veh-statut')?.value || '';
    const fDir = document.getElementById('filter-veh-direction')?.value || '';
    const fSearch = (document.getElementById('filter-veh-search')?.value || '').trim().toLowerCase();
    const session = Auth.session();
    const role = session?.role;
    const voitTout = ['ADMIN','DAF','DAAJ','SSPA'].includes(role);
    let list = voitTout ? API.getDemandesVehicules() : Scope.demandesVehicules();
    if (fStatut) list = list.filter(d => d.statut === fStatut);
    if (fDir) list = list.filter(d => d.idDirection == fDir);
    if (fSearch) {
      list = list.filter(d => {
        const demandeur = API.getAgent(d.idDemandeur);
        const demandeurNom = demandeur ? `${demandeur.prenom} ${demandeur.nom} ${demandeur.matricule || ''}` : '';
        return (d.numeroDemande||'').toLowerCase().includes(fSearch) ||
          (d.objet||'').toLowerCase().includes(fSearch) ||
          Utils.destsLabel(d).toLowerCase().includes(fSearch) ||
          Utils.personnesList(d).join(' ').toLowerCase().includes(fSearch) ||
          demandeurNom.toLowerCase().includes(fSearch);
      });
    }
    list.sort((a,b) => (b.dateCreation||'').localeCompare(a.dateCreation||''));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted" style="padding:30px">Aucune demande</td></tr>';
      return;
    }
    const canValidate = ['ADMIN','DAF','DAAJ','SSPA','DIRECTEUR','CHEF_SERVICE'].includes(session?.role);
    const canAssign = ['ADMIN','DAAJ','SSPA'].includes(session?.role);
    tbody.innerHTML = list.map(d => {
      const isOwner = session?.idAgent === d.idDemandeur;
      const isSoumis = d.statut === 'SOUMIS';
      const isAffecte = d.statut === 'AFFECTE';
      const isBrouillon = d.statut === 'BROUILLON';
      const permModif = Actions.peutModifierDemande(d);
      const arrDests = Array.isArray(d.destinations) && d.destinations.length
        ? d.destinations
        : (d.destination ? [d.destination] : []);
      const destCell = !arrDests.length
        ? '<span class="text-muted">—</span>'
        : (arrDests.length === 1
            ? Utils.esc(arrDests[0])
            : `${Utils.esc(arrDests[0])} <span class="badge badge-SOUMIS" title="${Utils.esc(arrDests.join(' → '))}">+${arrDests.length - 1}</span>`);
      const personnes = Utils.personnesList(d);
      const persCell = !personnes.length
        ? '<span class="text-muted">—</span>'
        : `${personnes.length} <span class="badge badge-SOUMIS" title="${Utils.esc(personnes.join(' • '))}">👤</span>`;
      return `
        <tr>
          <td><strong>${Utils.esc(d.numeroDemande)}</strong></td>
          <td>${Utils.esc((d.objet||'').substring(0,40))}${(d.objet||'').length>40?'…':''}</td>
          <td>${Utils.demandeurCell(d.idDemandeur, {showDirection:true, showMatricule:true})}</td>
          <td>${destCell}</td>
          <td>${Utils.formatDateTime(d.dateDepart)}</td>
          <td>${Utils.formatDateTime(d.dateRetour)}</td>
          <td style="text-align:center">${persCell}</td>
          <td>${Utils.badgeStatutVehicule(d.statut)}</td>
          <td style="text-align:center">
            ${(d.statut === 'AFFECTE' || d.statut === 'TERMINE') && d.idVehicule
              ? `<button class="vh-icon-btn" onclick="Printer.imprimerBonVehicule(${d.idDemande})" title="Demande de véhicule"></button>`
              : '<span class="text-muted">—</span>'}
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="Actions.detailDemandeVehicule(${d.idDemande})">Voir</button>
              ${permModif.ok ? `
                <button class="btn btn-sm btn-outline" onclick="Actions.openDemandeVehiculeModal(${d.idDemande})" title="${isBrouillon ? 'Modifier' : 'Droits étendus'}">✏️ Modifier</button>` : ''}
              ${isBrouillon && (isOwner || canAssign) ? `
                <button class="btn btn-sm btn-success" onclick="Actions.soumettreDemandeVehicule(${d.idDemande})">Soumettre</button>` : ''}
              ${isSoumis && canValidate ? `
                <button class="btn btn-sm btn-success" onclick="Actions.validerDemandeVehicule(${d.idDemande})">Valider</button>
                <button class="btn btn-sm btn-danger" onclick="Actions.refuserDemandeVehicule(${d.idDemande})">Refuser</button>` : ''}
              ${(isSoumis || d.statut === 'VALIDE') && canAssign ? `
                <button class="btn btn-sm btn-warning" onclick="Actions.affecterVehicule(${d.idDemande})">Affecter</button>` : ''}
              ${isAffecte && canAssign ? `
                <button class="btn btn-sm btn-info" onclick="Actions.terminerDemandeVehicule(${d.idDemande})">Terminer</button>` : ''}
              ${isBrouillon && (isOwner || canAssign) ? `
                <button class="btn btn-sm btn-danger" onclick="Actions.supprimerDemandeVehicule(${d.idDemande})">Suppr.</button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  renderParcAuto() {
    const tbody = document.getElementById('parc-auto-tbody');
    if (!tbody) return;
    const q = (document.getElementById('filter-parc-auto')?.value || '').trim().toLowerCase();
    const fStatut = document.getElementById('filter-parc-auto-statut')?.value || '';
    const fDir = document.getElementById('filter-parc-auto-direction')?.value || '';
    let list = Scope.vehiculesParc();
    if (fStatut) list = list.filter(v => v.statut === fStatut);
    if (fDir) list = list.filter(v => v.idDirection == fDir);
    if (q) list = list.filter(v =>
      [v.immatriculation, v.marque, v.modele, v.type, v.genre, v.categorie, v.chassis,
       v.carburant, v.service, v.affectation, v.utilisateur, v.assurance, v.ville]
        .some(val => (val||'').toLowerCase().includes(q))
    );
    list.sort((a,b) => (a.immatriculation||'').localeCompare(b.immatriculation||''));
    const counter = document.getElementById('parc-auto-count');
    if (counter) counter.textContent = `${list.length} véhicule(s)`;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="18" class="text-center text-muted" style="padding:30px">Aucun véhicule</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(v => {
      const dir = API.getDirection(v.idDirection);
      const statutClass = v.statut === 'DISPONIBLE' ? 'badge-VALIDE'
        : v.statut === 'AFFECTE' ? 'badge-AFFECTE'
        : v.statut === 'MAINTENANCE' ? 'badge-MAINTENANCE'
        : v.statut === 'HORS_SERVICE' ? 'badge-HORS_SERVICE' : 'badge-BROUILLON';
      return `
        <tr>
          <td><strong>${Utils.esc(v.immatriculation)}</strong></td>
          <td>${Utils.esc(v.marque)}</td>
          <td>${Utils.esc(v.modele)}</td>
          <td>${Utils.esc(v.type || '—')}</td>
          <td>${Utils.esc(v.genre || '—')}</td>
          <td>${Utils.esc(v.categorie || '—')}</td>
          <td>${Utils.formatDate(v.dateMiseCirculation)}</td>
          <td>${v.cv || 0}</td>
          <td>${Utils.esc(v.chassis || '—')}</td>
          <td>${Utils.esc(v.carburant || '—')}</td>
          <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
          <td>${Utils.esc(v.service || '—')}</td>
          <td>${Utils.esc(v.affectation || '—')}</td>
          <td>${Utils.esc(v.utilisateur || '—')}</td>
          <td>${Utils.esc(v.assurance || '—')}</td>
          <td>${Utils.esc(v.ville || '—')}</td>
          <td><span class="badge ${statutClass}">${Utils.esc(v.statut || '—')}</span></td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="Actions.openVehiculeModal(${v.idVehicule})">Modifier</button>
              <button class="btn btn-sm btn-danger" onclick="Actions.supprimerVehicule(${v.idVehicule})">Suppr.</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  openVehiculeModal(id) {
    const isEdit = !!id;
    const v = isEdit ? API.getVehicule(id) : null;
    if (isEdit && !v) return;
    const directions = Scope.directions();

    const valMarque       = API.getValeursDistinctes('marque');
    const valModele       = API.getValeursDistinctes('modele');
    const valType         = API.getValeursDistinctes('type');
    const valGenre        = API.getValeursDistinctes('genre');
    const valCategorie    = API.getValeursDistinctes('categorie');
    const valCarburant    = ['Essence','Diesel','Hybride','Électrique','GPL'];
    const valService      = API.getValeursDistinctes('service');
    const valAffectation  = API.getValeursDistinctes('affectation');
    const valUtilisateur  = API.getValeursDistinctes('utilisateur');
    const valAssurance    = API.getValeursDistinctes('assurance');
    const valVille        = API.getValeursDistinctes('ville');

    const withCurrent = (arr, current) => {
      if (current && !arr.includes(current)) return [...arr, current];
      return arr;
    };

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>${isEdit ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" style="margin-bottom:14px">
              💡 <strong>Astuce :</strong> les champs avec une flèche ▼ proposent une liste de valeurs déjà utilisées.
              Vous pouvez saisir librement une nouvelle valeur ou en choisir une dans la liste.
            </div>
            <form id="form-vehicule">
              <input type="hidden" id="v-id" value="${isEdit ? v.idVehicule : ''}">

              ${Utils.datalist('dl-marque', withCurrent(valMarque, v?.marque))}
              ${Utils.datalist('dl-modele', withCurrent(valModele, v?.modele))}
              ${Utils.datalist('dl-type', withCurrent(valType, v?.type))}
              ${Utils.datalist('dl-genre', withCurrent(valGenre, v?.genre))}
              ${Utils.datalist('dl-categorie', withCurrent(valCategorie, v?.categorie))}
              ${Utils.datalist('dl-carburant', withCurrent(valCarburant, v?.carburant))}
              ${Utils.datalist('dl-service', withCurrent(valService, v?.service))}
              ${Utils.datalist('dl-affectation', withCurrent(valAffectation, v?.affectation))}
              ${Utils.datalist('dl-utilisateur', withCurrent(valUtilisateur, v?.utilisateur))}
              ${Utils.datalist('dl-assurance', withCurrent(valAssurance, v?.assurance))}
              ${Utils.datalist('dl-ville', withCurrent(valVille, v?.ville))}

              <div class="form-grid">
                <div class="form-group"><label>Matricule <span class="required">*</span></label>
                  <input type="text" id="v-immatriculation" class="form-control" required value="${v ? Utils.esc(v.immatriculation) : ''}"></div>
                <div class="form-group"><label>Marque <span class="required">*</span> <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-marque" class="form-control" list="dl-marque" required value="${v ? Utils.esc(v.marque) : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Modèle <span class="required">*</span> <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-modele" class="form-control" list="dl-modele" required value="${v ? Utils.esc(v.modele) : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Type <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-type" class="form-control" list="dl-type" value="${v ? Utils.esc(v.type || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Genre <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-genre" class="form-control" list="dl-genre" value="${v ? Utils.esc(v.genre || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Catégorie <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-categorie" class="form-control" list="dl-categorie" value="${v ? Utils.esc(v.categorie || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Date de Mise en Circulation</label>
                  <input type="date" id="v-date-mise-circulation" class="form-control" value="${v ? (v.dateMiseCirculation || '') : ''}"></div>
                <div class="form-group"><label>CV</label>
                  <input type="number" id="v-cv" class="form-control" min="0" value="${v ? (v.cv || 0) : 0}"></div>
                <div class="form-group"><label>Chassis</label>
                  <input type="text" id="v-chassis" class="form-control" value="${v ? Utils.esc(v.chassis || '') : ''}"></div>
                <div class="form-group"><label>Carburant <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-carburant" class="form-control" list="dl-carburant" value="${v ? Utils.esc(v.carburant || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Direction <span class="combo-hint">(référentiel)</span></label>
                  <select id="v-direction" class="form-control">
                    <option value="">—</option>
                    ${directions.map(d => `<option value="${d.idDirection}" ${v && v.idDirection === d.idDirection ? 'selected' : ''}>${Utils.esc(d.codeDirection)} — ${Utils.esc(d.libelle)}</option>`).join('')}
                  </select></div>
                <div class="form-group"><label>Service <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-service" class="form-control" list="dl-service" value="${v ? Utils.esc(v.service || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Affectation <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-affectation" class="form-control" list="dl-affectation" value="${v ? Utils.esc(v.affectation || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Utilisateur <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-utilisateur" class="form-control" list="dl-utilisateur" value="${v ? Utils.esc(v.utilisateur || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Assurance <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-assurance" class="form-control" list="dl-assurance" value="${v ? Utils.esc(v.assurance || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Ville <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="v-ville" class="form-control" list="dl-ville" value="${v ? Utils.esc(v.ville || '') : ''}" placeholder="Saisir ou choisir..."></div>
                <div class="form-group"><label>Capacité (places)</label>
                  <input type="number" id="v-capacite" class="form-control" min="1" value="${v ? (v.capacite || 5) : 5}"></div>
                <div class="form-group"><label>Statut</label>
                  <select id="v-statut" class="form-control">
                    <option value="DISPONIBLE" ${v && v.statut === 'DISPONIBLE' ? 'selected' : ''}>Disponible</option>
                    <option value="AFFECTE" ${v && v.statut === 'AFFECTE' ? 'selected' : ''}>Affecté</option>
                    <option value="MAINTENANCE" ${v && v.statut === 'MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
                    <option value="HORS_SERVICE" ${v && v.statut === 'HORS_SERVICE' ? 'selected' : ''}>Hors service</option>
                  </select></div>
                <div class="form-group full-width"><label>Notes</label>
                  <textarea id="v-notes" class="form-control" rows="2">${v ? Utils.esc(v.notes || '') : ''}</textarea></div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn" onclick="Actions.saveVehicule()">Enregistrer</button>
          </div>
        </div>
      </div>`);
  },

  saveVehicule() {
    const form = document.getElementById('form-vehicule');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('v-id').value;
    const rawDate = document.getElementById('v-date-mise-circulation').value;
    const dateMiseCirculation = Utils.excelDateToISO(rawDate) || rawDate;
    const payload = {
      immatriculation: document.getElementById('v-immatriculation').value.trim(),
      marque: document.getElementById('v-marque').value.trim(),
      modele: document.getElementById('v-modele').value.trim(),
      type: document.getElementById('v-type').value.trim(),
      genre: document.getElementById('v-genre').value.trim(),
      categorie: document.getElementById('v-categorie').value.trim(),
      dateMiseCirculation,
      cv: Number(document.getElementById('v-cv').value || 0),
      chassis: document.getElementById('v-chassis').value.trim(),
      carburant: document.getElementById('v-carburant').value.trim(),
      idDirection: document.getElementById('v-direction').value ? Number(document.getElementById('v-direction').value) : null,
      service: document.getElementById('v-service').value.trim(),
      affectation: document.getElementById('v-affectation').value.trim(),
      utilisateur: document.getElementById('v-utilisateur').value.trim(),
      assurance: document.getElementById('v-assurance').value.trim(),
      ville: document.getElementById('v-ville').value.trim(),
      capacite: Number(document.getElementById('v-capacite').value || 5),
      statut: document.getElementById('v-statut').value,
      notes: document.getElementById('v-notes').value.trim()
    };
    try {
      if (id) {
        API.updateVehicule(Number(id), payload);
        Utils.toast('Véhicule modifié', 'success');
      } else {
        API.createVehicule(payload);
        Utils.toast('Véhicule créé', 'success');
      }
      App.closeModal();
      App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  supprimerVehicule(id) {
    if (!Utils.confirm('Supprimer ce véhicule ?')) return;
    try {
      API.deleteVehicule(id);
      Utils.toast('Véhicule supprimé', 'success');
      App.refresh();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  renderAgents() {
    const tbody = document.getElementById('agents-tbody');
    if (!tbody) return;
    const list = Actions.getAgentsFiltres();
    const counter = document.getElementById('agents-count');
    if (counter) counter.textContent = `${list.length} agent(s)`;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted" style="padding:30px">Aucun agent</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(a => {
      const dir = API.getDirection(a.idDirection);
      return `
      <tr>
        <td><strong>${Utils.esc(a.matricule)}</strong></td>
        <td>${Utils.esc(a.prenom)} ${Utils.esc(a.nom)}${a.grade ? `<div class="text-muted" style="font-size:11px">${Utils.esc(a.grade)}</div>` : ''}</td>
        <td>${Utils.esc(a.fonction)}</td>
        <td>${a.affectation ? Utils.esc(a.affectation) : '<span class="text-muted">—</span>'}</td>
        <td>${Utils.formatMoney(a.taux || 0)}</td>
        <td>${dir ? Utils.esc(dir.codeDirection) : '—'}</td>
        <td><a href="mailto:${Utils.esc(a.email)}" style="color:var(--primary);text-decoration:none">${Utils.esc(a.email)}</a></td>
        <td>${a.telephone ? Utils.esc(a.telephone) : '—'}</td>
        <td>${Utils.esc((a.adresse||'').substring(0,30))}${(a.adresse||'').length>30?'…':''}</td>
        <td>${a.actif ? '<span class="badge badge-VALIDE">Actif</span>' : '<span class="badge badge-ANNULE">Inactif</span>'}</td>
        <td><div class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="Actions.openAgentModal(${a.idAgent})">Modifier</button>
          <button class="btn btn-sm btn-danger" onclick="Actions.supprimerAgent(${a.idAgent})">Suppr.</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  nouvelleDemandeVehicule() { Actions.openDemandeVehiculeModal(null); },

  dvAddDestinationRow(value) {
    const list = document.getElementById('dv-destinations-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'dv-dest-row';
    row.innerHTML = `
      <input type="text" class="form-control dv-dest-input" list="dl-dv-destinations"
             value="${Utils.esc(value || '')}"
             placeholder="Saisir ou choisir une destination...">
      <button type="button" class="btn btn-sm btn-danger"
              onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
    list.appendChild(row);
    const input = row.querySelector('.dv-dest-input');
    if (input) input.focus();
  },
  dvGetDestinations() {
    return Array.from(document.querySelectorAll('#dv-destinations-list .dv-dest-input'))
      .map(i => i.value.trim())
      .filter(v => v);
  },

  dvAddPersonneRow(value) {
    const list = document.getElementById('dv-personnes-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'dv-pers-row';
    row.innerHTML = `
      <input type="text" class="form-control dv-pers-input"
             list="dl-dv-personnes"
             value="${Utils.esc(value || '')}"
             placeholder="Saisir ou choisir un agent...">
      <button type="button" class="btn btn-sm btn-danger"
              onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
    list.appendChild(row);
    const input = row.querySelector('.dv-pers-input');
    if (input) input.focus();
  },
  dvGetPersonnes() {
    return Array.from(document.querySelectorAll('#dv-personnes-list .dv-pers-input'))
      .map(i => i.value.trim())
      .filter(v => v);
  },

  peutModifierDemande(d) {
    const session = Auth.session();
    if (!session || !d) return {ok:false, canBase:false, canAssign:false, canStatut:false, warn:''};
    const role = session.role;
    const isOwner    = session.idAgent != null && session.idAgent === d.idDemandeur;
    const isAdmin    = role === 'ADMIN';
    const isGlobal   = ['ADMIN','DAF','DAAJ','SSPA'].includes(role);
    const isValidator= ['DIRECTEUR','CHEF_SERVICE'].includes(role);
    const isAssigner = ['ADMIN','DAAJ','SSPA'].includes(role);
    const s = d.statut;

    if (s === 'BROUILLON' && (isOwner || isAdmin || isGlobal))
      return {ok:true, canBase:true, canAssign:isAssigner, canStatut:isAssigner, warn:''};

    if (s === 'SOUMIS' && (isOwner || isValidator || isAdmin || isGlobal))
      return {ok:true, canBase:isOwner || isAdmin, canAssign:isAssigner, canStatut:isAssigner,
              warn:'⚠️ Cette demande est <strong>soumise</strong>. Toute modification par le demandeur la repassera en <strong>brouillon</strong> et annulera la validation en cours.'};

    if (s === 'VALIDE' && isAssigner)
      return {ok:true, canBase:isAdmin, canAssign:true, canStatut:true,
              warn:'ℹ️ Demande <strong>validée</strong>. Vous pouvez affecter un véhicule / chauffeur ou modifier le statut.'};

    if (s === 'AFFECTE' && isAssigner)
      return {ok:true, canBase:isAdmin, canAssign:true, canStatut:true,
              warn:'ℹ️ Demande <strong>affectée</strong>. Vous pouvez modifier l\'affectation ou clôturer la demande.'};

    if (s === 'REFUSE' && (isAdmin || isOwner))
      return {ok:true, canBase:true, canAssign:false, canStatut:isAdmin,
              warn:'⚠️ Cette demande a été <strong>refusée</strong>. La modifier la repassera en <strong>brouillon</strong> pour une nouvelle soumission.'};

    if ((s === 'TERMINE' || s === 'ANNULE') && isAdmin)
      return {ok:true, canBase:true, canAssign:true, canStatut:true,
              warn:'⚠️ Demande <strong>clôturée</strong>. Modification réservée à l\'administrateur.'};

    return {ok:false, canBase:false, canAssign:false, canStatut:false, warn:''};
  },

  openDemandeVehiculeModal(id) {
    const isEdit = !!id;
    const d = isEdit ? API.getDemandeVehicule(id) : null;
    if (isEdit && !d) { Utils.toast('Demande introuvable', 'error'); return; }

    let perm = {ok:true, canBase:true, canAssign:false, canStatut:false, warn:''};
    if (isEdit) {
      perm = Actions.peutModifierDemande(d);
      if (!perm.ok) {
        Utils.toast('Vous n\'avez pas les droits pour modifier cette demande', 'warning');
        return;
      }
    }

    const destinations = API.getDestinations().filter(x => x.actif !== false);
    const dis = (cond) => cond ? '' : 'readonly style="background:#f1f3f5;cursor:not-allowed"';

    const valObjets       = API.getValeursDistinctesDemandesVehicules('objet');
    const valMotifs       = API.getValeursDistinctesDemandesVehicules('motif');
    const valDestinations = API.getValeursDistinctesDemandesVehicules('destination');
    const allDestSuggestions = Array.from(new Set([
      ...destinations.map(x => x.libelle),
      ...valDestinations
    ])).sort((a,b) => a.localeCompare(b, 'fr', {sensitivity:'base'}));

    // Suggestions pour les personnes transportées = tous les agents (Prénom Nom)
    const valPersonnes = API.getValeursDistinctesDemandesVehicules('personnesTransportees');
    const allPersSuggestions = Array.from(new Set([
      ...API.getAgents().filter(a => a.actif).map(a => `${a.prenom} ${a.nom}`),
      ...valPersonnes
    ])).sort((a,b) => a.localeCompare(b, 'fr', {sensitivity:'base'}));

    const initialDests = isEdit
      ? (Array.isArray(d.destinations) && d.destinations.length
          ? d.destinations.slice()
          : (d.destination ? [d.destination] : ['']))
      : [''];

    const initialPersonnes = isEdit ? Utils.personnesList(d).slice() : [];
    if (!initialPersonnes.length) initialPersonnes.push('');

    const demandeurInfo = isEdit ? Utils.demandeurHighlight(d.idDemandeur, 'Demandeur') : '';

    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal" style="max-width:820px">
          <div class="modal-header">
            <h3>${isEdit
              ? `✏️ Modifier la demande <code style="font-size:14px">${Utils.esc(d.numeroDemande)}</code>`
              : '➕ Nouvelle demande de véhicule'}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            ${demandeurInfo}
            ${perm.warn ? `<div class="alert alert-warning" style="margin-bottom:14px">${perm.warn}</div>` : ''}
            ${isEdit ? `
              <div class="alert alert-info" style="margin-bottom:14px">
                <strong>Statut actuel :</strong> ${Utils.badgeStatutVehicule(d.statut)}
                ${d.dateCreation ? `&nbsp;•&nbsp;<strong>Créée le :</strong> ${Utils.formatDateTime(d.dateCreation)}` : ''}
              </div>` : ''}

            <form id="form-demande-vehicule">
              <input type="hidden" id="dv-id" value="${isEdit ? d.idDemande : ''}">

              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Objet <span class="required">*</span> <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="dv-objet" class="form-control" required maxlength="200"
                    list="dl-dv-objets"
                    value="${isEdit ? Utils.esc(d.objet || '') : ''}" ${dis(perm.canBase)}
                    placeholder="Saisir ou choisir un objet existant...">
                  ${Utils.datalist('dl-dv-objets', valObjets)}
                </div>

                <div class="form-group full-width">
                  <label>Motif détaillé <span class="required">*</span> <span class="combo-hint">(liste modifiable ▼)</span></label>
                  <input type="text" id="dv-motif" class="form-control" required maxlength="500"
                    list="dl-dv-motifs"
                    value="${isEdit ? Utils.esc(d.motif || '') : ''}" ${dis(perm.canBase)}
                    placeholder="Saisir ou choisir un motif existant...">
                  ${Utils.datalist('dl-dv-motifs', valMotifs)}
                </div>

                <div class="form-group full-width">
                  <label>Destinations <span class="required">*</span>
                    <span class="combo-hint">(liste modifiable ▼ — plusieurs destinations possibles)</span>
                  </label>
                  <div id="dv-destinations-list">
                    ${initialDests.map(v => `
                      <div class="dv-dest-row">
                        <input type="text" class="form-control dv-dest-input" list="dl-dv-destinations"
                               value="${Utils.esc(v)}"
                               placeholder="Saisir ou choisir une destination..."
                               ${dis(perm.canBase)}>
                        <button type="button" class="btn btn-sm btn-danger"
                                onclick="this.parentElement.remove()" title="Supprimer"
                                ${dis(perm.canBase)}>×</button>
                      </div>
                    `).join('')}
                  </div>
                  <button type="button" class="btn btn-sm btn-outline mt-2"
                          onclick="Actions.dvAddDestinationRow('')"
                          ${dis(perm.canBase)}>+ Ajouter une destination</button>
                  ${Utils.datalist('dl-dv-destinations', allDestSuggestions)}
                </div>

                <div class="form-group full-width">
                  <label>Personnes transportées <span class="required">*</span>
                    <span class="combo-hint">(liste modifiable ▼ — une personne par ligne)</span>
                  </label>
                  <div id="dv-personnes-list">
                    ${initialPersonnes.map(v => `
                      <div class="dv-pers-row">
                        <input type="text" class="form-control dv-pers-input"
                               list="dl-dv-personnes"
                               value="${Utils.esc(v)}"
                               placeholder="Saisir ou choisir un agent..."
                               ${dis(perm.canBase)}>
                        <button type="button" class="btn btn-sm btn-danger"
                                onclick="this.parentElement.remove()" title="Supprimer"
                                ${dis(perm.canBase)}>×</button>
                      </div>
                    `).join('')}
                  </div>
                  <button type="button" class="btn btn-sm btn-outline mt-2"
                          onclick="Actions.dvAddPersonneRow('')"
                          ${dis(perm.canBase)}>+ Ajouter une personne</button>
                  ${Utils.datalist('dl-dv-personnes', allPersSuggestions)}
                </div>

                <div class="form-group">
                  <label>Départ <span class="required">*</span></label>
                  <input type="datetime-local" id="dv-date-depart" class="form-control" required
                    value="${isEdit ? Utils.toLocalInput(d.dateDepart) : ''}" ${dis(perm.canBase)}>
                </div>

                <div class="form-group">
                  <label>Retour <span class="required">*</span></label>
                  <input type="datetime-local" id="dv-date-retour" class="form-control" required
                    value="${isEdit ? Utils.toLocalInput(d.dateRetour) : ''}" ${dis(perm.canBase)}>
                </div>

                ${isEdit ? `
                  <div class="form-group full-width">
                    <label>Justification de la modification</label>
                    <textarea id="dv-justification" class="form-control" rows="2" maxlength="300"
                      placeholder="Optionnel — sera enregistré dans l'historique"></textarea>
                  </div>
                ` : ''}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            ${isEdit && (d.statut === 'BROUILLON' || d.statut === 'REFUSE') ? `
              <button class="btn btn-success" onclick="Actions.saveDemandeVehicule(true)">Enregistrer &amp; Soumettre</button>` : ''}
            ${!isEdit ? `
              <button class="btn btn-success" onclick="Actions.saveDemandeVehicule(true)">Enregistrer &amp; Soumettre</button>` : ''}
            <button class="btn" onclick="Actions.saveDemandeVehicule(false)">Enregistrer</button>
          </div>
        </div>
      </div>`);
  },

  saveDemandeVehicule(submit = false) {
    const form = document.getElementById('form-demande-vehicule');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const id = document.getElementById('dv-id').value;
    const isEdit = !!id;
    const session = Auth.session();
    const agent   = Auth.currentAgent();

    const dtDep = document.getElementById('dv-date-depart').value;
    const dtRet = document.getElementById('dv-date-retour').value;
    if (!dtDep || !dtRet || dtRet <= dtDep) {
      Utils.toast('La date de retour doit être postérieure à la date de départ', 'error');
      return;
    }

    const dests = Actions.dvGetDestinations();
    if (!dests.length) { Utils.toast('Au moins une destination est requise', 'error'); return; }

    const personnes = Actions.dvGetPersonnes();
    if (!personnes.length) { Utils.toast('Au moins une personne transportée est requise', 'error'); return; }

    const basePayload = {
      objet:        document.getElementById('dv-objet').value.trim(),
      motif:        document.getElementById('dv-motif').value.trim(),
      destination:  dests[0],
      destinations: dests,
      personnesTransportees: personnes,
      nbPassagers:  personnes.length,
      dateDepart:   dtDep,
      dateRetour:   dtRet
    };

    const justifEl = document.getElementById('dv-justification');

    try {
      if (isEdit) {
        const d = API.getDemandeVehicule(Number(id));
        if (!d) throw new Error('Demande introuvable');

        const perm = Actions.peutModifierDemande(d);
        if (!perm.ok) throw new Error('Modification non autorisée');

        const payload = {};
        if (perm.canBase) Object.assign(payload, basePayload);

        const isOwner = session?.idAgent === d.idDemandeur;

        if (d.statut === 'SOUMIS' && isOwner) payload.statut = 'BROUILLON';
        if (d.statut === 'REFUSE' && isOwner) payload.statut = 'BROUILLON';

        if (submit && (d.statut === 'BROUILLON' || d.statut === 'REFUSE')) {
          payload.statut = 'SOUMIS';
          payload.dateSoumission = new Date().toISOString();
        }

        const changes = {};
        Object.keys(payload).forEach(k => {
          if (['dateSoumission'].includes(k)) return;
          if (JSON.stringify(d[k]) !== JSON.stringify(payload[k])) {
            changes[k] = {avant: d[k], apres: payload[k]};
          }
        });
        if (Object.keys(changes).length) {
          const hist = Array.isArray(d.historique) ? d.historique.slice() : [];
          hist.push({
            date: new Date().toISOString(),
            auteur: session?.login || '—',
            idAuteur: session?.idUtilisateur || null,
            role: session?.role || '—',
            justification: (justifEl?.value || '').trim(),
            changes
          });
          payload.historique = hist;
        }

        API.updateDemandeVehicule(Number(id), payload);
        Utils.toast(submit ? 'Demande enregistrée et soumise' : 'Demande modifiée', 'success');

      } else {
        const payload = { ...basePayload };
        payload.idDemandeur = session?.idAgent;
        payload.idCreateur = session?.idAgent;
        payload.idDirection = agent?.idDirection || 1;
        payload.dateCreation = new Date().toISOString();
        payload.historique = [{
          date: payload.dateCreation,
          auteur: session?.login || '—',
          idAuteur: session?.idUtilisateur || null,
          role: session?.role || '—',
          justification: 'Création',
          changes: {}
        }];
        if (submit) {
          payload.statut = 'SOUMIS';
          payload.dateSoumission = new Date().toISOString();
        } else {
          payload.statut = 'BROUILLON';
        }
        API.createDemandeVehicule(payload);
        Utils.toast(submit ? 'Demande créée et soumise' : 'Demande créée (brouillon)', 'success');
      }

      App.closeModal();
      App.refresh();

    } catch (err) {
      Utils.toast(err.message, 'error');
    }
  },

  soumettreDemandeVehicule(id) {
    if (!Utils.confirm('Soumettre cette demande ?')) return;
    API.updateDemandeVehicule(id, {statut:'SOUMIS', dateSoumission: new Date().toISOString()});
    Utils.toast('Demande soumise', 'success');
    App.refresh();
  },

  validerDemandeVehicule(id) {
    const commentaire = window.prompt('Commentaire (optionnel) :', '') || '';
    API.updateDemandeVehicule(id, {statut:'VALIDE', commentaireValidateur: commentaire, dateValidation: new Date().toISOString()});
    Utils.toast('Demande validée ✓', 'success');
    App.refresh();
  },

  refuserDemandeVehicule(id) {
    const motif = window.prompt('Motif du refus (obligatoire) :', '');
    if (!motif || !motif.trim()) { Utils.toast('Motif obligatoire', 'error'); return; }
    API.updateDemandeVehicule(id, {statut:'REFUSE', commentaireValidateur: motif.trim(), dateValidation: new Date().toISOString()});
    Utils.toast('Demande refusée', 'warning');
    App.refresh();
  },

  affecterVehicule(id) {
    const d = API.getDemandeVehicule(id);
    if (!d) return;

    const isDejaAffecte = (d.statut === 'AFFECTE' || d.statut === 'TERMINE');

    const MOTS_VELOMOTEUR = ['velomoteur', 'vélomoteur', 'moto', 'scooter', 'cyclomoteur', 'deux-roues'];
    const estVelomoteur = (v) => {
      const txt = ((v.type || '') + ' ' + (v.genre || '') + ' ' + (v.categorie || '')).toLowerCase();
      return MOTS_VELOMOTEUR.some(m => txt.includes(m));
    };

    const vehiculesDispos = API.getVehicules().filter(v => {
      if (!v.actif) return false;
      if (estVelomoteur(v)) return false;
      if (v.statut === 'DISPONIBLE') return true;
      if (v.idVehicule === d.idVehicule) return true;
      if (isDejaAffecte && v.statut === 'AFFECTE') return true;
      return false;
    });

    const chauffeurs = isDejaAffecte
      ? API.getAgents().filter(a => a.actif)
      : API.getAgents().filter(a => a.actif && (a.fonction||'').toLowerCase().includes('chauffeur'));

    const nbPers = Utils.personnesList(d).length;
    const demandeur = API.getAgent(d.idDemandeur);
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal" style="max-width:680px">
          <div class="modal-header"><h3>🚗 Affecter — ${Utils.esc(d.numeroDemande)}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button></div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>${Utils.esc(d.objet)}</strong><br>
              <strong>Demandeur :</strong> ${demandeur ? Utils.esc(demandeur.prenom + ' ' + demandeur.nom) : '—'}<br>
              ${Utils.formatDateTime(d.dateDepart)} → ${Utils.formatDateTime(d.dateRetour)}<br>
              Destination(s) : ${Utils.esc(Utils.destsLabel(d))}<br>
              Personnes transportées (${nbPers}) : ${Utils.esc(Utils.personnesList(d).join(' • ') || '—')}
            </div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Véhicule <span class="required">*</span></label>
                <input type="text" id="aff-vehicule-search" class="form-control"
                       placeholder="🔍 Rechercher par immatriculation, marque, modèle, type, carburant..."
                       autocomplete="off" style="margin-bottom:6px">
                <select id="aff-vehicule" class="form-control" required size="5" style="height:auto">
                  <option value="">— Sélectionner un véhicule —</option>
                  ${vehiculesDispos.map(v => `
                    <option value="${v.idVehicule}" ${d.idVehicule === v.idVehicule ? 'selected' : ''}>
                      ${Utils.esc(v.immatriculation)} — ${Utils.esc(v.marque + ' ' + v.modele)} (${Utils.esc(v.type || '')}, ${v.capacite} pl., ${Utils.esc(v.carburant || '')})
                    </option>
                  `).join('')}
                </select>
                <small class="text-muted" id="aff-vehicule-count">${vehiculesDispos.length} véhicule(s) disponible(s)</small>
              </div>
              <div class="form-group full-width">
                <label>${isDejaAffecte ? 'Agent (tous les agents actifs)' : 'Chauffeur (optionnel)'}</label>
                <input type="text" id="aff-chauffeur-search" class="form-control"
                       placeholder="🔍 Rechercher par nom, matricule, fonction..."
                       autocomplete="off" style="margin-bottom:6px">
                <select id="aff-chauffeur" class="form-control" size="5" style="height:auto">
                  <option value="">— Aucun / À désigner —</option>
                  ${chauffeurs.map(c => `
                    <option value="${c.idAgent}" ${d.idChauffeur === c.idAgent ? 'selected' : ''}>
                      ${Utils.esc(c.prenom + ' ' + c.nom)} (${Utils.esc(c.matricule)}) — ${Utils.esc(c.fonction)}
                    </option>
                  `).join('')}
                </select>
                <small class="text-muted" id="aff-chauffeur-count">
                  ${chauffeurs.length} ${isDejaAffecte ? 'agent(s) actif(s)' : 'chauffeur(s) disponible(s)'}
                </small>
              </div>
              <div class="form-group full-width"><label>Commentaire</label>
                <textarea id="aff-commentaire" class="form-control" rows="2">${Utils.esc(d.commentaireValidateur || '')}</textarea></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn btn-success" onclick="Actions.confirmAffectation(${id})">Affecter</button>
          </div>
        </div>
      </div>
    `);

    const vehSearchInput = document.getElementById('aff-vehicule-search');
    const vehSelect = document.getElementById('aff-vehicule');
    const vehCount = document.getElementById('aff-vehicule-count');
    if (vehSearchInput && vehSelect) {
      const allVeh = vehiculesDispos.map(v => ({
        value: String(v.idVehicule),
        label: `${v.immatriculation} — ${v.marque} ${v.modele} (${v.type || ''}, ${v.capacite} pl., ${v.carburant || ''})`,
        search: `${v.immatriculation} ${v.marque} ${v.modele} ${v.type || ''} ${v.carburant || ''}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      vehSearchInput.addEventListener('input', () => {
        const q = normaliser(vehSearchInput.value.trim());
        const selectedValue = vehSelect.value;
        const filtres = allVeh.filter(o => !q || normaliser(o.search).includes(q));
        vehSelect.innerHTML = `<option value="">— Sélectionner un véhicule —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === selectedValue ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (vehCount) vehCount.textContent = `${filtres.length} / ${allVeh.length} véhicule(s)`;
        if (filtres.length === 1 && !selectedValue) vehSelect.value = filtres[0].value;
      });
      setTimeout(() => vehSearchInput.focus(), 100);
    }

    const chSearchInput = document.getElementById('aff-chauffeur-search');
    const chSelect = document.getElementById('aff-chauffeur');
    const chCount = document.getElementById('aff-chauffeur-count');
    if (chSearchInput && chSelect) {
      const allCh = chauffeurs.map(c => ({
        value: String(c.idAgent),
        label: `${c.prenom} ${c.nom} (${c.matricule}) — ${c.fonction}`,
        search: `${c.prenom} ${c.nom} ${c.matricule} ${c.fonction}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      chSearchInput.addEventListener('input', () => {
        const q = normaliser(chSearchInput.value.trim());
        const selectedValue = chSelect.value;
        const filtres = allCh.filter(o => !q || normaliser(o.search).includes(q));
        chSelect.innerHTML = `<option value="">— Aucun / À désigner —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === selectedValue ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (chCount) chCount.textContent = `${filtres.length} / ${allCh.length} chauffeur(s)`;
        if (filtres.length === 1 && !selectedValue) chSelect.value = filtres[0].value;
      });
    }
  },

  confirmAffectation(id) {
    const idVehicule = document.getElementById('aff-vehicule').value;
    if (!idVehicule) { Utils.toast('Sélectionnez un véhicule', 'error'); return; }
    const idChauffeur = document.getElementById('aff-chauffeur').value || null;
    const commentaire = document.getElementById('aff-commentaire').value.trim();
    const vehicule = API.getVehicule(Number(idVehicule));
    if (!vehicule) { Utils.toast('Véhicule introuvable', 'error'); return; }
    const d = API.getDemandeVehicule(id);
    if (!d) return;
    const nbPers = Utils.personnesList(d).length;
    if (vehicule.capacite < nbPers) {
      if (!Utils.confirm(`Capacité insuffisante (${vehicule.capacite} < ${nbPers}). Continuer ?`)) return;
    }
    API.updateVehicule(vehicule.idVehicule, {statut: 'AFFECTE'});
    API.updateDemandeVehicule(id, {
      idVehicule: vehicule.idVehicule,
      idChauffeur: idChauffeur ? Number(idChauffeur) : null,
      statut: 'AFFECTE',
      commentaireValidateur: commentaire || `Véhicule affecté : ${vehicule.immatriculation}`,
      dateAffectation: new Date().toISOString()
    });
    Utils.toast('Véhicule affecté ✓', 'success');
    App.closeModal(); App.refresh();
  },

  terminerDemandeVehicule(id) {
    if (!Utils.confirm('Marquer comme terminée ?')) return;
    const d = API.getDemandeVehicule(id);
    if (!d) return;
    if (d.idVehicule) API.updateVehicule(d.idVehicule, {statut: 'DISPONIBLE'});
    API.updateDemandeVehicule(id, {statut:'TERMINE', dateFin: new Date().toISOString()});
    Utils.toast('Demande terminée — véhicule libéré', 'success');
    App.refresh();
  },

  supprimerDemandeVehicule(id) {
    if (!Utils.confirm('Supprimer cette demande ?')) return;
    API.deleteDemandeVehicule(id);
    Utils.toast('Demande supprimée', 'success');
    App.refresh();
  },

  detailDemandeVehicule(id) {
    const d = API.getDemandeVehicule(id);
    if (!d) return;
    const demandeur = API.getAgent(d.idDemandeur);
    const createur = d.idCreateur && d.idCreateur !== d.idDemandeur ? API.getAgent(d.idCreateur) : null;
    const direction = API.getDirection(d.idDirection);
    const vehicule = d.idVehicule ? API.getVehicule(d.idVehicule) : null;
    const chauffeur = d.idChauffeur ? API.getAgent(d.idChauffeur) : null;
    const permModif = Actions.peutModifierDemande(d);
    const arrDests = Array.isArray(d.destinations) && d.destinations.length
      ? d.destinations
      : (d.destination ? [d.destination] : []);
    const destsHtml = !arrDests.length
      ? '—'
      : (arrDests.length === 1
          ? Utils.esc(arrDests[0])
          : `<ol style="margin:4px 0 0 20px">${arrDests.map(x => `<li>${Utils.esc(x)}</li>`).join('')}</ol>`);
    const personnes = Utils.personnesList(d);
    const personnesHtml = !personnes.length
      ? '—'
      : `<ol style="margin:4px 0 0 20px">${personnes.map(x => `<li>${Utils.esc(x)}</li>`).join('')}</ol>`;
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal">
          <div class="modal-header"><h3>Détail ${Utils.esc(d.numeroDemande)}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button></div>
          <div class="modal-body">
            <div class="flex-between" style="margin-bottom:16px">
              <div><h3 style="color:var(--primary-dark)">${Utils.esc(d.numeroDemande)}</h3>
                <div class="text-muted" style="font-size:12px">Créée le ${Utils.formatDateTime(d.dateCreation)}</div></div>
              ${Utils.badgeStatutVehicule(d.statut)}
            </div>

            ${Utils.demandeurHighlight(d.idDemandeur, 'Demandeur')}

            ${createur ? `
              <div class="alert alert-info" style="margin-bottom:16px">
                <strong>✍️ Saisie par :</strong> ${Utils.esc(createur.prenom + ' ' + createur.nom)}
                ${createur.matricule ? `(${Utils.esc(createur.matricule)})` : ''}
              </div>
            ` : ''}

            <div class="form-grid">
              <div><strong>Direction :</strong><br>${direction ? Utils.esc(direction.codeDirection + ' — ' + direction.libelle) : '—'}</div>
              <div><strong>Durée :</strong><br>${Utils.dureeJours(d.dateDepart, d.dateRetour)} jour(s)</div>
              <div><strong>Nombre de personnes :</strong><br>${personnes.length}</div>
              <div><strong>Départ :</strong><br>${Utils.formatDateTime(d.dateDepart)}</div>
              <div><strong>Retour :</strong><br>${Utils.formatDateTime(d.dateRetour)}</div>
              <div><strong>Véhicule affecté :</strong><br>${vehicule ? Utils.esc(vehicule.immatriculation + ' — ' + vehicule.marque + ' ' + vehicule.modele) : '<span class="text-muted">Non affecté</span>'}</div>
              <div><strong>Chauffeur :</strong><br>${chauffeur ? Utils.esc(chauffeur.prenom + ' ' + chauffeur.nom) : '<span class="text-muted">Non désigné</span>'}</div>
              <div style="grid-column:1/-1">
                <strong>Destinations :</strong><br>${destsHtml}
              </div>
              <div style="grid-column:1/-1">
                <strong>Personnes transportées (${personnes.length}) :</strong><br>${personnesHtml}
              </div>
            </div>
            <h4 style="margin-top:20px;color:var(--primary-dark)">Objet</h4>
            <p>${Utils.esc(d.objet || '—')}</p>
            <h4 style="margin-top:16px;color:var(--primary-dark)">Motif</h4>
            <p style="white-space:pre-line">${Utils.esc(d.motif || '—')}</p>
            ${d.commentaireValidateur ? `<h4 style="margin-top:16px;color:var(--primary-dark)">Commentaire validateur</h4>
              <div class="alert alert-info">${Utils.esc(d.commentaireValidateur)}</div>` : ''}

            ${Array.isArray(d.historique) && d.historique.length ? `
              <h4 style="margin-top:20px;color:var(--primary-dark)">📜 Historique des modifications</h4>
              <div class="timeline">
                ${d.historique.slice().reverse().map(h => `
                  <div class="timeline-item done">
                    <div class="tl-title">${Utils.esc(h.auteur)} <span class="text-muted">(${Utils.esc(h.role || '')})</span></div>
                    <div class="tl-meta">${Utils.formatDateTime(h.date)}</div>
                    ${h.justification ? `<div class="tl-comment">${Utils.esc(h.justification)}</div>` : ''}
                    ${Object.keys(h.changes || {}).length ? `
                      <div class="tl-meta" style="margin-top:4px">
                        Champs modifiés : ${Object.keys(h.changes).map(k => `<code>${Utils.esc(k)}</code>`).join(', ')}
                      </div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            ${permModif.ok ? `<button class="btn btn-outline" onclick="App.closeModal();setTimeout(()=>Actions.openDemandeVehiculeModal(${d.idDemande}),50)">✏️ Modifier</button>` : ''}
            ${(d.statut === 'AFFECTE' || d.statut === 'TERMINE') && d.idVehicule
              ? `<button class="btn btn-info" onclick="Printer.imprimerBonVehicule(${d.idDemande})">🖨️ Demande de véhicule</button>` : ''}
            <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
          </div>
        </div>
      </div>`);
  },

  editDemandesBuffer: {},
  editDemandesNewRows: [],

  openEtatDemandesVehicules() {
    Actions.editDemandesBuffer = {};
    Actions.editDemandesNewRows = [];
    const demandes = Scope.demandesVehicules().slice().sort((a,b) => (b.dateCreation||'').localeCompare(a.dateCreation||''));
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h3>✏️ Édition en masse — Demandes de véhicules</h3>
            <button class="modal-close" onclick="Actions.closeEtatDemandesVehicules()">×</button>
          </div>
          <div class="modal-body">
            <div class="editor-toolbar">
              <div class="left">
                <span class="title">✏️ Mode édition</span>
                <div>
                  <div class="hint">Destinations et personnes : séparer par « ; ».</div>
                </div>
              </div>
              <div class="right">
                <input type="text" id="etat-demandes-chauffeur-filter" class="form-control form-control-sm" 
                       placeholder="🔍 Filtrer les chauffeurs..." 
                       style="max-width:220px"
                       oninput="Actions.renderEtatDemandesVehicules()">
                <button class="btn btn-sm btn-secondary" onclick="Actions.etatDemandesAddRow()">+ Ajouter</button>
                <button class="btn btn-sm btn-danger" onclick="Actions.etatDemandesDeleteSelected()">🗑 Supprimer sélection</button>
                <button class="btn btn-sm btn-outline" onclick="Actions.etatDemandesCancel()">↺ Annuler</button>
                <button class="btn btn-sm btn-success" onclick="Actions.etatDemandesSave()">💾 Enregistrer tout</button>
                <button class="btn btn-sm btn-info" onclick="Printer.imprimerEtatDemandes()">🖨️ Imprimer l'état</button>
              </div>
            </div>
            <div class="editor-scroll">
              <table class="editor-table">
                <thead>
                  <tr>
                    <th style="width:32px"><input type="checkbox" id="dem-check-all"></th>
                    <th>N° Demande</th>
                    <th>Demandeur</th>
                    <th>Objet</th>
                    <th>Destination(s) ; séparées</th>
                    <th>Départ</th>
                    <th>Retour</th>
                    <th>Personnes transportées ; séparées</th>
                    <th>Chauffeur</th>
                    <th>Statut</th>
                    <th>Commentaire</th>
                    <th style="width:60px">Actions</th>
                  </tr>
                </thead>
                <tbody id="etat-demandes-tbody"></tbody>
              </table>
            </div>
            <p class="text-muted" style="margin-top:12px;font-size:12px;text-align:center">
              <span id="etat-demandes-count">${demandes.length}</span> demande(s) — <span id="etat-demandes-dirty">0</span> modification(s) en attente
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="Actions.closeEtatDemandesVehicules()">Fermer</button>
          </div>
        </div>
      </div>
    `);
    Actions.renderEtatDemandesVehicules();
    const ca = document.getElementById('dem-check-all');
    if (ca) ca.addEventListener('change', (e) => {
      document.querySelectorAll('#etat-demandes-tbody input.row-check').forEach(c => c.checked = e.target.checked);
    });
  },

  closeEtatDemandesVehicules() {
    if (Object.keys(Actions.editDemandesBuffer).length || Actions.editDemandesNewRows.length) {
      if (!Utils.confirm('Fermer sans enregistrer ? Les modifications seront perdues.')) return;
    }
    Actions.editDemandesBuffer = {};
    Actions.editDemandesNewRows = [];
    App.closeModal();
  },

  renderEtatDemandesVehicules() {
    const tbody = document.getElementById('etat-demandes-tbody');
    if (!tbody) return;
    const demandes = Scope.demandesVehicules().slice().sort((a,b) => (b.dateCreation||'').localeCompare(a.dateCreation||''));
    const chauffeurs = API.getAgents().filter(a => a.actif);
    const statuts = API.getStatutsVehicule();

    const chFilterRaw = (document.getElementById('etat-demandes-chauffeur-filter')?.value || '');
    const chFilter = chFilterRaw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const chauffeursFiltres = chFilter
      ? chauffeurs.filter(a => 
          `${a.prenom} ${a.nom} ${a.matricule} ${a.fonction||''}`.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(chFilter))
      : chauffeurs;

    const chauffeurOptions = (selId) =>
      `<option value="">— Aucun —</option>` +
      chauffeursFiltres.map(a => `<option value="${a.idAgent}" ${selId === a.idAgent ? 'selected' : ''}>${Utils.esc(a.prenom + ' ' + a.nom)}</option>`).join('');

    const statutOptions = (sel) =>
      statuts.map(s => `<option value="${s.code}" ${sel === s.code ? 'selected' : ''}>${Utils.esc(s.libelle)}</option>`).join('');

    let html = '';

    Actions.editDemandesNewRows.forEach(r => {
      const session = Auth.session();
      const agent = Auth.currentAgent();
      html += `
        <tr class="row-new" data-row="${r.tempId}">
          <td><input type="checkbox" class="row-check" value="${r.tempId}"></td>
          <td><small class="text-muted">Auto</small></td>
          <td><small>${Utils.esc(agent ? agent.prenom + ' ' + agent.nom : session?.login || '—')}</small></td>
          <td><input type="text" class="form-control" value="${Utils.esc(r.objet || '')}" oninput="Actions.etatDemandesChange('${r.tempId}', 'objet', this.value)" style="min-width:150px"></td>
          <td><input type="text" class="form-control" value="${Utils.esc((r.destinations || []).join(' ; '))}" oninput="Actions.etatDemandesChange('${r.tempId}', 'destinations', this.value.split(';').map(s => s.trim()).filter(Boolean))" placeholder="Paris ; Lyon" style="min-width:150px"></td>
          <td><input type="datetime-local" class="form-control" value="${Utils.toLocalInput(r.dateDepart)}" oninput="Actions.etatDemandesChange('${r.tempId}', 'dateDepart', this.value)" style="min-width:170px"></td>
          <td><input type="datetime-local" class="form-control" value="${Utils.toLocalInput(r.dateRetour)}" oninput="Actions.etatDemandesChange('${r.tempId}', 'dateRetour', this.value)" style="min-width:170px"></td>
          <td><input type="text" class="form-control" value="${Utils.esc((r.personnesTransportees || []).join(' ; '))}" oninput="Actions.etatDemandesChange('${r.tempId}', 'personnesTransportees', this.value.split(';').map(s => s.trim()).filter(Boolean))" placeholder="Youssef TAZI ; Ahmed ZEROUALI" style="min-width:180px"></td>
          <td><select class="form-control" onchange="Actions.etatDemandesChange('${r.tempId}', 'idChauffeur', this.value ? Number(this.value) : null)">${chauffeurOptions(r.idChauffeur)}</select></td>
          <td><select class="form-control" onchange="Actions.etatDemandesChange('${r.tempId}', 'statut', this.value)">${statutOptions(r.statut || 'BROUILLON')}</select></td>
          <td><input type="text" class="form-control" value="${Utils.esc(r.commentaireValidateur || '')}" oninput="Actions.etatDemandesChange('${r.tempId}', 'commentaireValidateur', this.value)" style="min-width:120px"></td>
          <td><button class="btn btn-sm btn-danger" onclick="Actions.etatDemandesRemoveNew('${r.tempId}')">×</button></td>
        </tr>`;
    });

    demandes.forEach(d => {
      const buffer = Actions.editDemandesBuffer[d.idDemande] || {};
      const objet = buffer.objet !== undefined ? buffer.objet : d.objet;
      const destsArr = buffer.destinations !== undefined ? buffer.destinations :
        (Array.isArray(d.destinations) && d.destinations.length
          ? d.destinations
          : (d.destination ? [d.destination] : []));
      const personnesArr = buffer.personnesTransportees !== undefined ? buffer.personnesTransportees :
        Utils.personnesList(d);
      const dateDepart = buffer.dateDepart !== undefined ? buffer.dateDepart : d.dateDepart;
      const dateRetour = buffer.dateRetour !== undefined ? buffer.dateRetour : d.dateRetour;
      const idChauffeur = buffer.idChauffeur !== undefined ? buffer.idChauffeur : d.idChauffeur;
      const statut = buffer.statut !== undefined ? buffer.statut : d.statut;
      const commentaireValidateur = buffer.commentaireValidateur !== undefined ? buffer.commentaireValidateur : (d.commentaireValidateur || '');
      const isDirty = Object.keys(buffer).length > 0;
      const demandeur = API.getAgent(d.idDemandeur);

      html += `
        <tr class="${isDirty ? 'row-dirty' : ''}" data-row="${d.idDemande}">
          <td><input type="checkbox" class="row-check" value="${d.idDemande}"></td>
          <td><strong style="font-size:11px">${Utils.esc(d.numeroDemande)}</strong></td>
          <td>
            ${demandeur ? `
              <div class="demandeur-cell">
                <div class="demandeur-avatar" style="width:24px;height:24px;font-size:10px">${Utils.esc((demandeur.prenom.charAt(0)+demandeur.nom.charAt(0)).toUpperCase())}</div>
                <div class="demandeur-info">
                  <div class="demandeur-nom" style="font-size:11px">${Utils.esc(demandeur.prenom + ' ' + demandeur.nom)}</div>
                  <div class="demandeur-meta" style="font-size:10px">${Utils.esc(demandeur.matricule || '')}</div>
                </div>
              </div>
            ` : '—'}
          </td>
          <td><input type="text" class="form-control" value="${Utils.esc(objet || '')}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'objet', this.value)" style="min-width:150px"></td>
          <td><input type="text" class="form-control" value="${Utils.esc(destsArr.join(' ; '))}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'destinations', this.value.split(';').map(s => s.trim()).filter(Boolean))" placeholder="Paris ; Lyon" style="min-width:150px"></td>
          <td><input type="datetime-local" class="form-control" value="${Utils.toLocalInput(dateDepart)}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'dateDepart', this.value)" style="min-width:170px"></td>
          <td><input type="datetime-local" class="form-control" value="${Utils.toLocalInput(dateRetour)}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'dateRetour', this.value)" style="min-width:170px"></td>
          <td><input type="text" class="form-control" value="${Utils.esc(personnesArr.join(' ; '))}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'personnesTransportees', this.value.split(';').map(s => s.trim()).filter(Boolean))" placeholder="Youssef TAZI ; Ahmed ZEROUALI" style="min-width:180px"></td>
          <td><select class="form-control" onchange="Actions.etatDemandesChange(${d.idDemande}, 'idChauffeur', this.value ? Number(this.value) : null)">${chauffeurOptions(idChauffeur)}</select></td>
          <td><select class="form-control" onchange="Actions.etatDemandesChange(${d.idDemande}, 'statut', this.value)">${statutOptions(statut)}</select></td>
          <td><input type="text" class="form-control" value="${Utils.esc(commentaireValidateur)}" oninput="Actions.etatDemandesChange(${d.idDemande}, 'commentaireValidateur', this.value)" style="min-width:120px"></td>
          <td></td>
        </tr>`;
    });
    tbody.innerHTML = html;
    Actions.updateEtatDemandesCounters();
  },

  updateEtatDemandesCounters() {
    const dirty = Object.keys(Actions.editDemandesBuffer).length + Actions.editDemandesNewRows.length;
    const el = document.getElementById('etat-demandes-dirty');
    if (el) el.textContent = dirty;
    const cnt = document.getElementById('etat-demandes-count');
    if (cnt) cnt.textContent = Scope.demandesVehicules().length;
  },

  etatDemandesChange(rowId, field, value) {
    if (typeof rowId === 'string' && rowId.startsWith('new_')) {
      const r = Actions.editDemandesNewRows.find(x => x.tempId === rowId);
      if (r) r[field] = value;
    } else {
      const id = Number(rowId);
      if (!Actions.editDemandesBuffer[id]) Actions.editDemandesBuffer[id] = {};
      Actions.editDemandesBuffer[id][field] = value;
    }
    const tr = document.querySelector(`#etat-demandes-tbody tr[data-row="${rowId}"]`);
    if (tr && !(typeof rowId === 'string' && rowId.startsWith('new_'))) tr.classList.add('row-dirty');
    Actions.updateEtatDemandesCounters();
  },

  etatDemandesAddRow() {
    const tempId = 'new_' + Date.now();
    Actions.editDemandesNewRows.push({
      tempId,
      objet: '', destinations: [], personnesTransportees: [],
      dateDepart: '', dateRetour: '',
      idVehicule: null, idChauffeur: null,
      statut: 'BROUILLON', commentaireValidateur: ''
    });
    Actions.renderEtatDemandesVehicules();
    setTimeout(() => {
      const input = document.querySelector(`#etat-demandes-tbody tr[data-row="${tempId}"] input[type="text"]`);
      if (input) input.focus();
    }, 50);
  },

  etatDemandesRemoveNew(tempId) {
    Actions.editDemandesNewRows = Actions.editDemandesNewRows.filter(x => x.tempId !== tempId);
    Actions.renderEtatDemandesVehicules();
  },

  etatDemandesDeleteSelected() {
    const checks = document.querySelectorAll('#etat-demandes-tbody input.row-check:checked');
    if (!checks.length) { Utils.toast('Aucune ligne sélectionnée', 'warning'); return; }
    const ids = Array.from(checks).map(c => c.value);
    const existants = ids.filter(id => !id.startsWith('new_'));
    const nouveaux = ids.filter(id => id.startsWith('new_'));
    Actions.editDemandesNewRows = Actions.editDemandesNewRows.filter(r => !nouveaux.includes(r.tempId));
    if (existants.length) {
      if (!Utils.confirm(`Supprimer ${existants.length} demande(s) ?`)) return;
      const res = API.bulkDeleteDemandesVehicules(existants.map(Number));
      res.errors.forEach(e => Utils.toast(`#${e.code || e.id} : ${e.message}`, 'error', 5000));
      if (res.ok) Utils.toast(`${res.ok} demande(s) supprimée(s)`, 'success');
    }
    Object.keys(Actions.editDemandesBuffer).forEach(k => {
      if (ids.includes(k)) delete Actions.editDemandesBuffer[k];
    });
    Actions.renderEtatDemandesVehicules();
    App.refresh();
  },

  etatDemandesCancel() {
    if (!Utils.confirm('Annuler toutes les modifications non enregistrées ?')) return;
    Actions.editDemandesBuffer = {};
    Actions.editDemandesNewRows = [];
    Actions.renderEtatDemandesVehicules();
  },

  etatDemandesSave() {
    let ok = 0, err = 0;
    const erreurs = [];

    const nouvelles = [];
    for (const row of Actions.editDemandesNewRows) {
      if (!row.objet?.trim() || !row.destinations?.length || !row.personnesTransportees?.length || !row.dateDepart || !row.dateRetour) {
        erreurs.push(`Nouvelle ligne : objet, destination(s), personnes et dates obligatoires`);
        err++; continue;
      }
      if (row.dateRetour <= row.dateDepart) {
        erreurs.push(`Nouvelle ligne : retour > départ requis`);
        err++; continue;
      }
      nouvelles.push(row);
    }
    nouvelles.forEach(row => {
      try {
        const session = Auth.session();
        const agent = Auth.currentAgent();
        const destsArr = row.destinations;
        const persArr = row.personnesTransportees;
        API.createDemandeVehicule({
          objet: row.objet.trim(),
          motif: 'Créée via édition en masse',
          destination: destsArr[0],
          destinations: destsArr,
          personnesTransportees: persArr,
          nbPassagers: persArr.length,
          dateDepart: row.dateDepart,
          dateRetour: row.dateRetour,
          idChauffeur: row.idChauffeur || null,
          statut: row.statut || 'BROUILLON',
          commentaireValidateur: row.commentaireValidateur || '',
          idDemandeur: session?.idAgent,
          idCreateur: session?.idAgent,
          idDirection: agent?.idDirection || 1,
          dateCreation: new Date().toISOString()
        });
        ok++;
      } catch (e) { erreurs.push(e.message); err++; }
    });

    const updates = Object.entries(Actions.editDemandesBuffer).map(([id, data]) => ({idDemande: Number(id), ...data}));
    const updatesValides = [];
    for (const u of updates) {
      const d = API.getDemandeVehicule(u.idDemande);
      if (!d) { erreurs.push(`#${u.idDemande} introuvable`); err++; continue; }
      const newDep = u.dateDepart || d.dateDepart;
      const newRet = u.dateRetour || d.dateRetour;
      if (newRet <= newDep) {
        erreurs.push(`${d.numeroDemande} : retour doit être > départ`);
        err++; continue;
      }
      if (Array.isArray(u.destinations)) {
        u.destination = u.destinations[0] || '';
      }
      if (Array.isArray(u.personnesTransportees)) {
        u.nbPassagers = u.personnesTransportees.length;
      }
      updatesValides.push(u);
    }
    if (updatesValides.length) {
      const res = API.bulkUpdateDemandesVehicules(updatesValides);
      ok += res.ok;
      res.errors.forEach(e => { erreurs.push(`${e.code || '#'+e.id} : ${e.message}`); err++; });
    }

    if (ok) Utils.toast(`${ok} demande(s) enregistrée(s)`, 'success');
    if (err) {
      erreurs.slice(0, 3).forEach(m => Utils.toast(m, 'error', 5000));
      if (erreurs.length > 3) Utils.toast(`…et ${erreurs.length - 3} autre(s) erreur(s)`, 'error', 5000);
    }
    if (!ok && !err) { Utils.toast('Aucune modification à enregistrer', 'warning'); return; }
    Actions.editDemandesBuffer = {};
    Actions.editDemandesNewRows = [];
    Actions.renderEtatDemandesVehicules();
    App.refresh();
  },

  renderRoles() {
    const tbody = document.getElementById('roles-tbody');
    if (!tbody) return;
    const q = (document.getElementById('filter-role')?.value || '').trim().toLowerCase();
    const fType = document.getElementById('filter-role-type')?.value || '';
    let list = API.getRoles();
    if (q) list = list.filter(r => [r.code, r.libelle].some(v => (v||'').toLowerCase().includes(q)));
    if (fType === 'system') list = list.filter(r => r.isSystem);
    if (fType === 'custom') list = list.filter(r => !r.isSystem);
    list = list.slice().sort((a,b) => a.code.localeCompare(b.code));
    const users = API.getUsers();
    const catalog = API.PAGES_CATALOG;
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:20px">Aucun rôle</td></tr>'; return; }
    tbody.innerHTML = list.map(r => {
      const nbUsers = users.filter(u => u.role === r.code).length;
      const pagesLabels = (r.pages || []).map(pid => catalog.find(c => c.id === pid)?.label || pid);
      return `
        <tr>
          <td><strong>${Utils.esc(r.code)}</strong></td>
          <td>${Utils.esc(r.libelle)}</td>
          <td><span class="role-color-dot" style="background:${Utils.esc(r.couleur || '#6c757d')}"></span></td>
          <td title="${Utils.esc(pagesLabels.join(', '))}">
            <span class="badge badge-SOUMIS">${pagesLabels.length} page${pagesLabels.length>1?'s':''}</span>
          </td>
          <td>${nbUsers}</td>
          <td>${r.isSystem ? '<span class="badge" style="background:#d4a017;color:#fff">Système</span>' : '<span class="badge" style="background:#cce5ff;color:#004085">Personnalisé</span>'}</td>
          <td>${r.actif !== false ? '<span class="badge badge-VALIDE">Actif</span>' : '<span class="badge badge-ANNULE">Inactif</span>'}</td>
          <td><div class="actions-cell">
            <button class="btn btn-sm btn-outline" onclick="Actions.openRoleModal(${r.idRole})">Modifier</button>
            ${!r.isSystem ? `<button class="btn btn-sm btn-danger" ${nbUsers ? 'disabled' : ''} onclick="Actions.supprimerRole(${r.idRole})">Suppr.</button>` : ''}
          </div></td>
        </tr>`;
    }).join('');
  },
  resetFiltresRoles() {
    const s = document.getElementById('filter-role');
    const t = document.getElementById('filter-role-type');
    if (s) s.value = ''; if (t) t.value = '';
    Actions.renderRoles();
  },
  roleBadge(roleCode) {
    const r = API.getRoleByCode(roleCode);
    if (!r) return `<span class="badge badge-AGENT">${Utils.esc(roleCode)}</span>`;
    return `<span class="badge" style="background:${Utils.esc(r.couleur || '#6c757d')};color:#fff">${Utils.esc(r.libelle)}</span>`;
  },
  openRoleModal(id) {
    const isEdit = !!id;
    const r = isEdit ? API.getRole(id) : null;
    if (isEdit && !r) return;
    const catalog = API.PAGES_CATALOG;
    const selectedPages = r ? (r.pages || []) : ['dashboard'];
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal" style="max-width:720px">
          <div class="modal-header"><h3>${isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button></div>
          <div class="modal-body">
            <form id="form-role">
              <input type="hidden" id="r-id" value="${isEdit ? r.idRole : ''}">
              <div class="form-grid">
                <div class="form-group"><label>Code <span class="required">*</span></label>
                  <input type="text" id="r-code" class="form-control" required maxlength="30"
                         pattern="[A-Za-z0-9_]{2,30}" value="${r ? Utils.esc(r.code) : ''}" ${r && r.isSystem ? 'readonly' : ''}></div>
                <div class="form-group"><label>Libellé <span class="required">*</span></label>
                  <input type="text" id="r-libelle" class="form-control" required maxlength="80" value="${r ? Utils.esc(r.libelle) : ''}"></div>
                <div class="form-group"><label>Couleur</label>
                  <input type="color" id="r-couleur" class="form-control" style="height:42px;padding:4px" value="${r ? (r.couleur || '#6c757d') : '#6c757d'}"></div>
                <div class="form-group"><label>Statut</label>
                  <select id="r-actif" class="form-control">
                    <option value="true" ${!r || r.actif !== false ? 'selected' : ''}>Actif</option>
                    <option value="false" ${r && r.actif === false ? 'selected' : ''}>Inactif</option>
                  </select></div>
                <div class="form-group full-width">
                  <label>Pages autorisées <span class="required">*</span></label>
                  <div class="permissions-grid" id="r-pages-grid">
                    ${catalog.map(p => `
                      <label class="permission-item ${selectedPages.includes(p.id) ? 'checked' : ''}">
                        <input type="checkbox" data-page-id="${p.id}" ${selectedPages.includes(p.id) ? 'checked' : ''}>
                        <span>${Utils.esc(p.label)}</span>
                      </label>`).join('')}
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn" onclick="Actions.saveRole()">Enregistrer</button>
          </div>
        </div>
      </div>`);
    document.querySelectorAll('#r-pages-grid input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => cb.closest('.permission-item').classList.toggle('checked', cb.checked));
    });
  },
  saveRole() {
    const form = document.getElementById('form-role');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('r-id').value;
    const code = document.getElementById('r-code').value.trim().toUpperCase();
    const libelle = document.getElementById('r-libelle').value.trim();
    const couleur = document.getElementById('r-couleur').value;
    const actif = document.getElementById('r-actif').value === 'true';
    const pages = Array.from(document.querySelectorAll('#r-pages-grid input[type=checkbox]:checked')).map(cb => cb.dataset.pageId);
    if (!pages.length) { Utils.toast('Sélectionnez au moins une page', 'error'); return; }
    try {
      if (id) {
        const r = API.getRole(Number(id));
        const data = {libelle, couleur, actif, pages};
        if (!r.isSystem) data.code = code;
        API.updateRole(Number(id), data);
        Utils.toast('Rôle modifié', 'success');
      } else {
        API.createRole({code, libelle, couleur, actif, pages});
        Utils.toast('Rôle créé', 'success');
      }
      App.closeModal(); App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },
  supprimerRole(id) {
    const r = API.getRole(id);
    if (!r || r.isSystem) { Utils.toast('Impossible', 'error'); return; }
    const nbUsers = API.getUsers().filter(u => u.role === r.code).length;
    if (nbUsers) { Utils.toast(`Utilisé par ${nbUsers} compte(s)`, 'error'); return; }
    if (!Utils.confirm(`Supprimer "${r.code}" ?`)) return;
    API.deleteRole(id); Utils.toast('Rôle supprimé', 'success'); App.refresh();
  },
  rolesVersLignes() {
    const users = API.getUsers();
    const catalog = API.PAGES_CATALOG;
    return API.getRoles().map(r => ({
      'Code': r.code, 'Libellé': r.libelle, 'Couleur': r.couleur || '',
      'Pages autorisées': (r.pages || []).map(pid => catalog.find(c => c.id === pid)?.label || pid).join(' ; '),
      'Nb pages': (r.pages || []).length,
      'Nb utilisateurs': users.filter(u => u.role === r.code).length,
      'Type': r.isSystem ? 'Système' : 'Personnalisé',
      'Statut': r.actif !== false ? 'Actif' : 'Inactif'
    }));
  },

  renderComptes() {
    const tbody = document.getElementById('comptes-tbody');
    if (!tbody) return;
    const q = (document.getElementById('filter-compte')?.value || '').trim().toLowerCase();
    const fRole = document.getElementById('filter-compte-role')?.value || '';
    let list = API.getUsers();
    if (q) list = list.filter(u => {
      const a = u.idAgent ? API.getAgent(u.idAgent) : null;
      const nom = a ? `${a.prenom} ${a.nom} ${a.matricule}` : '';
      return [u.login, u.role, nom].some(v => (v||'').toLowerCase().includes(q));
    });
    if (fRole) list = list.filter(u => u.role === fRole);
    list = list.slice().sort((a,b) => a.login.localeCompare(b.login));
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">Aucun compte</td></tr>'; return; }
    tbody.innerHTML = list.map(u => {
      const agent = u.idAgent ? API.getAgent(u.idAgent) : null;
      const agentLabel = agent ? `${Utils.esc(agent.prenom + ' ' + agent.nom)} <small class="text-muted">(${Utils.esc(agent.matricule)})</small>` : '<span class="text-muted">—</span>';
      return `
        <tr>
          <td><strong>${Utils.esc(u.login)}</strong></td>
          <td>${agent ? Utils.esc(agent.prenom + ' ' + agent.nom) : '<span class="text-muted">—</span>'}</td>
          <td>${Actions.roleBadge(u.role)}</td>
          <td>${agentLabel}</td>
          <td>${u.dateLogin ? Utils.formatDateTime(u.dateLogin) : '<span class="text-muted">—</span>'}</td>
          <td>${u.actif !== false ? '<span class="badge badge-VALIDE">Actif</span>' : '<span class="badge badge-ANNULE">Inactif</span>'}</td>
          <td><div class="actions-cell">
            <button class="btn btn-sm btn-outline" onclick="Actions.openCompteModal(${u.idUtilisateur})">Modifier</button>
            <button class="btn btn-sm btn-warning" onclick="Actions.openChangePassword(${u.idUtilisateur})">🔑</button>
            ${u.login !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="Actions.supprimerCompte(${u.idUtilisateur})">Suppr.</button>` : ''}
          </div></td>
        </tr>`;
    }).join('');
  },
  resetFiltresComptes() {
    const s = document.getElementById('filter-compte');
    const r = document.getElementById('filter-compte-role');
    if (s) s.value = ''; if (r) r.value = '';
    Actions.renderComptes();
  },
  openCompteModal(id) {
    const isEdit = !!id;
    const u = isEdit ? API.getUsers().find(x => x.idUtilisateur === id) : null;
    if (isEdit && !u) return;
    const agents = API.getAgents();
    const roles = API.getRoles().filter(r => r.actif !== false);
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal modal-account">
          <div class="modal-header"><h3>${isEdit ? 'Modifier le compte' : 'Nouveau compte'}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button></div>
          <div class="modal-body">
            <form id="form-compte">
              <input type="hidden" id="c-id" value="${isEdit ? u.idUtilisateur : ''}">
              <div class="form-grid">
                <div class="form-group"><label>Login <span class="required">*</span></label>
                  <input type="text" id="c-login" class="form-control" required maxlength="50"
                         pattern="[A-Za-z0-9._-]{2,50}" value="${u ? Utils.esc(u.login) : ''}" ${isEdit ? 'readonly' : ''}></div>
                <div class="form-group"><label>Rôle <span class="required">*</span></label>
                  <select id="c-role" class="form-control" required>
                    ${roles.map(r => `<option value="${Utils.esc(r.code)}" ${u && u.role===r.code?'selected':''}>${Utils.esc(r.libelle)} (${Utils.esc(r.code)})</option>`).join('')}
                  </select></div>
                <div class="form-group full-width">
                  <label>Agent lié</label>
                  <input type="text" id="c-agent-search" class="form-control"
                         placeholder="🔍 Rechercher par nom, matricule, fonction..."
                         autocomplete="off" style="margin-bottom:6px">
                  <select id="c-agent" class="form-control select-scroll" size="8">
                    <option value="">— Aucun —</option>
                    ${agents.map(a => `<option value="${a.idAgent}" ${u && u.idAgent === a.idAgent ? 'selected' : ''}>${Utils.esc(a.prenom + ' ' + a.nom)} — ${Utils.esc(a.matricule)} (${Utils.esc(a.fonction||'')})</option>`).join('')}
                  </select>
                  <small class="text-muted" id="c-agent-count">${agents.length} agent(s)</small>
                </div>
                ${!isEdit ? `
                  <div class="form-group"><label>Mot de passe <span class="required">*</span></label><input type="password" id="c-password" class="form-control" required minlength="3"></div>
                  <div class="form-group"><label>Confirmer <span class="required">*</span></label><input type="password" id="c-password2" class="form-control" required minlength="3"></div>
                ` : `<div class="form-group full-width"><div class="alert alert-info">💡 Utilisez le bouton 🔑 pour changer le mot de passe.</div></div>`}
                <div class="form-group"><label>Statut</label>
                  <select id="c-actif" class="form-control">
                    <option value="true" ${!u || u.actif !== false ? 'selected' : ''}>Actif</option>
                    <option value="false" ${u && u.actif === false ? 'selected' : ''}>Inactif</option>
                  </select></div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn" onclick="Actions.saveCompte()">Enregistrer</button>
          </div>
        </div>
      </div>`);

    const agentSearch = document.getElementById('c-agent-search');
    const agentSelect = document.getElementById('c-agent');
    const agentCount = document.getElementById('c-agent-count');
    if (agentSearch && agentSelect) {
      const allAgents = agents.map(a => ({
        value: String(a.idAgent),
        label: `${a.prenom} ${a.nom} — ${a.matricule} (${a.fonction||''})`,
        search: `${a.prenom} ${a.nom} ${a.matricule} ${a.fonction||''}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const normaliser = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      agentSearch.addEventListener('input', () => {
        const q = normaliser(agentSearch.value.trim());
        const selVal = agentSelect.value;
        const filtres = allAgents.filter(o => !q || normaliser(o.search).includes(q));
        agentSelect.innerHTML = `<option value="">— Aucun —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === selVal ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (agentCount) agentCount.textContent = `${filtres.length} / ${allAgents.length} agent(s)`;
        if (filtres.length === 1 && !selVal) agentSelect.value = filtres[0].value;
      });
    }
  },
  saveCompte() {
    const form = document.getElementById('form-compte');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('c-id').value;
    const login = document.getElementById('c-login').value.trim();
    const role = document.getElementById('c-role').value;
    const idAgent = document.getElementById('c-agent').value ? Number(document.getElementById('c-agent').value) : null;
    const actif = document.getElementById('c-actif').value === 'true';
    const existing = API.getUsers().find(u => u.login.toLowerCase() === login.toLowerCase() && (!id || u.idUtilisateur !== Number(id)));
    if (existing) { Utils.toast('Login déjà utilisé', 'error'); return; }
    try {
      if (id) { API.updateUser(Number(id), {role, idAgent, actif}); Utils.toast('Compte modifié', 'success'); }
      else {
        const pwd = document.getElementById('c-password').value;
        const pwd2 = document.getElementById('c-password2').value;
        if (pwd !== pwd2) { Utils.toast('Mots de passe différents', 'error'); return; }
        API.createUser({login, password: pwd, role, idAgent, actif});
        Utils.toast('Compte créé', 'success');
      }
      App.closeModal(); App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },
  openChangePassword(id) {
    const u = API.getUsers().find(x => x.idUtilisateur === id);
    if (!u) return;
    App.openModal(`
      <div class="modal-overlay active">
        <div class="modal" style="max-width:480px">
          <div class="modal-header"><h3>🔑 Changer mot de passe — ${Utils.esc(u.login)}</h3>
            <button class="modal-close" onclick="App.closeModal()">×</button></div>
          <div class="modal-body">
            <form id="form-password">
              <input type="hidden" id="pw-id" value="${u.idUtilisateur}">
              <div class="form-group" style="margin-bottom:12px"><label>Nouveau <span class="required">*</span></label>
                <input type="password" id="pw-new" class="form-control" required minlength="3"></div>
              <div class="form-group"><label>Confirmer <span class="required">*</span></label>
                <input type="password" id="pw-new2" class="form-control" required minlength="3"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
            <button class="btn btn-warning" onclick="Actions.savePassword()">Mettre à jour</button>
          </div>
        </div>
      </div>`);
  },
  savePassword() {
    const form = document.getElementById('form-password');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = Number(document.getElementById('pw-id').value);
    const p1 = document.getElementById('pw-new').value;
    const p2 = document.getElementById('pw-new2').value;
    if (p1 !== p2) { Utils.toast('Mots de passe différents', 'error'); return; }
    API.updateUser(id, {password: p1});
    Utils.toast('Mot de passe mis à jour', 'success');
    App.closeModal(); App.refresh();
  },
  supprimerCompte(id) {
    const u = API.getUsers().find(x => x.idUtilisateur === id);
    if (!u) return;
    if (u.login === 'admin') { Utils.toast('Compte admin protégé', 'error'); return; }
    if (Auth.session()?.idUtilisateur === id) { Utils.toast('Impossible', 'error'); return; }
    if (!Utils.confirm(`Supprimer "${u.login}" ?`)) return;
    API.deleteUser(id); Utils.toast('Compte supprimé', 'success'); App.refresh();
  },
  comptesVersLignes() {
    return API.getUsers().map(u => {
      const a = u.idAgent ? API.getAgent(u.idAgent) : null;
      const role = API.getRoleByCode(u.role);
      return {'Login':u.login,'Rôle':role?.libelle || u.role,'Code rôle':u.role,
        'Agent lié':a ? `${a.prenom} ${a.nom} (${a.matricule})` : '',
        'Statut':u.actif !== false ? 'Actif' : 'Inactif','Dernière connexion':u.dateLogin || ''};
    });
  },

  nouvelAgent() { Actions.openAgentModal(null); },
  openAgentModal(id, options = {}) {
    const isEdit = !!id;
    const a = isEdit ? API.getAgent(id) : null;
    const superieursDispos = Scope.agents().filter(x => !a || x.idAgent !== a.idAgent);
    Actions._agentOnCreated = options.onCreated || null;

    const valAffectation = API.getValeursDistinctesAgents('affectation');
    const valGrade       = API.getValeursDistinctesAgents('grade');
    const valFonction    = API.getValeursDistinctesAgents('fonction');
    const withCurrent = (arr, current) => {
      if (current && !arr.includes(current)) return [...arr, current];
      return arr;
    };

    App.openModal(`
      <div class="modal-overlay active"><div class="modal" style="max-width:720px">
        <div class="modal-header"><h3>${isEdit ? 'Modifier' : 'Nouvel agent'}</h3><button class="modal-close" onclick="App.closeModal();Actions._agentOnCreated=null">×</button></div>
        <div class="modal-body">
          <div class="alert alert-info" style="margin-bottom:14px">
            💡 <strong>Astuce :</strong> les champs avec une flèche ▼ proposent une liste de valeurs déjà utilisées.
          </div>
          <form id="form-agent">
            <input type="hidden" id="a-id" value="${isEdit ? a.idAgent : ''}">

            ${Utils.datalist('dl-agent-affectation', withCurrent(valAffectation, a?.affectation))}
            ${Utils.datalist('dl-agent-grade', withCurrent(valGrade, a?.grade))}
            ${Utils.datalist('dl-agent-fonction', withCurrent(valFonction, a?.fonction))}

            <div class="form-grid">
              <div class="form-group"><label>Nom <span class="required">*</span></label><input type="text" id="a-nom" class="form-control" required value="${a ? Utils.esc(a.nom) : ''}"></div>
              <div class="form-group"><label>Prénom <span class="required">*</span></label><input type="text" id="a-prenom" class="form-control" required value="${a ? Utils.esc(a.prenom) : ''}"></div>
              <div class="form-group"><label>Matricule</label><input type="text" id="a-matricule" class="form-control" value="${a ? Utils.esc(a.matricule) : ''}"></div>
              <div class="form-group"><label>Email <span class="required">*</span></label><input type="email" id="a-email" class="form-control" required value="${a ? Utils.esc(a.email) : ''}"></div>
              <div class="form-group"><label>Téléphone</label><input type="tel" id="a-telephone" class="form-control" value="${a ? Utils.esc(a.telephone||'') : ''}"></div>
              <div class="form-group"><label>Fonction <span class="required">*</span> <span class="combo-hint">(liste modifiable ▼)</span></label>
                <input type="text" id="a-fonction" class="form-control" list="dl-agent-fonction" required value="${a ? Utils.esc(a.fonction) : ''}" placeholder="Saisir ou choisir..."></div>
              <div class="form-group"><label>Grade <span class="combo-hint">(liste modifiable ▼)</span></label>
                <input type="text" id="a-grade" class="form-control" list="dl-agent-grade" value="${a ? Utils.esc(a.grade||'') : ''}" placeholder="Saisir ou choisir..."></div>
              <div class="form-group"><label>Affectation <span class="combo-hint">(liste modifiable ▼)</span></label>
                <input type="text" id="a-affectation" class="form-control" list="dl-agent-affectation" value="${a ? Utils.esc(a.affectation||'') : ''}" placeholder="Saisir ou choisir..."></div>
              <div class="form-group"><label>Taux (MAD/j)</label><input type="number" id="a-taux" class="form-control" value="${a ? (a.taux||0) : 0}"></div>
              <div class="form-group"><label>Direction <span class="required">*</span></label>
                <select id="a-direction" class="form-control" required>
                  ${Scope.directions().map(d => `<option value="${d.idDirection}" ${a && a.idDirection === d.idDirection ? 'selected' : ''}>${Utils.esc(d.codeDirection)} — ${Utils.esc(d.libelle)}</option>`).join('')}
                </select></div>
              <div class="form-group"><label>Supérieur</label>
                <input type="text" id="a-superieur-search" class="form-control"
                       placeholder="🔍 Rechercher par nom, matricule, fonction..."
                       autocomplete="off" style="margin-bottom:6px">
                <select id="a-superieur" class="form-control" size="5" style="height:auto">
                  <option value="">— Aucun —</option>
                  ${superieursDispos.map(x => `<option value="${x.idAgent}" ${a && a.idSuperieur === x.idAgent ? 'selected' : ''}>${Utils.esc(x.prenom + ' ' + x.nom)} (${Utils.esc(x.matricule)}) — ${Utils.esc(x.fonction)}</option>`).join('')}
                </select>
                <small class="text-muted" id="a-superieur-count">${superieursDispos.length} agent(s)</small>
              </div>
              <div class="form-group full-width"><label>Adresse (ou ville)</label><textarea id="a-adresse" class="form-control" rows="2">${a ? Utils.esc(a.adresse||'') : ''}</textarea></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.closeModal();Actions._agentOnCreated=null">Annuler</button>
          <button class="btn" onclick="Actions.saveAgent()">Enregistrer</button>
        </div>
      </div></div>`);

    // Recherche du supérieur
    const supSearch = document.getElementById('a-superieur-search');
    const supSelect = document.getElementById('a-superieur');
    const supCount = document.getElementById('a-superieur-count');
    if (supSearch && supSelect) {
      const allSup = superieursDispos.map(x => ({
        value: String(x.idAgent),
        label: `${x.prenom} ${x.nom} (${x.matricule}) — ${x.fonction}`,
        search: `${x.prenom} ${x.nom} ${x.matricule} ${x.fonction}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const norm = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      supSearch.addEventListener('input', () => {
        const q = norm(supSearch.value.trim());
        const sel = supSelect.value;
        const filtres = allSup.filter(o => !q || norm(o.search).includes(q));
        supSelect.innerHTML = `<option value="">— Aucun —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === sel ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (supCount) supCount.textContent = `${filtres.length} / ${allSup.length} agent(s)`;
      });
    }
  },
  saveAgent() {
    const form = document.getElementById('form-agent');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('a-id').value;
    const payload = {
      nom: document.getElementById('a-nom').value.trim().toUpperCase(),
      prenom: document.getElementById('a-prenom').value.trim(),
      matricule: document.getElementById('a-matricule').value.trim() || null,
      email: document.getElementById('a-email').value.trim(),
      telephone: document.getElementById('a-telephone').value.trim(),
      adresse: document.getElementById('a-adresse').value.trim(),
      fonction: document.getElementById('a-fonction').value.trim(),
      grade: document.getElementById('a-grade').value.trim(),
      affectation: document.getElementById('a-affectation').value.trim(),
      taux: Number(document.getElementById('a-taux').value || 0),
      idDirection: Number(document.getElementById('a-direction').value),
      idSuperieur: document.getElementById('a-superieur').value ? Number(document.getElementById('a-superieur').value) : null
    };
    try {
      let saved;
      if (id) { saved = API.updateAgent(Number(id), payload); Utils.toast('Agent modifié', 'success'); }
      else { saved = API.createAgent(payload); Utils.toast('Agent créé', 'success'); }
      App.closeModal(); App.refresh();
      const cb = Actions._agentOnCreated; Actions._agentOnCreated = null;
      if (typeof cb === 'function') cb(saved);
    } catch (err) { Utils.toast(err.message, 'error'); }
  },
  supprimerAgent(id) {
    if (!Utils.confirm('Supprimer cet agent ?')) return;
    try { API.deleteAgent(id); Utils.toast('Agent supprimé', 'success'); App.refresh(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  },

  nouvelleDirection() { Actions.openDirectionModal(null); },
  openDirectionModal(id) {
    const isEdit = !!id;
    const d = isEdit ? API.getDirection(id) : null;
    const parentsDisponibles = Scope.directions().filter(x => {
      if (!d) return true;
      if (x.idDirection === d.idDirection) return false;
      return x.idDirectionParent !== d.idDirection;
    });
    App.openModal(`
      <div class="modal-overlay active"><div class="modal" style="max-width:600px">
        <div class="modal-header"><h3>${isEdit ? 'Modifier' : 'Nouvelle direction'}</h3><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="form-direction">
          <input type="hidden" id="d-id" value="${isEdit ? d.idDirection : ''}">
          <div class="form-grid">
            <div class="form-group"><label>Code <span class="required">*</span></label>
              <input type="text" id="d-code" class="form-control" required maxlength="100" value="${d ? Utils.esc(d.codeDirection) : ''}"></div>
            <div class="form-group"><label>Statut</label>
              <select id="d-actif" class="form-control">
                <option value="true" ${!d || d.actif ? 'selected' : ''}>Active</option>
                <option value="false" ${d && !d.actif ? 'selected' : ''}>Inactive</option>
              </select></div>
            <div class="form-group full-width"><label>Libellé <span class="required">*</span></label>
              <input type="text" id="d-libelle" class="form-control" required value="${d ? Utils.esc(d.libelle) : ''}"></div>
            <div class="form-group full-width"><label>Parent</label>
              <input type="text" id="d-parent-search" class="form-control"
                     placeholder="🔍 Rechercher par code ou libellé..."
                     autocomplete="off" style="margin-bottom:6px">
              <select id="d-parent" class="form-control" size="5" style="height:auto">
                <option value="">— Aucun —</option>
                ${parentsDisponibles.map(x => `<option value="${x.idDirection}" ${d && d.idDirectionParent === x.idDirection ? 'selected' : ''}>${Utils.esc(x.codeDirection)} — ${Utils.esc(x.libelle)}</option>`).join('')}
              </select>
              <small class="text-muted" id="d-parent-count">${parentsDisponibles.length} direction(s)</small>
            </div>
          </div>
        </form></div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button><button class="btn" onclick="Actions.saveDirection()">Enregistrer</button></div>
      </div></div>`);

    // Recherche de la direction parente
    const dSearch = document.getElementById('d-parent-search');
    const dSelect = document.getElementById('d-parent');
    const dCount = document.getElementById('d-parent-count');
    if (dSearch && dSelect) {
      const allDirs = parentsDisponibles.map(x => ({
        value: String(x.idDirection),
        label: `${x.codeDirection} — ${x.libelle}`,
        search: `${x.codeDirection} ${x.libelle}`.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }));
      const norm = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      dSearch.addEventListener('input', () => {
        const q = norm(dSearch.value.trim());
        const sel = dSelect.value;
        const filtres = allDirs.filter(o => !q || norm(o.search).includes(q));
        dSelect.innerHTML = `<option value="">— Aucun —</option>` +
          filtres.map(o => `<option value="${o.value}" ${o.value === sel ? 'selected' : ''}>${Utils.esc(o.label)}</option>`).join('');
        if (dCount) dCount.textContent = `${filtres.length} / ${allDirs.length} direction(s)`;
      });
    }
  },
  saveDirection() {
    const form = document.getElementById('form-direction');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('d-id').value;
    const code = document.getElementById('d-code').value.trim().toUpperCase();
    const libelle = document.getElementById('d-libelle').value.trim();
    const idParent = document.getElementById('d-parent').value;
    const actif = document.getElementById('d-actif').value === 'true';
    const doublon = API.getDirections().find(x => x.codeDirection.toUpperCase() === code && (!id || x.idDirection !== Number(id)));
    if (doublon) { Utils.toast('Code déjà utilisé', 'error'); return; }
    const payload = {codeDirection: code, libelle, idDirectionParent: idParent ? Number(idParent) : null, actif};
    try {
      if (id) { API.updateDirection(Number(id), payload); Utils.toast('Modifiée', 'success'); }
      else { API.createDirection(payload); Utils.toast('Créée', 'success'); }
      App.closeModal(); App.refresh();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },
  renderDirections() {
    const tbody = document.getElementById('directions-tbody');
    if (!tbody) return;
    const q = (document.getElementById('filter-direction')?.value || '').trim().toLowerCase();
    let list = Scope.directions();
    if (q) list = list.filter(d => [d.codeDirection, d.libelle].some(v => (v||'').toLowerCase().includes(q)));
    list.sort((a,b) => a.codeDirection.localeCompare(b.codeDirection));
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">Aucune</td></tr>'; return; }
    tbody.innerHTML = list.map(d => {
      const parent = d.idDirectionParent ? API.getDirection(d.idDirectionParent) : null;
      const nbAgents = API.getAgents().filter(a => a.idDirection === d.idDirection).length;
      const nbMissions = API.getMissions().filter(m => m.idDirection === d.idDirection).length;
      return `<tr>
        <td><strong>${Utils.esc(d.codeDirection)}</strong></td>
        <td>${Utils.esc(d.libelle)}</td>
        <td>${parent ? Utils.esc(parent.codeDirection) : '—'}</td>
        <td>${nbAgents}</td><td>${nbMissions}</td>
        <td>${d.actif ? 'Active' : 'Inactive'}</td>
        <td><div class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="Actions.openDirectionModal(${d.idDirection})">Modifier</button>
          <button class="btn btn-sm btn-danger" onclick="Actions.supprimerDirection(${d.idDirection})">Suppr.</button>
        </div></td>
      </tr>`;
    }).join('');
  },
  supprimerDirection(id) {
    if (!Utils.confirm('Supprimer ?')) return;
    try { API.deleteDirection(id); Utils.toast('Supprimée', 'success'); App.refresh(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  },

  nouvelleDestination() { Actions.openDestinationModal(null); },
  openDestinationModal(id, options = {}) {
    const isEdit = !!id;
    const d = isEdit ? API.getDestination(id) : null;
    Actions._destinationOnCreated = options.onCreated || null;
    App.openModal(`
      <div class="modal-overlay active"><div class="modal" style="max-width:640px">
        <div class="modal-header"><h3>${isEdit ? 'Modifier' : 'Nouvelle destination'}</h3><button class="modal-close" onclick="App.closeModal();Actions._destinationOnCreated=null">×</button></div>
        <div class="modal-body"><form id="form-destination">
          <input type="hidden" id="dest-id" value="${isEdit ? d.idDestination : ''}">
          <div class="form-grid">
            <div class="form-group"><label>Code <span class="required">*</span></label>
              <input type="text" id="dest-code" class="form-control" required value="${d ? Utils.esc(d.code) : ''}"></div>
            <div class="form-group"><label>Statut</label>
              <select id="dest-actif" class="form-control">
                <option value="true" ${!d || d.actif ? 'selected' : ''}>Active</option>
                <option value="false" ${d && !d.actif ? 'selected' : ''}>Inactive</option>
              </select></div>
            <div class="form-group full-width"><label>Libellé <span class="required">*</span></label>
              <input type="text" id="dest-libelle" class="form-control" required value="${d ? Utils.esc(d.libelle) : ''}"></div>
            <div class="form-group"><label>Ville <span class="required">*</span></label>
              <input type="text" id="dest-ville" class="form-control" required value="${d ? Utils.esc(d.ville||'') : ''}"></div>
            <div class="form-group"><label>Pays <span class="required">*</span></label>
              <input type="text" id="dest-pays" class="form-control" required value="${d ? Utils.esc(d.pays||'Maroc') : 'Maroc'}"></div>
            <div class="form-group"><label>Région</label>
              <input type="text" id="dest-region" class="form-control" value="${d ? Utils.esc(d.region||'') : ''}"></div>
            <div class="form-group"><label>Distance (km)</label>
              <input type="number" id="dest-distance" class="form-control" value="${d ? (d.distanceRef||0) : 0}"></div>
          </div>
        </form></div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal();Actions._destinationOnCreated=null">Annuler</button><button class="btn" onclick="Actions.saveDestination()">Enregistrer</button></div>
      </div></div>`);
  },
  saveDestination() {
    const form = document.getElementById('form-destination');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const id = document.getElementById('dest-id').value;
    const code = document.getElementById('dest-code').value.trim().toUpperCase();
    const doublon = API.getDestinations().find(x => x.code.toUpperCase() === code && (!id || x.idDestination !== Number(id)));
    if (doublon) { Utils.toast('Code déjà utilisé', 'error'); return; }
    const payload = {
      code, libelle: document.getElementById('dest-libelle').value.trim(),
      ville: document.getElementById('dest-ville').value.trim(),
      pays: document.getElementById('dest-pays').value.trim(),
      region: document.getElementById('dest-region').value.trim(),
      distanceRef: Number(document.getElementById('dest-distance').value || 0),
      actif: document.getElementById('dest-actif').value === 'true'
    };
    try {
      let saved;
      if (id) { saved = API.updateDestination(Number(id), payload); Utils.toast('Modifiée', 'success'); }
      else { saved = API.createDestination(payload); Utils.toast('Créée', 'success'); }
      App.closeModal(); App.refresh();
      const cb = Actions._destinationOnCreated; Actions._destinationOnCreated = null;
      if (typeof cb === 'function') cb(saved);
    } catch (err) { Utils.toast(err.message, 'error'); }
  },
  renderDestinations() {
    const tbody = document.getElementById('destinations-tbody');
    if (!tbody) return;
    const q = (document.getElementById('filter-destination')?.value || '').trim().toLowerCase();
    let list = API.getDestinations();
    if (q) list = list.filter(d => [d.code, d.libelle, d.ville, d.pays, d.region].some(v => (v||'').toLowerCase().includes(q)));
    list.sort((a,b) => a.code.localeCompare(b.code));
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted" style="padding:20px">Aucune</td></tr>'; return; }
    tbody.innerHTML = list.map(d => `<tr>
      <td><strong>${Utils.esc(d.code)}</strong></td>
      <td>${Utils.esc(d.libelle)}</td>
      <td>${Utils.esc(d.ville||'—')}</td>
      <td>${Utils.esc(d.pays||'—')}</td>
      <td>${Utils.esc(d.region||'—')}</td>
      <td>${d.distanceRef} km</td>
      <td>${API.getMissions().filter(m => (m.lieuPrincipal||'').toLowerCase() === (d.libelle||'').toLowerCase()).length}</td>
      <td>${d.actif ? 'Active' : 'Inactive'}</td>
      <td><div class="actions-cell">
        <button class="btn btn-sm btn-outline" onclick="Actions.openDestinationModal(${d.idDestination})">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="Actions.supprimerDestination(${d.idDestination})">Suppr.</button>
      </div></td>
    </tr>`).join('');
  },
  supprimerDestination(id) {
    if (!Utils.confirm('Supprimer ?')) return;
    try { API.deleteDestination(id); Utils.toast('Supprimée', 'success'); App.refresh(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  },

  renderStatistiques() {
    const stats = Scope.getStatistiques();
    const elStatut = document.getElementById('chart-statut');
    if (elStatut) {
      new Chart(elStatut, {
        type: 'doughnut',
        data: {labels: Object.keys(stats.byStatut),
          datasets: [{data: Object.values(stats.byStatut),
            backgroundColor: ['#6c757d','#ffc107','#17a2b8','#0b3d91','#1e7e34','#c82333','#004085','#d6d8db','#e2e3e5','#117a8b','#d4a017']}]},
        options: {responsive:true, plugins:{legend:{position:'right'}}}
      });
    }
    const elDir = document.getElementById('chart-direction');
    if (elDir) {
      const labels = Object.keys(stats.byDirection);
      new Chart(elDir, {
        type: 'bar',
        data: {labels, datasets: [{label:'Missions', data: labels.map(l => stats.byDirection[l].count), backgroundColor:'#0b3d91'}]},
        options: {responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}}}
      });
    }
    const elMois = document.getElementById('chart-mois');
    if (elMois) {
      const labels = Object.keys(stats.byMois).sort();
      new Chart(elMois, {
        type: 'line',
        data: {labels, datasets: [{label: 'Missions par mois', data: labels.map(l => stats.byMois[l]),
          borderColor:'#d4a017', backgroundColor:'rgba(212,160,23,.2)', fill:true, tension:.3}]},
        options: {responsive:true, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}}}
      });
    }
    const elVeh = document.getElementById('chart-vehicules');
    if (elVeh) {
      const demandes = Scope.demandesVehicules();
      const byStatut = {};
      demandes.forEach(d => { byStatut[d.statut] = (byStatut[d.statut] || 0) + 1; });
      new Chart(elVeh, {
        type: 'bar',
        data: {labels: Object.keys(byStatut), datasets: [{label:'Demandes', data: Object.values(byStatut), backgroundColor:'#117a8b'}]},
        options: {responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}}}
      });
    }
  },

  resetDemo() {
    if (!Utils.confirm('Réinitialiser ?')) return;
    API.reset();
    Utils.toast('Données réinitialisées', 'success');
    setTimeout(() => Auth.logout(), 800);
  },

  exportComplet() {
    try {
      const wb = XLSX.utils.book_new();
      const feuilles = [
        {nom:'Missions',         data: Excel.missionsVersLignes()},
        {nom:'Demandes vehicules',data: Excel.demandesVehiculesVersLignes()},
        {nom:'Parc auto',        data: Excel.parcAutoVersLignes()},
        {nom:'Agents',           data: Excel.agentsVersLignes()},
        {nom:'Directions',       data: Excel.directionsVersLignes()},
        {nom:'Destinations',     data: Excel.destinationsVersLignes()},
        {nom:'Validations',      data: Excel.validationsVersLignes()},
        {nom:'Statistiques',     data: Excel.statistiquesVersLignes()},
        {nom:'Comptes',          data: Actions.comptesVersLignes()},
        {nom:'Roles',            data: Actions.rolesVersLignes()}
      ];
      let added = 0;
      feuilles.forEach(f => {
        if (!f.data.length) return;
        const ws = XLSX.utils.json_to_sheet(f.data);
        const cols = Object.keys(f.data[0]).map(k => ({wch: Math.min(40, Math.max(k.length + 2, ...f.data.map(r => String(r[k] ?? '').length + 2)))}));
        ws['!cols'] = cols;
        XLSX.utils.book_append_sheet(wb, ws, f.nom.substring(0, 31));
        added++;
      });
      if (!added) { Utils.toast('Aucune donnée', 'warning'); return; }
      const fname = `export_complet_${new Date().toISOString().substring(0,10)}.xlsx`;
      XLSX.writeFile(wb, fname);
      Utils.toast('Export complet : ' + fname, 'success');
    } catch (e) { Utils.toast('Erreur : ' + e.message, 'error'); }
  }
};