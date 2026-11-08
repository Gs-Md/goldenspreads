const { getIdentityUser } = require('../../../lib/auth');

const {
  requireSameOrigin,
  neonAuthPost,
  assertMfaConfigured,
} = require('../../../lib/mfa');

const { getDb } = require('../../../lib/db');

const {
  reserveOtpRequest,
} = require('../../../lib/otpRateLimit');

const {
  HttpError,
  getBody,
  sendError,
  requireMethod,
} = require('../../../lib/errors');

// --------------------------------------------------
// GOLDEN SPREADS - START LOGIN VERIFICATION
// --------------------------------------------------

module.exports = async function handler(req, res) {

  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  try {

    // 1. Check request origin.

    requireSameOrigin(req);

    // 2. Ensure MFA is configured.

    assertMfaConfigured();

    // 3. Verify the existing Neon Auth identity.

    const user = await getIdentityUser(req);

    // 4. The email must already be verified.

    if (!user.emailVerified) {
      throw new HttpError(
        403,
        'Please verify your email before signing in.'
      );
    }

    // 5. Read the customer's password.

    const { password } = getBody(req);

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      throw new HttpError(
        400,
        'Enter your account password to request a login code.'
      );
    }

    // ------------------------------------------------
    // 6. VERIFY PASSWORD THROUGH NEON AUTH
    // ------------------------------------------------

    const passwordCheck = await neonAuthPost(
      'sign-in/email',
      {
        email: user.email,
        password,
      },
      req.headers.origin
    );

    if (
      !passwordCheck.ok ||
      !passwordCheck.payload?.user ||
      passwordCheck.payload.user.id !== user.id
    ) {
      throw new HttpError(
        401,
        'Incorrect password or account cannot sign in.'
      );
    }

    // ------------------------------------------------
    // 7. RESERVE LOGIN OTP REQUEST
    // ------------------------------------------------

    const limit = await reserveOtpRequest(
      'login',
      user.email
    );

    if (!limit.allowed) {

      if (limit.retryAfterSeconds > 0) {
        res.setHeader(
          'Retry-After',
          String(limit.retryAfterSeconds)
        );
      }

      throw new HttpError(
        429,
        limit.message
      );
    }

    // ------------------------------------------------
    // 8. CREATE LOGIN CHALLENGE
    // ------------------------------------------------

    const sql = getDb();

    const inserted = await sql`
      INSERT INTO public.golden_login_challenges (
        user_id,
        neon_session_id
      )
      VALUES (
        ${user.id},
        ${user.sessionId}
      )
      RETURNING id
    `;

    const challengeId = inserted[0].id;

    // ------------------------------------------------
    // 9. REQUEST SIX-DIGIT EMAIL CODE
    // ------------------------------------------------

    const sent = await neonAuthPost(
      'email-otp/send-verification-otp',
      {
        email: user.email,
        type: 'sign-in',
      },
      req.headers.origin
    );

    // Delete unfinished challenge if Neon rejects.

    if (!sent.ok) {

      await sql`
        DELETE FROM public.golden_login_challenges
        WHERE id = ${challengeId}
      `;

      throw new HttpError(
        502,
        'Neon could not send the login code. Check the email provider and try again.'
      );
    }

    // ------------------------------------------------
    // 10. RETURN SUCCESS
    // ------------------------------------------------

    res.status(200).json({
      challengeId,
      message:
        'Check your inbox and spam folder for your login code.',
    });

  } catch (error) {

    sendError(res, error);

  }
};