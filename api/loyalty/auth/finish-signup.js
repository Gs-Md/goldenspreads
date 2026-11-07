
const crypto = require('crypto');

const {
  getIdentityUser,
} = require('../../../server/lib/auth');

const {
  requireSameOrigin,
  neonAuthPost,
  setSecondFactorCookie,
  assertMfaConfigured,
} = require('../../../server/lib/mfa');

const {
  HttpError,
  getBody,
  sendError,
  requireMethod,
} = require('../../../server/lib/errors');

// ==================================================
// GOLDEN SPREADS - FINISH SIGNUP
//
// New customer:
//   1. Verify email using a six-digit code.
//   2. Sign in to Neon Auth.
//   3. Convert verified signup into a secure session.
//
// The verified signup code can count as the email
// security factor for the initial login only.
//
// Existing customer login remains unchanged.
// ==================================================

const COOKIE_NAME = 'golden_signup_proof';
const PROOF_TTL_SECONDS = 5 * 60;

// --------------------------------------------------
// SECURE COOKIE SETTINGS
// --------------------------------------------------

function cookieAttributes(req, maxAge) {
  const forwardedProtocol = String(
    req.headers['x-forwarded-proto'] || ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  const secure =
    forwardedProtocol === 'https' ||
    Boolean(req.socket?.encrypted);

  return [
    'Path=/api/loyalty/auth/finish-signup',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

// --------------------------------------------------
// SIGN VERIFICATION PROOF
// --------------------------------------------------

function sign(data) {
  const secret = assertMfaConfigured();

  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
}

function makeProof(email) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp:
        Math.floor(Date.now() / 1000) +
        PROOF_TTL_SECONDS,
      nonce: crypto.randomBytes(16).toString('hex'),
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

// --------------------------------------------------
// VALIDATE VERIFICATION PROOF
// --------------------------------------------------

function getProof(req) {
  const header = String(req.headers.cookie || '');

  const entry = header
    .split(';')
    .map(item => item.trim())
    .find(item =>
      item.startsWith(`${COOKIE_NAME}=`)
    );

  if (!entry) {
    return null;
  }

  const token = entry.slice(
    COOKIE_NAME.length + 1
  );

  const [payload, signature, extra] = token.split('.');

  if (!payload || !signature || extra) {
    return null;
  }

  const expected = sign(payload);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(
      actualBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(
        payload,
        'base64url'
      ).toString('utf8')
    );

    if (
      typeof parsed.email !== 'string' ||
      !Number.isSafeInteger(parsed.exp) ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return parsed;

  } catch (_) {
    return null;
  }
}

// ==================================================
// API HANDLER
// ==================================================

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    requireSameOrigin(req);
    assertMfaConfigured();

    const body = getBody(req);
    const action = body.action;

    // ----------------------------------------------
    // STEP 1 - VERIFY EMAIL CODE ON NEON'S SERVER
    // ----------------------------------------------

    if (action === 'verify') {
      const email =
        typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : '';

      const code =
        typeof body.code === 'string'
          ? body.code.trim()
          : '';

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^\d{6}$/.test(code)
      ) {
        throw new HttpError(
          400,
          'Enter a valid email address and six-digit code.'
        );
      }

      // The OTP is validated by Neon Auth.
      // The browser cannot declare itself verified.
      const response = await neonAuthPost(
        'email-otp/verify-email',
        {
          email,
          otp: code,
        },
        req.headers.origin
      );

      if (
        !response.ok ||
        response.payload?.error
      ) {
        throw new HttpError(
          400,
          'The verification code was invalid or expired. Request a new one.'
        );
      }

      // Short-lived, signed, HTTP-only proof that
      // this email verification succeeded.
      res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${makeProof(email)}; ` +
        cookieAttributes(req, PROOF_TTL_SECONDS)
      );

      return res.status(200).json({
        verified: true,
        expiresInSeconds: PROOF_TTL_SECONDS,
      });
    }

    // ----------------------------------------------
    // STEP 2 - COMPLETE INITIAL AUTHENTICATION
    // ----------------------------------------------

    if (action === 'complete') {
      // Must have an actual authenticated Neon session.
      const user = await getIdentityUser(req);

      if (!user.emailVerified) {
        throw new HttpError(
          403,
          'Verify your email before continuing.'
        );
      }

      const proof = getProof(req);

      if (
        !proof ||
        proof.email !== String(
          user.email || ''
        ).toLowerCase()
      ) {
        throw new HttpError(
          403,
          'Email verification expired. Verify your email again.'
        );
      }

      // Neon Auth has authenticated the user with
      // their password and active session.
      // The signed proof confirms the email factor.
      //
      // The existing server-side MFA system remains
      // mandatory for all other login sessions.
      setSecondFactorCookie(req, res, user);

      // Preserve the MFA cookie and clear the
      // short-lived signup proof.
      const current = res.getHeader('Set-Cookie');

      const cookies = Array.isArray(current)
        ? current
        : current
          ? [current]
          : [];

      cookies.push(
        `${COOKIE_NAME}=; ${cookieAttributes(req, 0)}`
      );

      res.setHeader('Set-Cookie', cookies);

      return res.status(200).json({
        authenticated: true,
      });
    }

    throw new HttpError(
      400,
      'Invalid signup completion action.'
    );

  } catch (error) {
    return sendError(res, error);
  }
};
