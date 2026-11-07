
const { getIdentityUser } = require('../../../lib/auth');
const { hasSecondFactor } = require('../../../lib/mfa');
const { sendError, requireMethod } = require('../../../lib/errors');

// --------------------------------------------------
// GOLDEN REWARDS - AUTHENTICATION STATUS
// --------------------------------------------------

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // Confirm the customer's Neon Auth identity
    // and active session.
    const user = await getIdentityUser(req);

    // Check whether the user completed the
    // email verification and current login code.
    const authenticated =
      user.emailVerified &&
      hasSecondFactor(req, user);

    res.status(200).json({
      emailVerified: user.emailVerified,
      authenticated,
    });

  } catch (error) {
    sendError(res, error);
  }
};
