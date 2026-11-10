require('dotenv').config(); // does not override variables already set
const { Pool, types } = require('pg');

// One shared pool for the whole app; it connects lazily on first query
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
types.setTypeParser(1082, (value) => value);
module.exports = pool;