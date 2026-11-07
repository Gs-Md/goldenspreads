
const { neon } = require('@neondatabase/serverless');
const { requireMethod } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  // Check the database URL loaded by the actual API runtime.
  const dbUrl = process.env.DATABASE_URL || '';

  let database = {
    configured: Boolean(dbUrl),
  };

  try {
    if (!dbUrl) {
      throw new Error('DATABASE_URL is missing in API runtime.');
    }

    const parsed = new URL(dbUrl);

    database.host = parsed.host;
    database.user = decodeURIComponent(parsed.username);
    database.database = parsed.pathname.replace(/^\/+/, '');

    // Test the actual runtime connection directly.
    const sql = neon(dbUrl);

    const rows = await sql`
      SELECT current_user, current_database()
    `;

    database.connection = 'connected';
    database.serverUser = rows[0].current_user;
    database.serverDatabase = rows[0].current_database;

  } catch (error) {
    database.connection = 'failed';
    database.error = error.message;
  }

  // Check the JWKS endpoint from the same runtime.
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL || '';

  let jwks = {
    configured: Boolean(jwksUrl),
  };

  try {
    if (!jwksUrl) {
      throw new Error('NEON_AUTH_JWKS_URL is missing.');
    }

    const response = await fetch(jwksUrl);
    const body = await response.json().catch(() => null);

    jwks.status = response.status;
    jwks.ok = response.ok;
    jwks.keyCount = body?.keys?.length || 0;

  } catch (error) {
    jwks.error = error.message;
  }

  return res.status(200).json({
    database,
    authConfigured: Boolean(
      process.env.NEON_AUTH_BASE_URL &&
      process.env.NEON_AUTH_JWKS_URL
    ),
    jwks,
  });
};
