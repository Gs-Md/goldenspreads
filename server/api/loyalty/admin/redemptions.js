const { getDb } = require('../../../lib/db');
const { requireAdmin } = require('../../../lib/auth');
const { sendError, requireMethod } = require('../../../lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    await requireAdmin(req);
    const sql = getDb();
    const redemptions = await sql`
      SELECT
        r.id,
        r.redemption_code,
        r.points_spent,
        r.discount_cents,
        r.status,
        r.expires_at,
        r.created_at,
        a.member_code,
        u.name,
        u.email,
        a.phone
      FROM public.golden_reward_redemptions r
      INNER JOIN public.golden_loyalty_accounts a ON a.user_id = r.user_id
      INNER JOIN neon_auth.user u ON u.id = r.user_id
      WHERE r.status = 'issued' AND r.expires_at > now()
      ORDER BY r.created_at ASC
      LIMIT 100
    `;

    res.status(200).json({ redemptions });
  } catch (error) {
    sendError(res, error);
  }
};
