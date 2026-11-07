const { neon } = require('@neondatabase/serverless');

let cachedSql;

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured on the server.');
  }

  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL);
  }

  return cachedSql;
}

module.exports = { getDb };
