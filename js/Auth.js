/* =========================================
   AUTHENTIFICATION
   ========================================= */
const Auth = (() => {
  const KEY = 'gm_session';
  return {
    async login(login, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Connexion impossible. Vérifiez vos identifiants.');
      const s = data.user;
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    },
    async logout() {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } finally {
      localStorage.removeItem(KEY);
      window.location.reload();
      }
    },
    session() {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      try { return JSON.parse(s); } catch { return null; }
    },
    async restore() {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) { localStorage.removeItem(KEY); return null; }
      const data = await response.json();
      localStorage.setItem(KEY, JSON.stringify(data.user));
      return data.user;
    }
  };
})();
