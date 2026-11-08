const crypto = require('crypto');
const { getDb } = require('./db');

const MAX_REQUESTS = 3;
const COOLDOWN_SECONDS = 60;
const LOCKOUT_SECONDS = 30 * 60;

function normalizeEmail(email) {
  return typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';
}

function hashEmail(email) {
  const secret = process.env.GOLDEN_MFA_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('OTP rate-limit secret is not configured.');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(email)
    .digest('hex');
}

function formatWait(seconds) {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

async function reserveOtpRequest(flow, email) {
  if (!['signup', 'login'].includes(flow)) {
    throw new Error('Invalid OTP flow.');
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || normalizedEmail.length > 320) {
    return {
      allowed: false,
      retryAfterSeconds: 0,
      message: 'A valid email address is required.',
    };
  }

  const emailHash = hashEmail(normalizedEmail);
  const sql = getDb();

  // Atomically reserve an OTP request.
  // This prevents simultaneous requests from bypassing the limit.

  const reserved = await sql`
    INSERT INTO public.golden_otp_rate_limits AS existing (
      flow,
      email_hash,
      request_count,
      last_requested_at,
      blocked_until,
      updated_at
    )
    VALUES (
      ${flow},
      ${emailHash},
      1,
      NOW(),
      NULL,
      NOW()
    )
    ON CONFLICT (flow, email_hash)
    DO UPDATE SET

      request_count = CASE
        WHEN existing.blocked_until IS NOT NULL
          AND existing.blocked_until <= NOW()
        THEN 1
        ELSE existing.request_count + 1
      END,

      last_requested_at = NOW(),

      blocked_until = CASE
        WHEN existing.blocked_until IS NOT NULL
          AND existing.blocked_until <= NOW()
        THEN NULL

        WHEN existing.request_count + 1 >= 3
        THEN NOW() + INTERVAL '30 minutes'

        ELSE NULL
      END,

      updated_at = NOW()

    WHERE
      (
        existing.blocked_until IS NULL
        OR existing.blocked_until <= NOW()
      )

      AND (
        existing.last_requested_at IS NULL
        OR existing.last_requested_at
          <= NOW() - INTERVAL '60 seconds'
      )

      AND (
        existing.request_count < 3
        OR existing.blocked_until <= NOW()
      )

    RETURNING request_count, blocked_until
  `;

  if (reserved.length > 0) {
    return {
      allowed: true,
      requestNumber: Number(reserved[0].request_count),
      blockedUntil: reserved[0].blocked_until || null,
    };
  }

  // The atomic reservation was rejected.
  // Read the current cooldown to explain why.

  const currentRows = await sql`
    SELECT
      request_count,
      last_requested_at,
      blocked_until
    FROM public.golden_otp_rate_limits
    WHERE flow = ${flow}
      AND email_hash = ${emailHash}
    LIMIT 1
  `;

  const current = currentRows[0];

  if (!current) {
    throw new Error('Unable to check OTP request limits.');
  }

  const now = Date.now();

  const blockedTime = current.blocked_until
    ? new Date(current.blocked_until).getTime()
    : 0;

  if (blockedTime > now) {
    const remaining = Math.max(
      1,
      Math.ceil((blockedTime - now) / 1000)
    );

    return {
      allowed: false,
      retryAfterSeconds: remaining,
      message:
        `You have requested 3 verification codes. ` +
        `Please try again in ${formatWait(remaining)}.`,
    };
  }

  const lastRequestTime = current.last_requested_at
    ? new Date(current.last_requested_at).getTime()
    : 0;

  const nextAllowedTime =
    lastRequestTime + COOLDOWN_SECONDS * 1000;

  if (nextAllowedTime > now) {
    const remaining = Math.max(
      1,
      Math.ceil((nextAllowedTime - now) / 1000)
    );

    return {
      allowed: false,
      retryAfterSeconds: remaining,
      message:
        `Please wait ${formatWait(remaining)} ` +
        `before requesting another verification code.`,
    };
  }

  if (Number(current.request_count) >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: LOCKOUT_SECONDS,
      message:
        'You have requested 3 verification codes. ' +
        'Please try again in 30 minutes.',
    };
  }

  return {
    allowed: false,
    retryAfterSeconds: 60,
    message: 'Unable to process your verification request. Please try again.',
  };
}

module.exports = {
  reserveOtpRequest,
};