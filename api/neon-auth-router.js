const https = require('https');

const {
  reserveOtpRequest,
} = require('../server/lib/otpRateLimit');

const UPSTREAM_HOST =
  'ep-icy-mud-b9declh3.neonauth.c-7.eu-central-1.aws.neon.tech';

const UPSTREAM_PREFIX = '/neondb/auth';

const BLOCKED_HEADERS = new Set([
  'host',
  'connection',
  'transfer-encoding',
  'accept-encoding',
  'keep-alive',
  'proxy-authorization',
  'proxy-authenticate',
  'proxy-connection',
  'upgrade',
  'te',
  'trailer',
  'expect',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-for',
  'x-vercel-id',
  'forwarded',
]);

// --------------------------------------------------
// READ REQUEST BODY
// --------------------------------------------------

function getRequestBody(req) {
  const body = req.body;

  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8'));
    } catch (_) {
      return {};
    }
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }

  if (body && typeof body === 'object') {
    return body;
  }

  return {};
}

// --------------------------------------------------
// IDENTIFY OTP REQUEST
// --------------------------------------------------

function getOtpRequest(req, segments, body) {
  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    return null;
  }

  const route = segments.join('/');

  // Initial account registration.
  // Neon Auth sends the initial verification email
  // through the signup endpoint.

  if (route === 'sign-up/email') {
    return {
      flow: 'signup',
      email: body.email,
    };
  }

  // Resending an OTP.

  if (route === 'email-otp/send-verification-otp') {
    if (body.type === 'email-verification') {
      return {
        flow: 'signup',
        email: body.email,
      };
    }

    if (body.type === 'sign-in') {
      return {
        flow: 'login',
        email: body.email,
      };
    }
  }

  return null;
}

// --------------------------------------------------
// SEND RATE LIMIT ERROR
// --------------------------------------------------

function sendRateLimitError(res, limit) {
  res.statusCode = 429;

  res.setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );

  res.setHeader(
    'Retry-After',
    String(Math.max(1, limit.retryAfterSeconds || 1))
  );

  res.setHeader('Cache-Control', 'no-store');

  res.end(JSON.stringify({
    error: limit.message,
    message: limit.message,
    code: 'OTP_RATE_LIMITED',
    retryAfter: limit.retryAfterSeconds,
  }));
}

// --------------------------------------------------
// NEON AUTH PROXY
// --------------------------------------------------

