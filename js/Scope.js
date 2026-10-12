/* =====================================================
   3. SCOPE
   ===================================================== */
const Scope = (() => {
  const ROLES_GLOBAUX = ['ADMIN','DAF','DAAJ','SSPA'];
  const ROLES_DIRECTION = ['CHEF_SERVICE','DIRECTEUR'];
  const isAdmin = () => Auth.session()?.role === 'ADMIN';
  const isDAF = () => Auth.session()?.role === 'DAF';
  const isDAAJ = () => Auth.session()?.role === 'DAAJ';
  const isSSPA = () => Auth.session()?.role === 'SSPA';
  const isDirecteur = () => Auth.session()?.role === 'DIRECTEUR';
  const isChefService = () => Auth.session()?.role === 'CHEF_SERVICE';
  const isAgent = () => Auth.session()?.role === 'AGENT';
  const isGlobalView = () => ROLES_GLOBAUX.includes(Auth.session()?.role);
  const isDirectionView = () => ROLES_DIRECTION.includes(Auth.session()?.role);

  function myDirectionId() { const a = Auth.currentAgent(); return a ? a.idDirection : null; }
  function directionTree(idDirection) {
    if (!idDirection) return [];
    const ids = [idDirection];
    const dirs = API.getDirections();
    let added = true;
    while (added) {
      added = false;
      dirs.forEach(d => {
        if (d.idDirectionParent && ids.includes(d.idDirectionParent) && !ids.includes(d.idDirection)) {
          ids.push(d.idDirection); added = true;
        }
      });
    }
    return ids;
  }
  function visibleDirectionIds() {
    if (isGlobalView()) return null;
    const dirId = myDirectionId();
    if (!dirId) return [];
    if (isDirectionView()) return directionTree(dirId);
    return [dirId];
  }
  function missions() {
    const all = API.getMissions();
    if (isGlobalView()) return all;
    const agent = Auth.currentAgent();
    if (!agent) return [];
    if (isDirectionView()) {
      const dirIds = visibleDirectionIds() || [];
      return all.filter(m => dirIds.includes(m.idDirection));
    }
    return all.filter(m => m.idDemandeur === agent.idAgent || (m.participants || []).some(p => p.idAgent === agent.idAgent));
  }
  function demandesVehicules() {
    const all = API.getDemandesVehicules();
    if (isGlobalView()) return all;
    const agent = Auth.currentAgent();
    if (!agent) return [];
    if (isDirectionView()) {
      const dirIds = visibleDirectionIds() || [];
      return all.filter(d => dirIds.includes(d.idDirection));
    }
    return all.filter(d => d.idDemandeur === agent.idAgent || d.idChauffeur === agent.idAgent);
  }
  function agents() {
    const all = API.getAgents();
    if (isGlobalView()) return all;
    const agent = Auth.currentAgent();
    if (!agent) return [];
    if (isDirectionView()) {
      const dirIds = visibleDirectionIds() || [];
      return all.filter(a => dirIds.includes(a.idDirection));
    }
    return all.filter(a => a.idAgent === agent.idAgent);
  }
  function directions() {
    const all = API.getDirections();
    if (isGlobalView()) return all;
    const dirIds = visibleDirectionIds() || [];
    return all.filter(d => dirIds.includes(d.idDirection));
  }
  function destinations() { return API.getDestinations(); }
  function validationsEnAttente() {
    const a = Auth.currentAgent();
    return a ? API.getValidationsEnAttentePour(a.idAgent) : [];
  }
  function getStatistiques() {
    const ms = missions();
    const byStatut = {}, byDirection = {}, byMois = {};
    let totalMontant = 0, totalJours = 0;
    ms.forEach(m => {
      const statut = API.getStatutById(m.idStatut)?.code || '?';
      byStatut[statut] = (byStatut[statut] || 0) + 1;
      const dir = API.getDirection(m.idDirection)?.libelle || '?';
      byDirection[dir] = byDirection[dir] || {count:0, montant:0, jours:0};
      byDirection[dir].count++;
      byDirection[dir].montant += m.montantTotal || 0;
      const jours = Utils.dureeJours(m.dateDepart, m.dateRetour);
      byDirection[dir].jours += jours;
      totalJours += jours;
      const mois = (m.dateDepart || '').substring(0,7);
      byMois[mois] = (byMois[mois] || 0) + 1;
      totalMontant += m.montantTotal || 0;
    });
    return {total: ms.length, byStatut, byDirection, byMois, totalMontant, totalJours};
  }

  function vehiculesEnMission() {
    const demandes = demandesVehicules().filter(d => d.statut === 'AFFECTE' && d.idVehicule);
    return demandes.map(d => {
      const v = API.getVehicule(d.idVehicule);
      if (!v) return null;
      const demandeur = API.getAgent(d.idDemandeur);
      const chauffeur = d.idChauffeur ? API.getAgent(d.idChauffeur) : null;
      return {
        vehicule: v,
        demande: d,
        demandeur,
        chauffeur,
        dateDepart: d.dateDepart,
        dateRetour: d.dateRetour,
        destination: Utils.destsLabel(d)
      };
    }).filter(Boolean);
  }

  function chauffeursEnSortie() {
    const demandes = demandesVehicules().filter(d => d.statut === 'AFFECTE' && d.idChauffeur);
    return demandes.map(d => {
      const a = API.getAgent(d.idChauffeur);
      if (!a) return null;
      const v = d.idVehicule ? API.getVehicule(d.idVehicule) : null;
      return {
        chauffeur: a,
        vehicule: v,
        demande: d,
        dateDepart: d.dateDepart,
        dateRetour: d.dateRetour,
        destination: Utils.destsLabel(d)
      };
    }).filter(Boolean);
  }

  function vehiculesParc() {
    const all = API.getVehicules().filter(v => v.actif !== false);
    if (isGlobalView()) return all;
    const dirIds = visibleDirectionIds() || [];
    return all.filter(v => dirIds.includes(v.idDirection));
  }

  function label() {
    const r = Auth.session()?.role;
    if (r === 'ADMIN') return {cls:'scope-global', icon:'🌐', text:'Vue <strong>Administrateur</strong> — toutes les données'};
    if (r === 'DAF') return {cls:'scope-global', icon:'🌐', text:'Vue <strong>DAF</strong> — toutes les données'};
    if (r === 'DAAJ') return {cls:'scope-global', icon:'⚖️', text:'Vue <strong>DAAJ</strong> — validation des missions + supervision du SSPA'};
    if (r === 'SSPA') return {cls:'scope-global', icon:'📋', text:'Vue <strong>SSPA</strong> — établissement des ordres de mission et gestion du parc auto'};
    if (r === 'DIRECTEUR' || r === 'CHEF_SERVICE') {
      const d = API.getDirection(myDirectionId());
      const role = r === 'DIRECTEUR' ? 'Directeur' : 'Chef de service';
      const dirLbl = d ? `${d.codeDirection} — ${d.libelle}` : '—';
      const count = (visibleDirectionIds() || []).length;
      return {cls: 'scope-direction', icon: '🏢',
        text: `Vue <strong>${role}</strong> — périmètre : ${Utils.esc(dirLbl)} (${count} direction${count>1?'s':''})`};
    }
    if (r === 'AGENT') return {cls:'scope-self', icon:'👤', text:'Vue <strong>Agent</strong> — vos missions, demandes de véhicules et votre profil'};
    return {cls:'', icon:'', text:''};
  }
  return {isAdmin, isDAF, isDAAJ, isSSPA, isDirecteur, isChefService, isAgent,
    isGlobalView, isDirectionView, myDirectionId, visibleDirectionIds,
    missions, demandesVehicules, agents, directions, destinations,
    validationsEnAttente, getStatistiques, label,
    vehiculesEnMission, chauffeursEnSortie, vehiculesParc};
})();