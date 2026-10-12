const pool = require('./db');

async function fixUsers() {
  console.log('🔧 Correction des utilisateurs...\n');

  try {
    await pool.query("SET NAMES utf8mb4");

    // 1. Voir l'état actuel
    const [users] = await pool.query("SELECT idUtilisateur, login, role, idAgent FROM users");
    console.log('État actuel :');
    users.forEach(u => console.log(`   #${u.idUtilisateur} ${u.login} → ${u.role} (idAgent: ${u.idAgent})`));
    console.log('');

    // 2. Voir les agents disponibles
    const [agents] = await pool.query("SELECT idAgent, matricule, nom, prenom, fonction FROM agents ORDER BY idAgent");
    console.log('Agents disponibles :');
    agents.forEach(a => console.log(`   #${a.idAgent} ${a.matricule} ${a.prenom} ${a.nom} (${a.fonction})`));
    console.log('');

    // 3. Corriger le rôle du login "daaj" : DIRECTEUR → DAAJ
    await pool.query(
      `UPDATE users SET role='DAAJ', idAgent=11 WHERE login='daaj'`
    );
    console.log('  ✅ Login "daaj" → rôle DAAJ (agent 11 = BERRADA Mounir)');

    // 4. Créer un compte SSPA propre lié à l'agent 12
    await pool.query(
      `UPDATE users SET idAgent=12 WHERE login='sspa'`
    );
    console.log('  ✅ Login "sspa" → idAgent 12 (LAMRANI Sanaa)');

    // 5. Créer un compte DAF propre
    const [daf] = await pool.query(`SELECT * FROM users WHERE login='f.alaoui'`);
    if (daf.length === 0) {
      await pool.query(
        `INSERT INTO users (login, password, idAgent, role, actif) VALUES ('f.alaoui', 'demo', 8, 'DAF', 1)`
      );
      console.log('  ✅ Login "f.alaoui" créé → rôle DAF (agent 8 = ALAOUI Fatima)');
    } else {
      await pool.query(`UPDATE users SET role='DAF', idAgent=8 WHERE login='f.alaoui'`);
      console.log('  ✅ Login "f.alaoui" → rôle DAF');
    }

    // 6. Créer un compte DIRECTEUR propre lié à l'agent 1
    const [dir] = await pool.query(`SELECT * FROM users WHERE login='k.benani'`);
    if (dir.length === 0) {
      await pool.query(
        `INSERT INTO users (login, password, idAgent, role, actif) VALUES ('k.benani', 'demo', 1, 'DIRECTEUR', 1)`
      );
      console.log('  ✅ Login "k.benani" créé → rôle DIRECTEUR (agent 1 = BENANI Karim)');
    } else {
      await pool.query(`UPDATE users SET role='DIRECTEUR', idAgent=1 WHERE login='k.benani'`);
      console.log('  ✅ Login "k.benani" → rôle DIRECTEUR');
    }

    // 7. Créer un compte AGENT propre lié à l'agent 3
    const [ag] = await pool.query(`SELECT * FROM users WHERE login='y.tazi'`);
    if (ag.length === 0) {
      await pool.query(
        `INSERT INTO users (login, password, idAgent, role, actif) VALUES ('y.tazi', 'demo', 3, 'AGENT', 1)`
      );
      console.log('  ✅ Login "y.tazi" créé → rôle AGENT (agent 3 = TAZI Youssef)');
    } else {
      await pool.query(`UPDATE users SET role='AGENT', idAgent=3 WHERE login='y.tazi'`);
      console.log('  ✅ Login "y.tazi" → rôle AGENT');
    }

    // 8. Créer un compte CHEF_SERVICE propre lié à l'agent 2
    const [chef] = await pool.query(`SELECT * FROM users WHERE login='s.elfassi'`);
    if (chef.length === 0) {
      await pool.query(
        `INSERT INTO users (login, password, idAgent, role, actif) VALUES ('s.elfassi', 'demo', 2, 'CHEF_SERVICE', 1)`
      );
      console.log('  ✅ Login "s.elfassi" créé → rôle CHEF_SERVICE (agent 2 = EL FASSI Salma)');
    } else {
      await pool.query(`UPDATE users SET role='CHEF_SERVICE', idAgent=2 WHERE login='s.elfassi'`);
      console.log('  ✅ Login "s.elfassi" → rôle CHEF_SERVICE');
    }

    // 9. Voir le résultat final
    console.log('\n📋 Résultat final :');
    const [final] = await pool.query("SELECT idUtilisateur, login, role, idAgent, actif FROM users ORDER BY idUtilisateur");
    final.forEach(u => console.log(`   #${u.idUtilisateur} ${u.login} → ${u.role} (idAgent: ${u.idAgent})`));

    console.log('\n✅ Terminé !\n');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Erreur :', e.message, '\n');
    process.exit(1);
  }
}

fixUsers();