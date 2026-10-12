/* =====================================================
   4. UTILITAIRES
   ===================================================== */
const Utils = {
  formatDate(d) {
    if (!d) return '—';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, j] = d.split('-');
      return `${j}/${m}/${y}`;
    }
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric'});
  },
  formatDateTime(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt)) return d;
    return dt.toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  },
  toLocalInput(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const pad = (n) => String(n).padStart(2,'0');
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  },
  excelDateToISO(val) {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number' && val > 0 && val < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + val * 86400000);
      if (isNaN(d)) return '';
      const pad = (n) => String(n).padStart(2,'0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
    }
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);
    let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let j = m[1].padStart(2,'0'), mo = m[2].padStart(2,'0'), y = m[3];
      if (y.length === 2) y = '20' + y;
      return `${y}-${mo}-${j}`;
    }
    m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    }
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const pad = (n) => String(n).padStart(2,'0');
      return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
    }
    return '';
  },
  formatMoney(v) {
    const n = Number(v || 0);
    return n.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' MAD';
  },
  dureeJours(dateDepart, dateRetour) {
    if (!dateDepart || !dateRetour) return 0;
    const d1 = new Date(dateDepart), d2 = new Date(dateRetour);
    if (isNaN(d1) || isNaN(d2)) return 0;
    const diffMs = d2 - d1;
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  },
  distanceEntre(lieuDepart, lieuArrivee) {
    const destArrivee = API.getDestinationByLibelle(lieuArrivee);
    const destDepart = API.getDestinationByLibelle(lieuDepart);
    if (!destArrivee) return 0;
    if (!destDepart || (lieuDepart || '').toLowerCase() === 'rabat') return destArrivee.distanceRef ?? 0;
    return Math.abs((destArrivee.distanceRef ?? 0) - (destDepart.distanceRef ?? 0));
  },
  esc(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  },
  destsLabel(d) {
    if (!d) return '—';
    const arr = Array.isArray(d.destinations) && d.destinations.length
      ? d.destinations
      : (d.destination ? [d.destination] : []);
    return arr.length ? arr.join(' → ') : '—';
  },
  personnesList(d) {
    if (!d) return [];
    if (Array.isArray(d.personnesTransportees)) {
      return d.personnesTransportees.map(p => String(p || '').trim()).filter(Boolean);
    }
    return [];
  },
  statutCode(m) { return API.getStatutById(m.idStatut)?.code || '?'; },
  statutLibelle(m) { return API.getStatutById(m.idStatut)?.libelle || '?'; },
  badgeStatut(m) {
    const code = this.statutCode(m);
    return `<span class="badge badge-${code}">${this.esc(this.statutLibelle(m))}</span>`;
  },
  badgeStatutVehicule(code) {
    const s = API.getStatutVehiculeByCode(code);
    return `<span class="badge badge-${code}">${this.esc(s?.libelle || code)}</span>`;
  },
  directionLibelle(id) { return API.getDirection(id)?.libelle || '—'; },
  agentNom(id) { const a = API.getAgent(id); return a ? `${a.prenom} ${a.nom}` : '—'; },
  vehiculeLabel(id) {
    if (!id) return '—';
    const v = API.getVehicule(id);
    return v ? `${v.immatriculation} (${v.marque} ${v.modele})` : '—';
  },
  demandeurCell(idAgent, options = {}) {
    const a = idAgent ? API.getAgent(idAgent) : null;
    if (!a) return '<span class="text-muted">—</span>';
    const dir = API.getDirection(a.idDirection);
    const showDirection = options.showDirection !== false;
    const showMatricule = options.showMatricule !== false;
    const initiales = ((a.prenom||'').charAt(0) + (a.nom||'').charAt(0)).toUpperCase() || '?';
    return `
      <div class="demandeur-cell">
        <div class="demandeur-avatar" title="${this.esc(a.prenom + ' ' + a.nom)}">${this.esc(initiales)}</div>
        <div class="demandeur-info">
          <div class="demandeur-nom">${this.esc(a.prenom + ' ' + a.nom)}</div>
          <div class="demandeur-meta">
            ${showMatricule && a.matricule ? this.esc(a.matricule) : ''}
            ${showMatricule && a.matricule && showDirection && dir ? ' • ' : ''}
            ${showDirection && dir ? this.esc(dir.codeDirection) : ''}
            ${!showMatricule && !showDirection && a.fonction ? this.esc(a.fonction) : ''}
          </div>
        </div>
      </div>`;
  },
  demandeurHighlight(idAgent, titre = 'Demandeur') {
    const a = idAgent ? API.getAgent(idAgent) : null;
    if (!a) return '';
    const dir = API.getDirection(a.idDirection);
    const initiales = ((a.prenom||'').charAt(0) + (a.nom||'').charAt(0)).toUpperCase() || '?';
    return `
      <div class="demandeur-highlight">
        <div class="dh-avatar">${this.esc(initiales)}</div>
        <div class="dh-info">
          <div class="dh-name">👤 ${this.esc(titre)} : ${this.esc(a.prenom + ' ' + a.nom)}</div>
          <div class="dh-meta">
            ${a.matricule ? `<strong>Matricule :</strong> ${this.esc(a.matricule)}` : ''}
            ${a.fonction ? ` &nbsp;•&nbsp; <strong>Fonction :</strong> ${this.esc(a.fonction)}` : ''}
            ${a.grade ? ` &nbsp;•&nbsp; <strong>Grade :</strong> ${this.esc(a.grade)}` : ''}
            ${dir ? `<br><strong>Direction :</strong> ${this.esc(dir.codeDirection)} — ${this.esc(dir.libelle)}` : ''}
            ${a.telephone ? ` &nbsp;•&nbsp; <strong>Tél :</strong> ${this.esc(a.telephone)}` : ''}
            ${a.email ? ` &nbsp;•&nbsp; <strong>Email :</strong> ${this.esc(a.email)}` : ''}
          </div>
        </div>
      </div>`;
  },
  toast(msg, type='success', dur=3500) {
    let c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<strong>${type==='error'?'✗':type==='warning'?'⚠':type==='info'?'ℹ':'✓'}</strong> ${this.esc(msg)}`;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, dur);
  },
  confirm(msg) { return window.confirm(msg); },
  scopeBanner() {
    const info = Scope.label();
    if (!info.text) return '';
    return `<div class="scope-banner ${info.cls}"><span class="scope-icon">${info.icon}</span><span>${info.text}</span></div>`;
  },
  datalist(id, values) {
    if (!values || !values.length) return `<datalist id="${id}"></datalist>`;
    return `<datalist id="${id}">${values.map(v => `<option value="${Utils.esc(v)}"></option>`).join('')}</datalist>`;
  }
};