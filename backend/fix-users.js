@'
const pool = require('./db');

async function fixUsers() {
  console.log('Correction des utilisateurs...\n');
  try {
    await pool.query("SET NAMES utf8mb4");

    await pool.query(`UPDATE users SET role='DAAJ', idAgent=11 WHERE login='daaj'`);
    console.log('  OK daaj -> DAAJ');

    await pool.query(`UPDATE users SET idAgent=12 WHERE login='sspa'`);
    console.log('  OK sspa -> agent 12');

    const [daf] = await pool.query(`SELECT * FROM users WHERE login='f.alaoui'`);
    if (daf.length === 0) {
      await pool.query(`INSERT INTO users (login, password, idAgent, role, actif) VALUES ('f.alaoui', 'demo', 8, 'DAF', 1)`);
      console.log('  OK f.alaoui cree');
    } else {
      await pool.query(`UPDATE users SET role='DAF', idAgent=8 WHERE login='f.alaoui'`);
      console.log('  OK f.alaoui -> DAF');
    }

    const [dir] = await pool.query(`SELECT * FROM users WHERE login='k.benani'`);
    if (dir.length === 0) {
      await pool.query(`INSERT INTO users (login, password, idAgent, role, actif) VALUES ('k.benani', 'demo', 1, 'DIRECTEUR', 1)`);
      console.log('  OK k.benani cree');
    } else {
      await pool.query(`UPDATE users SET role='DIRECTEUR', idAgent=1 WHERE login='k.benani'`);
      console.log('  OK k.benani -> DIRECTEUR');
    }

    const [ag] = await pool.query(`SELECT * FROM users WHERE login='y.tazi'`);
    if (ag.length === 0) {
      await pool.query(`INSERT INTO users (login, password, idAgent, role, actif) VALUES ('y.tazi', 'demo', 3, 'AGENT', 1)`);
      console.log('  OK y.tazi cree');
    } else {
      await pool.query(`UPDATE users SET role='AGENT', idAgent=3 WHERE login='y.tazi'`);
      console.log('  OK y.tazi -> AGENT');
    }

    const [chef] = await pool.query(`SELECT * FROM users WHERE login='s.elfassi'`);
    if (chef.length === 0) {
      await pool.query(`INSERT INTO users (login, password, idAgent, role, actif) VALUES ('s.elfassi', 'demo', 2, 'CHEF_SERVICE', 1)`);
      console.log('  OK s.elfassi cree');
    } else {
      await pool.query(`UPDATE users SET role='CHEF_SERVICE', idAgent=2 WHERE login='s.elfassi'`);
      console.log('  OK s.elfassi -> CHEF_SERVICE');
    }

    console.log('\nResultat final :');
    const [final] = await pool.query("SELECT idUtilisateur, login, role, idAgent FROM users ORDER BY idUtilisateur");
    final.forEach(u => console.log(`   #${u.idUtilisateur} ${u.login} -> ${u.role} (agent ${u.idAgent})`));

    console.log('\nTermine !');
    process.exit(0);
  } catch (e) {
    console.error('Erreur :', e.message);
    process.exit(1);
  }
}

fixUsers();
'@ | Out-File -Encoding UTF8 fix-users.js