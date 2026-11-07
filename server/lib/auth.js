
const { getDb } = require('./db');
const { HttpError } = require('./errors');
const { hasSecondFactor } = require('./mfa');

let cachedJwks;
let cachedJwksUrl;

// --------------------------------------------------
// 1. VERIFY NEON AUTH IDENTITY AND SESSION
// --------------------------------------------------

async function getIdentityUser(req) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new HttpError(
      401,
      'Please sign in to continue.'
    );
  }

  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

  if (!jwksUrl || !authBaseUrl) {
    throw new HttpError(
      503,
      'Neon Auth is not configured on the server.'
    );
  }

  let payload;

  try {
    const { createRemoteJWKSet, jwtVerify } =
      await import('jose');

    if (!cachedJwks || cachedJwksUrl !== jwksUrl) {
      cachedJwks = createRemoteJWKSet(
        new URL(jwksUrl)
      );

      cachedJwksUrl = jwksUrl;
    }

    const issuer = new URL(authBaseUrl).origin;

    const result = await jwtVerify(
      match[1],
      cachedJwks,
      { issuer }
    );

    payload = result.payload;

  } catch (error) {
    throw new HttpError(
      401,
      'Your Neon Auth session is invalid or expired.'
    );
  }

  const userId = payload.sub;
  const sessionId = req.headers['x-golden-session-id'];

  if (
    typeof userId !== 'string' ||
    userId.length < 8 ||
    userId.length > 128 ||
    typeof sessionId !== 'string' ||
    sessionId.length < 8 ||
    sessionId.length > 255
  ) {
    throw new HttpError(
      401,
      'Your session is incomplete. Please sign in again.'
    );
  }

  // Verify that the supplied session really belongs
  // to this authenticated user and has not expired.

  const sql = getDb();

  const [sessionRows, userRows] = await Promise.all([
    sql`
      SELECT id
      FROM neon_auth.session
      WHERE id = ${sessionId}
        AND "userId" = ${userId}
        AND "expiresAt" > now()
      LIMIT 1
    `,

    sql`
      SELECT
        email,
        "emailVerified" AS email_verified
      FROM neon_auth.user
      WHERE id = ${userId}
      LIMIT 1
    `,
  ]);

  if (!sessionRows.length || !userRows.length) {
    throw new HttpError(
      401,
      'Your session was not found. Please sign in again.'
    );
  }

  return {
    id: userId,
    sessionId,
    email: userRows[0].email,
    emailVerified: userRows[0].email_verified === true,
  };
}

// --------------------------------------------------
// 2. REQUIRE VERIFIED EMAIL AND LOGIN CODE
// --------------------------------------------------

async function getVerifiedUser(req) {
  const user = await getIdentityUser(req);

  // The registered email must be verified.

  if (!user.emailVerified) {
    throw new HttpError(
      403,
      'Verify your email before using Golden Rewards.'
    );
  }

  // The second login factor must have been
  // completed for this exact Neon Auth session.

  if (!hasSecondFactor(req, user)) {
    throw new HttpError(
      403,
      'A login verification code is required.'
    );
  }

  return user;
}

// --------------------------------------------------
// 3. REQUIRE ADMINISTRATOR PERMISSION
// --------------------------------------------------

async function requireAdmin(req) {
  // Administrators must satisfy the same authentication
  // requirements as customers.

  const user = await getVerifiedUser(req);

  const allowedEmails = (
    process.env.GOLDEN_ADMIN_EMAILS || ''
  )
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.length) {
    throw new HttpError(
      503,
      'Golden Spreads administration is not configured.'
    );
  }

  // Admin permission comes from the server environment.
  // It cannot be assigned through registration or React.

  if (!allowedEmails.includes(user.email.toLowerCase())) {
    throw new HttpError(
      403,
      'You do not have permission to access Golden Spreads administration.'
    );
  }

  return user;
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  getIdentityUser,
  getVerifiedUser,
  requireAdmin,
};
