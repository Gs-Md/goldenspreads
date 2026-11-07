
const { getIdentityUser } = require('../../../server/lib/auth');

const {
  requireSameOrigin,
  neonAuthPost,
  assertMfaConfigured,
} = require('../../../server/lib/mfa');

const { getDb } = require('../../../server/lib/db');

const {
  HttpError,
  getBody,
  sendError,
  requireMethod,
} = require('../../../server/lib/errors');

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

    // 2. Ensure the MFA signing secret exists.
    assertMfaConfigured();

    // 3. Verify the existing Neon Auth identity
    // and active session.
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

    const sql = getDb();

    // ------------------------------------------------
    // 6. RATE LIMITING
    // ------------------------------------------------

    // Maximum five code requests in ten minutes.
    const recent = await sql`
      SELECT created_at
      FROM public.golden_login_challenges
      WHERE user_id = ${user.id}
        AND created_at > now() - interval '10 minutes'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (recent.length >= 5) {
      throw new HttpError(
        429,
        'Too many verification requests. Try again later.'
      );
    }

    // Require at least 60 seconds between requests.
    if (
      recent.length &&
      Date.now() -
        new Date(recent[0].created_at).getTime() < 60000
    ) {
      throw new HttpError(
        429,
        'Please wait a minute before requesting another code.'
      );
    }

    // ------------------------------------------------
    // 7. VERIFY PASSWORD THROUGH NEON AUTH
    // ------------------------------------------------

    // The password is checked by Neon Auth.
    // We do not store the password in our database.

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
    // 8. CREATE A TEMPORARY LOGIN CHALLENGE
    // ------------------------------------------------

    // This challenge expires after five minutes,
    // according to the database default.

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
    // 9. REQUEST A SIX-DIGIT EMAIL CODE
    // ------------------------------------------------

    // Neon Auth handles email delivery through
    // its configured email OTP provider.

    const sent = await neonAuthPost(
      'email-otp/send-verification-otp',
      {
        email: user.email,
        type: 'sign-in',
      },
      req.headers.origin
    );

    // If Neon rejects the code request,
    // delete our unfinished challenge.

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
