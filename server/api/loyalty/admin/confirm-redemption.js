const { getDb } = require('../../../lib/db');
const { requireAdmin } = require('../../../lib/auth');
const { sendError, requireMethod, getBody, HttpError } = require('../../../lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) return;

  try {
    const admin = await requireAdmin(req);
    const body = getBody(req);
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) throw new HttpError(400, 'Enter a redemption code.');

    const sql = getDb();
    const rows = await sql`
      UPDATE public.golden_reward_redemptions
      SET status = 'used', used_at = now(), used_by = ${admin.id}
      WHERE redemption_code = ${code}
        AND status = 'issued'
        AND expires_at > now()
      RETURNING redemption_code, discount_cents, points_spent, used_at
    `;

    if (!rows.length) {
      throw new HttpError(409, 'This code is invalid, expired, or has already been used.');
    }

    res.status(200).json({ success: true, redemption: rows[0] });
  } catch (error) {
    sendError(res, error);
  }
};
