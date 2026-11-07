
const {
  clearSecondFactorCookie,
  requireSameOrigin,
} = require('../../../server/lib/mfa');

const {
  sendError,
  requireMethod,
} = require('../../../server/lib/errors');

// --------------------------------------------------
// GOLDEN SPREADS - LOGOUT VERIFICATION
// --------------------------------------------------

module.exports = async function handler(req, res) {
  // Only allow POST requests.
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // 1. Check the request origin.
    requireSameOrigin(req);

    // 2. Remove the login verification cookie.
    // This prevents the previous verification
    // from being reused after logout.
    clearSecondFactorCookie(req, res);

    // 3. Return success.
    res.status(200).json({
      success: true,
      message: 'Golden Rewards verification session cleared.',
    });

  } catch (error) {
    sendError(res, error);
  }
};
