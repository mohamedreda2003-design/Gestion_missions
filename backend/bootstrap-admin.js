const crypto = require('crypto');
const db = require('./db');

async function main() {
  const login = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!login || login.length < 3 || !password || password.length < 12) {
    throw new Error('Définissez ADMIN_LOGIN (3 caractères minimum) et ADMIN_PASSWORD (12 caractères minimum).');
  }
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users');
  if (total > 0) throw new Error('La table users contient déjà un compte; création initiale refusée.');
  const [roles] = await db.query("SELECT code FROM roles WHERE code = 'ADMIN' AND actif = 1");
  if (!roles.length) throw new Error("Le rôle ADMIN n'existe pas. Exécutez d'abord le seed des rôles.");
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  await db.query('INSERT INTO users (login, password_hash, role, actif) VALUES (?, ?, ?, 1)', [login, hash, 'ADMIN']);
  console.log(`Compte administrateur « ${login} » créé.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
