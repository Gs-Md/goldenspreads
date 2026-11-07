const { getDb } = require('../../lib/db');
const { getVerifiedUser } = require('../../lib/auth');
const { sendError, requireMethod, getBody, HttpError } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) return;

  try {
    const user = await getVerifiedUser(req);
    const body = getBody(req);
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (phone.length > 40) {
      throw new HttpError(400, 'Phone number is too long.');
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO public.golden_loyalty_accounts (user_id, phone)
      VALUES (${user.id}::uuid, ${phone || null})
      ON CONFLICT (user_id)
      DO UPDATE SET phone = EXCLUDED.phone, updated_at = now()
      RETURNING phone
    `;

    res.status(200).json({ phone: rows[0].phone });
  } catch (error) {
    sendError(res, error);
  }
};
