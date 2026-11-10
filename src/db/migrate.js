const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Run schema.sql; safe to repeat because of IF NOT EXISTS
async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { runMigrations };

// When run as a script: npm run db:migrate
if (require.main === module) {
  runMigrations()
    .then(() => { console.log('Migrations applied'); return pool.end(); })
    .catch((err) => { console.error(err); process.exit(1); });
}