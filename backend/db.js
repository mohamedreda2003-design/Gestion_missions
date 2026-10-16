/* =====================================================
   CONNEXION MYSQL
   ===================================================== */
const MySQL = require('mysql2/promise');

function requiredEnv(...names) {
  const value = names.map(name => process.env[name]).find(item => item !== undefined && item !== '');
  if (value === undefined) throw new Error(`Variable MySQL manquante : ${names[0]}`);
  return value;
}

const pool = MySQL.createPool({
  host: requiredEnv('DB_HOST', 'MYSQLHOST'),
  user: requiredEnv('DB_USER', 'MYSQLUSER'),
  password: requiredEnv('DB_PASSWORD', 'MYSQLPASSWORD'),
  database: requiredEnv('DB_NAME', 'MYSQLDATABASE'),
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
});

module.exports = pool;
