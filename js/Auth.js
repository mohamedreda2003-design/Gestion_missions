/* =========================================
   AUTHENTIFICATION
   ========================================= */
const Auth = (() => {
  const KEY = 'gm_session';
  return {
    async login(login, password) {
      try { await API.loadAll(); }
      catch (e) { throw new Error("Impossible de contacter le serveur."); }
      
      const u = API.getUser(login);
      if (!u || u.password !== password) throw new Error('Identifiants invalides');
      if (u.actif == 0) throw new Error('Compte désactivé');
      
      const s = { login: u.login, role: u.role, idAgent: u.idAgent, idUtilisateur: u.idUtilisateur };
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    },
    logout() {
      localStorage.removeItem(KEY);
      window.location.reload();
    },
    session() {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      try { return JSON.parse(s); } catch { return null; }
    }
  };
})();