/* =========================================
   API - COMMUNICATION AVEC LE BACK-END
   ========================================= */
const API_URL = '/api';
let cacheUsers = [];

const API = {
  loadAll: async function() {
    try {
      const r = await fetch(`${API_URL}/load-all`);
      if (!r.ok) throw new Error('Erreur réseau');
      cacheUsers = await r.json();
      return true;
    } catch (error) {
      throw new Error("Impossible de contacter le serveur. Vérifiez que le Back-end est démarré.");
    }
  },

  getUser: function(login) {
    return cacheUsers.find(u => u.login === login);
  },

  getStats: async function() {
    try {
      const r = await fetch(`${API_URL}/stats`);
      return await r.json();
    } catch (e) {
      console.error(e);
      return { totalMissions: 0, agentsActifs: 0, vehiculesDispo: 0, demandesVehicules: 0, validations: 0 };
    }
  },

  getMissions: async function() {
    try { const r = await fetch(`${API_URL}/missions`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getAgents: async function() {
    try { const r = await fetch(`${API_URL}/agents`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getVehicules: async function() {
    try { const r = await fetch(`${API_URL}/vehicules`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getDemandesVehicules: async function() {
    try { const r = await fetch(`${API_URL}/demandes-vehicules`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getValidations: async function() {
    try { const r = await fetch(`${API_URL}/validations`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getDirections: async function() {
    try { const r = await fetch(`${API_URL}/directions`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getDestinations: async function() {
    try { const r = await fetch(`${API_URL}/destinations`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  getRoles: async function() {
    try { const r = await fetch(`${API_URL}/roles`); return await r.json(); }
    catch (e) { console.error(e); return []; }
  },

  updateUser: async function(id, data) { return true; }
};

window.API = API;