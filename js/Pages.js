/* =========================================
   CONTENU DES PAGES
   ========================================= */

// Utilitaire pour générer une table vide avec entêtes
function emptyTable() {
  return `<tr><td style="padding: 25px; text-align: center; color: #94a3b8;">Chargement...</td></tr>`;
}

// Utilitaire pour générer un tableau générique
function genericTable(headers) {
  return `
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          ${headers.map(h => `<th style="padding: 12px; text-align: left; color: #64748b; font-size: 13px; text-transform: uppercase;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody id="table-tbody">${emptyTable()}</tbody>
    </table>
  `;
}

const Pages = {
  // --- TABLEAU DE BORD ---
  dashboard: function() {
    return `
      <h2 style="margin: 0 0 20px 0; color: #1e3a8a;">Tableau de bord</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid #3b82f6;">
          <h3 style="margin: 0 0 10px 0; color: #666; font-size: 13px; text-transform: uppercase;">Total Missions</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a;" id="stat-missions">--</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid #10b981;">
          <h3 style="margin: 0 0 10px 0; color: #666; font-size: 13px; text-transform: uppercase;">Agents Actifs</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a;" id="stat-agents">--</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid #eab308;">
          <h3 style="margin: 0 0 10px 0; color: #666; font-size: 13px; text-transform: uppercase;">Véhicules</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a;" id="stat-vehicules">--</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid #8b5cf6;">
          <h3 style="margin: 0 0 10px 0; color: #666; font-size: 13px; text-transform: uppercase;">Demandes Véhicules</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a;" id="stat-demandes">--</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0; color: #666; font-size: 13px; text-transform: uppercase;">Validations</h3>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a;" id="stat-validations">--</p>
        </div>
      </div>
    `;
  },

  // --- MISSIONS ---
  missions: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Gestion des Missions</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouvelle Mission</button>
      </div>
      ${genericTable(['ID', 'Agent', 'Destination', 'Statut', 'Date'])}
    `;
  },

  // --- AGENTS ---
  agents: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Gestion des Agents</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouvel Agent</button>
      </div>
      ${genericTable(['ID', 'Nom', 'Prénom', 'Direction', 'Statut'])}
    `;
  },

  // --- PARC AUTO ---
  parc_auto: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Parc Automobile</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouveau Véhicule</button>
      </div>
      ${genericTable(['ID', 'Immatriculation', 'Marque', 'Modèle', 'Statut'])}
    `;
  },

  // --- DEMANDES VÉHICULES ---
  demandes_vehicules: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Demandes de Véhicules</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouvelle Demande</button>
      </div>
      ${genericTable(['ID', 'Agent', 'Véhicule', 'Date début', 'Date fin', 'Statut'])}
    `;
  },

  // --- VALIDATIONS ---
  validations: function() {
    return `
      <h2 style="margin: 0 0 20px 0; color: #1e3a8a;">Validations</h2>
      ${genericTable(['ID', 'Mission', 'Validateur', 'Date', 'Statut', 'Commentaire'])}
    `;
  },

  // --- DIRECTIONS ---
  directions: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Directions</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouvelle Direction</button>
      </div>
      ${genericTable(['ID', 'Code', 'Libellé', 'Responsable'])}
    `;
  },

  // --- DESTINATIONS ---
  destinations: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Destinations</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouvelle Destination</button>
      </div>
      ${genericTable(['ID', 'Ville', 'Pays', 'Distance'])}
    `;
  },

  // --- STATISTIQUES ---
  statistiques: function() {
    return `
      <h2 style="margin: 0 0 20px 0; color: #1e3a8a;">Statistiques</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
          <div style="font-size: 40px; color: #3b82f6; margin-bottom: 10px;">📋</div>
          <h3 style="margin: 0; color: #666; font-size: 13px;">Total Missions</h3>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e3a8a;" id="s-missions">--</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
          <div style="font-size: 40px; color: #10b981; margin-bottom: 10px;">👥</div>
          <h3 style="margin: 0; color: #666; font-size: 13px;">Agents Actifs</h3>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e3a8a;" id="s-agents">--</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
          <div style="font-size: 40px; color: #eab308; margin-bottom: 10px;">🚗</div>
          <h3 style="margin: 0; color: #666; font-size: 13px;">Véhicules</h3>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e3a8a;" id="s-vehicules">--</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
          <div style="font-size: 40px; color: #8b5cf6; margin-bottom: 10px;">🚙</div>
          <h3 style="margin: 0; color: #666; font-size: 13px;">Demandes Véhicules</h3>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e3a8a;" id="s-demandes">--</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;">
          <div style="font-size: 40px; color: #ef4444; margin-bottom: 10px;">✅</div>
          <h3 style="margin: 0; color: #666; font-size: 13px;">Validations</h3>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e3a8a;" id="s-validations">--</p>
        </div>
      </div>
    `;
  },

  // --- COMPTES (UTILISATEURS) ---
  comptes: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Gestion des Comptes</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouveau Compte</button>
      </div>
      ${genericTable(['ID', 'Login', 'Rôle', 'Agent', 'Actif'])}
    `;
  },

  // --- RÔLES ---
  roles: function() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a;">Gestion des Rôles</h2>
        <button style="padding: 10px 15px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer;">+ Nouveau Rôle</button>
      </div>
      ${genericTable(['ID', 'Code', 'Libellé', 'Description'])}
    `;
  }
};