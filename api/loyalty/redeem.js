
const { getDb } = require('../../server/lib/db');
const { getVerifiedUser } = require('../../server/lib/auth');

const {
  sendError,
  requireMethod,
  getBody,
  HttpError,
} = require('../../server/lib/errors');

// ==================================================
// GOLDEN SPREADS
// CUSTOMER REDEMPTION - IDEMPOTENT
// ==================================================

const UUID_PATTERN =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // 1. Verify the customer's authentication.
    const user = await getVerifiedUser(req);

    // 2. Read the redemption request ID.
    const body = getBody(req);

    const requestId =
      typeof body.requestId === 'string'
        ? body.requestId.trim().toLowerCase()
        : '';

    if (!UUID_PATTERN.test(requestId)) {
      throw new HttpError(
        400,
        'Invalid redemption request. Please refresh your wallet and try again.'
      );
    }

    // 3. Execute the atomic database function.
    const sql = getDb();

    const rows = await sql`
      SELECT *
      FROM public.golden_redeem_reward(
        ${user.id}::uuid,
        ${requestId}::uuid
      )
    `;

    // 4. Check whether the customer has sufficient points.
    if (!rows.length) {
      throw new HttpError(
        400,
        'You need at least 200 points to redeem a $1 reward.'
      );
    }

    const redemption = rows[0];

    // 5. Return the original reward if this was a retry.
    const replayed = redemption.replayed === true;

    return res.status(replayed ? 200 : 201).json({
      success: true,

      replayed,

      redemption: {
        id: redemption.id,
        user_id: redemption.user_id,
        redemption_code: redemption.redemption_code,
        points_spent: redemption.points_spent,
        discount_cents: redemption.discount_cents,
        status: redemption.status,
        expires_at: redemption.expires_at,
        created_at: redemption.created_at,
      },

      message: replayed
        ? 'This redemption was already processed. Your original reward code has been returned.'
        : 'Your reward has been created successfully.',
    });

  } catch (error) {
    return sendError(res, error);
  }
};
