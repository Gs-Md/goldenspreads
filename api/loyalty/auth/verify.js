
const {
  getIdentityUser,
} = require('../../../server/lib/auth');

const {
  requireSameOrigin,
  neonAuthPost,
  setSecondFactorCookie,
} = require('../../../server/lib/mfa');

const {
  getDb,
} = require('../../../server/lib/db');

const {
  HttpError,
  getBody,
  sendError,
  requireMethod,
} = require('../../../server/lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    requireSameOrigin(req);

    const user = await getIdentityUser(req);

    if (!user.emailVerified) {
      throw new HttpError(
        403,
        'Verify your email address before logging in.'
      );
    }

    const { challengeId, code } = getBody(req);

    if (
      typeof challengeId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        challengeId
      )
    ) {
      throw new HttpError(
        400,
        'Invalid login challenge. Request a new code.'
      );
    }

    if (
      typeof code !== 'string' ||
      !/^\d{6}$/.test(code)
    ) {
      throw new HttpError(
        400,
        'Enter a valid six-digit code.'
      );
    }

    const sql = getDb();

    // Verify this challenge belongs to the current
    // user and session, has not expired or been used,
    // and has not exceeded the attempt limit.

    const challenges = await sql`
      UPDATE public.golden_login_challenges
      SET attempts = attempts + 1
      WHERE id = ${challengeId}
        AND user_id = ${user.id}
        AND neon_session_id = ${user.sessionId}
        AND used_at IS NULL
        AND expires_at > now()
        AND attempts < 5
        AND created_at = (
          SELECT MAX(created_at)
          FROM public.golden_login_challenges
          WHERE user_id = ${user.id}
            AND neon_session_id = ${user.sessionId}
        )
      RETURNING id
    `;

    if (!challenges.length) {
      throw new HttpError(
        429,
        'This login challenge expired or reached its attempt limit. Request a new code.'
      );
    }

    // Ask Neon to check the code. We do not
    // store or log the code ourselves.

    const result = await neonAuthPost(
      'email-otp/check-verification-otp',
      {
        email: user.email,
        type: 'sign-in',
        otp: code,
      },
      req.headers.origin
    );

    // Safe diagnostics for the local server.
    // Never print the OTP, password or auth token.

    if (!result.ok) {
      console.warn('Golden Rewards OTP rejected by Neon:', {
        status: result.status,
        code:
          result.payload?.code ||
          result.payload?.error?.code ||
          'UNKNOWN',
      });

      throw new HttpError(
        401,
        'Neon rejected this login code. Request a new code and use the most recent email.'
      );
    }

    // Supported success response shapes.

    const validCode =
      result.payload?.success === true ||
      result.payload?.status === true ||
      result.payload?.data?.success === true ||
      result.payload?.data?.status === true;

    if (!validCode) {
      console.error(
        'Unexpected Neon OTP response:',
        {
          status: result.status,
          responseFields: Object.keys(
            result.payload || {}
          ),
        }
      );

      throw new HttpError(
        502,
        'The authentication provider returned an unexpected verification response. Check the local server logs.'
      );
    }

    // Only a verified, unused challenge
    // can authorize this login.

    const completed = await sql`
      UPDATE public.golden_login_challenges
      SET used_at = now()
      WHERE id = ${challengeId}
        AND user_id = ${user.id}
        AND neon_session_id = ${user.sessionId}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING id
    `;

    if (!completed.length) {
      throw new HttpError(
        409,
        'This verification challenge is no longer valid.'
      );
    }

    // Confirm the second login factor for
    // this exact Neon authentication session.

    setSecondFactorCookie(req, res, user);

    return res.status(200).json({
      authenticated: true,
      message: 'Login verified successfully.',
    });

  } catch (error) {
    sendError(res, error);
  }
};