module.exports = async function neonAuthRouter(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const rawPath = req.query && req.query.path;

  const route = Array.isArray(rawPath)
    ? rawPath.join('/')
    : String(rawPath || '');

  const segments = route
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  if (
    segments.some(segment =>
      segment === '.' ||
      segment === '..' ||
      /[\\?#]/.test(segment)
    )
  ) {
    res.statusCode = 400;
    return res.end('Invalid authentication route.');
  }

  // ------------------------------------------------
  // OTP RATE LIMITING
  // ------------------------------------------------

  const requestBody = getRequestBody(req);

  const otpRequest = getOtpRequest(
    req,
    segments,
    requestBody
  );

  if (
    otpRequest &&
    typeof otpRequest.email === 'string' &&
    otpRequest.email.trim()
  ) {
    try {
      const limit = await reserveOtpRequest(
        otpRequest.flow,
        otpRequest.email
      );

      if (!limit.allowed) {
        return sendRateLimitError(res, limit);
      }

    } catch (error) {
      console.error(
        'OTP rate-limit check failed:',
        error.message
      );

      res.statusCode = 503;

      res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8'
      );

      return res.end(JSON.stringify({
        error: 'Unable to process your verification request. Please try again.',
        code: 'OTP_PROTECTION_UNAVAILABLE',
      }));
    }
  }

  // ------------------------------------------------
  // BUILD UPSTREAM REQUEST
  // ------------------------------------------------

  const encodedPath = segments
    .map(segment => encodeURIComponent(segment))
    .join('/');

  const incomingUrl = new URL(
    req.url || '/',
    'https://vercel.internal'
  );

  const query = new URLSearchParams(incomingUrl.search);

  query.delete('path');

  const queryString = query.toString();

  const upstreamPath =
    UPSTREAM_PREFIX +
    (encodedPath ? '/' + encodedPath : '') +
    (queryString ? '?' + queryString : '');

  const headers = {};

  for (const [name, value] of Object.entries(req.headers || {})) {
    if (BLOCKED_HEADERS.has(name.toLowerCase())) continue;
    if (value === undefined) continue;

    headers[name.toLowerCase()] = value;
  }

  headers.host = UPSTREAM_HOST;
  headers['accept-encoding'] = 'identity';

  // ------------------------------------------------
  // REQUEST BODY
  // ------------------------------------------------

  let body;

  try {
    body = req.body;
  } catch (_) {
    body = undefined;
  }

  let bodyBuffer = null;

  if (body !== undefined && body !== null) {
    if (Buffer.isBuffer(body)) {
      bodyBuffer = body;

    } else if (typeof body === 'string') {
      bodyBuffer = Buffer.from(body);

    } else if (typeof body === 'object') {
      const contentType = String(
        headers['content-type'] || ''
      );

      if (
        contentType.includes(
          'application/x-www-form-urlencoded'
        )
      ) {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(body)) {
          for (const item of Array.isArray(value) ? value : [value]) {
            params.append(key, String(item ?? ''));
          }
        }

        bodyBuffer = Buffer.from(params.toString());

      } else {
        bodyBuffer = Buffer.from(JSON.stringify(body));

        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      }
    }

    if (bodyBuffer) {
      headers['content-length'] = String(bodyBuffer.length);
      delete headers['transfer-encoding'];
    }
  }

  // ------------------------------------------------
  // FORWARD TO NEON
  // ------------------------------------------------

  const proxyReq = https.request(
    {
      hostname: UPSTREAM_HOST,
      port: 443,
      method: req.method || 'GET',
      path: upstreamPath,
      headers,
    },

    proxyRes => {
      res.statusCode = proxyRes.statusCode || 502;

      for (const [name, originalValue] of Object.entries(
        proxyRes.headers || {}
      )) {
        if (
          [
            'connection',
            'keep-alive',
            'transfer-encoding',
            'upgrade',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailer',
          ].includes(name)
        ) {
          continue;
        }

        if (originalValue === undefined) continue;

        // Preserve authentication cookies.

        if (name === 'set-cookie') {
          const cookies = (
            Array.isArray(originalValue)
              ? originalValue
              : [originalValue]
          ).map(cookie => {
            let result = cookie.replace(
              /;\s*Domain=[^;]*/gi,
              ''
            );

            if (!result.startsWith('__Host-')) {
              if (/;\s*Path=/i.test(result)) {
                result = result.replace(
                  /;\s*Path=[^;]*/i,
                  '; Path=/api/neon-auth'
                );
              } else {
                result += '; Path=/api/neon-auth';
              }
            }

            return result;
          });

          res.setHeader('Set-Cookie', cookies);
          continue;
        }

        // Preserve redirect handling.

        if (name === 'location' && typeof originalValue === 'string') {
          const upstreamOrigin =
            `https://${UPSTREAM_HOST}${UPSTREAM_PREFIX}`;

          const location = originalValue.startsWith(upstreamOrigin)
            ? '/api/neon-auth' +
              originalValue.slice(upstreamOrigin.length)
            : originalValue;

          res.setHeader(name, location);
          continue;
        }

        res.setHeader(name, originalValue);
      }

      res.setHeader('Cache-Control', 'no-store');

      proxyRes.pipe(res);
    }
  );

  proxyReq.setTimeout(25000, () => {
    proxyReq.destroy(
      new Error('Neon Auth request timed out.')
    );
  });

  proxyReq.on('error', error => {
    console.error(
      'Neon Auth proxy error:',
      error.message
    );

    if (!res.headersSent) {
      res.statusCode = 502;

      res.setHeader(
        'Content-Type',
        'application/json'
      );

      res.end(JSON.stringify({
        error: 'Neon authentication service unavailable.',
      }));

    } else {
      res.end();
    }
  });

  if (bodyBuffer !== null) {
    proxyReq.end(bodyBuffer);

  } else if (
    req.method &&
    !['GET', 'HEAD'].includes(req.method.toUpperCase())
  ) {
    req.pipe(proxyReq);

  } else {
    proxyReq.end();
  }
};