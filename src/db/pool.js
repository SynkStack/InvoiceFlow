require('dotenv').config(); // does not override variables already set
const { Pool } = require('pg');

// One shared pool for the whole app; it connects lazily on first query
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;