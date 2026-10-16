/* =========================================
   APPLICATION - BARRE HORIZONTALE AVEC TOUS LES MODULES
   ========================================= */

// --- TOUS LES MODULES DISPONIBLES ---
const ALL_MODULES = [
  { key: 'dashboard',           label: 'Tableau de bord',    icon: '📊' },
  { key: 'demandes_vehicules',  label: 'Demandes véhicules', icon: '🚙' },
  { key: 'validations',         label: 'Validations',        icon: '✅' },
  { key: 'missions',            label: 'Missions',           icon: '📋' },
  { key: 'parc_auto',           label: 'Parc auto',          icon: '🚗' },
  { key: 'agents',              label: 'Agents',             icon: '👥' },
  { key: 'directions',          label: 'Directions',         icon: '🏢' },
  { key: 'destinations',        label: 'Destinations',       icon: '📍' },
  { key: 'statistiques',        label: 'Statistiques',       icon: '📈' },
  { key: 'comptes',             label: 'Comptes',            icon: '👤' },
  { key: 'roles',               label: 'Rôles',              icon: '🔑' }
];

const App = {
  currentPage: 'dashboard',

  init: async function() {
    try {
      const session = await Auth.restore();
      if (session) this.renderLayout(session);
      else this.renderLogin();
    } catch {
      this.renderLogin();
    }
  },

  // --- ÉCRAN DE CONNEXION ---
  renderLogin: function() {
    const root = document.getElementById('root');
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #1e3a8a; font-family: 'Segoe UI', sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 10px; width: 100%; max-width: 420px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="width: 80px; height: 80px; background: #eab308; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto; color: #1e3a8a; font-size: 32px; font-weight: bold;">GM</div>
            <h2 style="color: #1e3a8a; margin: 15px 0 5px;">Gestion des Ordres de Mission</h2>
            <p style="color: #666; font-size: 14px; margin: 0;">Administration Publique — Accès sécurisé</p>
          </div>
          <form id="loginForm">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Identifiant *</label>
              <input type="text" id="login" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Mot de passe *</label>
              <input type="password" id="password" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;">
            </div>
            <button type="submit" style="width: 100%; padding: 12px; background: #1e3a8a; color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer;">Se connecter</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const login = document.getElementById('login').value.trim();
      const password = document.getElementById('password').value;
      try {
        await Auth.login(login, password);
        window.showToast('Connexion réussie', 'success');
        App.renderLayout(Auth.session());
      } catch (error) {
        window.showToast(error.message, 'error');
      }
    });
  },

  // --- LAYOUT PRINCIPAL AVEC BARRE HORIZONTALE ---
  renderLayout: function(session) {
    const root = document.getElementById('root');
    
    const navItems = ALL_MODULES.map(m => `
      <a href="#" data-page="${m.key}" onclick="App.navigate('${m.key}'); return false;"
         class="nav-link" style="padding: 10px 15px; color: white; text-decoration: none; border-radius: 5px; font-size: 14px; white-space: nowrap; transition: background 0.2s;">
        ${m.label}
      </a>
    `).join('');

    root.innerHTML = `
      <div style="display: flex; flex-direction: column; min-height: 100vh; font-family: 'Segoe UI', sans-serif; background: #f3f4f6;">
        
        <!-- BARRE DE NAVIGATION HORIZONTALE -->
        <header style="background: #1e3a8a; color: white; display: flex; align-items: center; padding: 10px 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          
          <!-- Logo + Titre -->
          <div style="display: flex; align-items: center; gap: 12px; margin-right: 30px;">
            <div style="width: 45px; height: 45px; background: #eab308; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #1e3a8a; font-size: 18px; font-weight: bold;">GM</div>
            <div>
              <div style="font-weight: bold; font-size: 16px;">Gestion des Missions</div>
              <div style="font-size: 11px; color: #cbd5e1;">Administration Publique</div>
            </div>
          </div>

          <!-- Navigation -->
          <nav style="flex: 1; display: flex; gap: 5px; overflow-x: auto; align-items: center;">
            ${navItems}
          </nav>

          <!-- Profil + Déconnexion -->
          <div style="display: flex; align-items: center; gap: 15px; margin-left: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 35px; height: 35px; background: #eab308; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #1e3a8a; font-weight: bold;">
                ${session.login.charAt(0).toUpperCase()}
              </div>
              <div style="font-size: 13px;">
                <div style="font-weight: bold;">${session.login}</div>
                <div style="color: #cbd5e1; font-size: 11px;">${session.role}</div>
              </div>
            </div>
            <button onclick="Auth.logout()" style="padding: 8px 15px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">Déconnexion</button>
          </div>
        </header>

        <!-- CONTENU PRINCIPAL -->
        <main style="flex: 1; padding: 25px; overflow-y: auto;" id="page-content"></main>
      </div>

      <style>
        .nav-link:hover { background: #3b82f6 !important; }
        .nav-link.active { background: #3b82f6 !important; font-weight: bold; }
        header nav::-webkit-scrollbar { height: 4px; }
        header nav::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 2px; }
      </style>
    `;

    this.navigate('dashboard');
  },

  // --- NAVIGATION ---
  navigate: async function(pageName) {
    this.currentPage = pageName;
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv || !Pages[pageName]) return;

    // Mettre à jour le lien actif
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    contentDiv.innerHTML = Pages[pageName]();

    // Charger les données selon la page
    const loaders = {
      'dashboard':          () => this.loadDashboardData(),
      'missions':           () => this.loadTableData('missions'),
      'agents':             () => this.loadTableData('agents'),
      'parc_auto':          () => this.loadTableData('vehicules'),
      'vehicules':          () => this.loadTableData('vehicules'),
      'demandes_vehicules': () => this.loadTableData('demandes_vehicules'),
      'validations':        () => this.loadTableData('validations'),
      'directions':         () => this.loadTableData('directions'),
      'destinations':       () => this.loadTableData('destinations'),
      'comptes':            () => this.loadTableData('comptes'),
      'roles':              () => this.loadTableData('roles'),
      'statistiques':       () => this.loadStats()
    };
    if (loaders[pageName]) await loaders[pageName]();
  },

  // --- CHARGEMENT DES STATS DU DASHBOARD ---
  loadDashboardData: async function() {
    const stats = await API.getStats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-missions', stats.totalMissions);
    set('stat-agents', stats.agentsActifs);
    set('stat-vehicules', stats.vehiculesDispo);
    set('stat-demandes', stats.demandesVehicules);
    set('stat-validations', stats.validations);
  },

  // --- CHARGEMENT GÉNÉRIQUE DES TABLES ---
  loadTableData: async function(tableKey) {
    const tbody = document.getElementById('table-tbody');
    if (!tbody) return;

    let data = [];
    try {
      switch(tableKey) {
        case 'missions':           data = await API.getMissions(); break;
        case 'agents':             data = await API.getAgents(); break;
        case 'vehicules':          data = await API.getVehicules(); break;
        case 'demandes_vehicules': data = await API.getDemandesVehicules(); break;
        case 'validations':        data = await API.getValidations(); break;
        case 'directions':         data = await API.getDirections(); break;
        case 'destinations':       data = await API.getDestinations(); break;
        case 'comptes':            data = await API.loadAll() ? await fetch('/api/load-all').then(r => r.json()) : []; break;
        case 'roles':              data = await API.getRoles(); break;
      }
    } catch (e) { console.error(e); }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="padding: 25px; text-align: center; color: #94a3b8;">Aucune donnée disponible</td></tr>';
      return;
    }

    // Générer les colonnes dynamiquement
    const columns = Object.keys(data[0]);
    tbody.innerHTML = data.map(row => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        ${columns.map(col => `<td style="padding: 10px 12px; font-size: 13px;">${row[col] !== null ? row[col] : '-'}</td>`).join('')}
      </tr>
    `).join('');
  },

  // --- CHARGEMENT DES STATISTIQUES ---
  loadStats: async function() {
    const stats = await API.getStats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('s-missions', stats.totalMissions);
    set('s-agents', stats.agentsActifs);
    set('s-vehicules', stats.vehiculesDispo);
    set('s-demandes', stats.demandesVehicules);
    set('s-validations', stats.validations);
  }
};
