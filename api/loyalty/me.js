const { getDb } = require('../../server/lib/db');
const { getVerifiedUser } = require('../../server/lib/auth');
const { sendError, requireMethod } = require('../../server/lib/errors');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    const user = await getVerifiedUser(req);
    const sql = getDb();

    const accounts = await sql`
      INSERT INTO public.golden_loyalty_accounts (user_id)
      VALUES (${user.id}::uuid)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = now()
      RETURNING
        user_id,
        member_code,
        phone,
        points_balance,
        total_earned_points,
        total_redeemed_points,
        created_at
    `;

    const [authUsers, transactions, redemptions] = await Promise.all([
      sql`
        SELECT name, email
        FROM neon_auth.user
        WHERE id = ${user.id}::uuid
        LIMIT 1
      `,
      sql`
        SELECT id, transaction_type, points_delta, amount_cents, channel,
               order_reference, description, created_at
        FROM public.golden_loyalty_transactions
        WHERE user_id = ${user.id}::uuid
        ORDER BY created_at DESC
        LIMIT 20
      `,
      sql`
        SELECT redemption_code, points_spent, discount_cents, status, expires_at, created_at
        FROM public.golden_reward_redemptions
        WHERE user_id = ${user.id}::uuid
          AND status = 'issued'
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 10
      `,
    ]);

    res.status(200).json({
      account: {
        ...accounts[0],
        name: authUsers[0] ? authUsers[0].name : null,
        email: authUsers[0] ? authUsers[0].email : null,
      },
      transactions,
      redemptions,
      rewards: { pointsPerDollar: 10, pointsPerDollarDiscount: 200, discountCents: 100 },
    });
  } catch (error) {
    sendError(res, error);
  }
};
