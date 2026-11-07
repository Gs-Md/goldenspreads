
const crypto = require('crypto');
const { HttpError } = require('./errors');

const COOKIE_NAME = 'golden_rewards_mfa';
const MFA_SECONDS = 8 * 60 * 60;

// --------------------------------------------------
// SECRET CONFIGURATION
// --------------------------------------------------

function getSecret() {
  const secret = process.env.GOLDEN_MFA_SECRET;

  if (!secret || secret.length < 32) {
    throw new HttpError(
      503,
      'GOLDEN_MFA_SECRET must be configured (32+ characters).'
    );
  }

  return secret;
}

// --------------------------------------------------
// SIGNED VERIFICATION TOKEN
// --------------------------------------------------

function hmac(data) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('base64url');
}

function makeToken(user) {
  const data = Buffer.from(
    JSON.stringify({
      uid: user.id,
      sid: user.sessionId,
      exp: Math.floor(Date.now() / 1000) + MFA_SECONDS,
    })
  ).toString('base64url');

  return `${data}.${hmac(data)}`;
}

// --------------------------------------------------
// READ COOKIE
// --------------------------------------------------

function readCookie(req, name) {
  const cookie = req.headers.cookie || '';

  const item = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return item ? item.slice(name.length + 1) : null;
}

// --------------------------------------------------
// CHECK SECOND FACTOR
// --------------------------------------------------

function hasSecondFactor(req, user) {
  const token = readCookie(req, COOKIE_NAME);

  if (!token) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return false;
  }

  const [data, signature] = parts;
  const expected = hmac(data);

  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {
    return false;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    );

    return (
      claims.uid === user.id &&
      claims.sid === user.sessionId &&
      Number.isInteger(claims.exp) &&
      claims.exp > Math.floor(Date.now() / 1000)
    );

  } catch (_) {
    return false;
  }
}

// --------------------------------------------------
// COOKIE SECURITY
// --------------------------------------------------

function cookieAttributes(req, maxAge) {
  const hostname = String(req.headers.host || '');

  const isLocal = /^(localhost|127\.0\.0\.1)(:|$)/i.test(
    hostname
  );

  const isSecure =
    !isLocal &&
    (
      process.env.VERCEL === '1' ||
      (req.headers['x-forwarded-proto'] || '')
        .split(',')[0] === 'https'
    );

  return (
    `Path=/api/loyalty; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` +
    (isSecure ? '; Secure' : '')
  );
}

// Called only after successful login-code verification.
function setSecondFactorCookie(req, res, user) {
  const token = makeToken(user);

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; ${cookieAttributes(req, MFA_SECONDS)}`
  );
}

// Clear the confirmation on logout.
function clearSecondFactorCookie(req, res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; ${cookieAttributes(req, 0)}`
  );
}

// --------------------------------------------------
// REQUEST ORIGIN PROTECTION
// --------------------------------------------------

function requireSameOrigin(req) {
  const origin = req.headers.origin;

  if (!origin) {
    return;
  }

  try {
    if (new URL(origin).host === req.headers.host) {
      return;
    }
  } catch (_) {
    // Invalid origins are rejected below.
  }

  throw new HttpError(403, 'Invalid request origin.');
}

// --------------------------------------------------
// NEON AUTH SERVER REQUEST
// --------------------------------------------------

async function neonAuthPost(path, body, origin) {
  const base = process.env.NEON_AUTH_BASE_URL;

  if (!base) {
    throw new HttpError(
      503,
      'Neon Auth is not configured.'
    );
  }

  const url =
    `${base.replace(/\/+$/, '')}/` +
    path.replace(/^\/+/, '');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  assertMfaConfigured: getSecret,
  hasSecondFactor,
  setSecondFactorCookie,
  clearSecondFactorCookie,
  requireSameOrigin,
  neonAuthPost,
};
