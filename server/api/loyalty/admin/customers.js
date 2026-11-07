
const { getDb } = require('../../../lib/db');

const {
  requireAdmin,
} = require('../../../lib/auth');

const {
  sendError,
  requireMethod,
} = require('../../../lib/errors');

// --------------------------------------------------
// GOLDEN SPREADS - ADMIN CUSTOMER MANAGEMENT
// --------------------------------------------------

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // Only verified administrators who completed
    // login verification can access this information.
    await requireAdmin(req);

    const sql = getDb();

    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim().slice(0, 80)
        : '';

    // ------------------------------------------------
    // 1. EXISTING CUSTOMER WALLETS
    // ------------------------------------------------

    // Keep this response compatible with the
    // existing admin purchase and points interface.

    const customers = await sql`
      SELECT
        a.user_id,
        a.member_code,
        a.phone,
        a.points_balance,
        a.total_earned_points,
        a.total_redeemed_points,
        a.created_at,
        u.name,
        u.email

      FROM public.golden_loyalty_accounts a

      INNER JOIN neon_auth."user" u
        ON u.id = a.user_id

      WHERE (
        ${search} = ''

        OR a.member_code ILIKE
          '%' || ${search} || '%'

        OR COALESCE(a.phone, '') ILIKE
          '%' || ${search} || '%'

        OR u.email ILIKE
          '%' || ${search} || '%'

        OR COALESCE(u.name, '') ILIKE
          '%' || ${search} || '%'
      )

      ORDER BY a.created_at DESC

      LIMIT 50
    `;

    // ------------------------------------------------
    // 2. ALL REGISTERED AUTH ACCOUNTS
    // ------------------------------------------------

    // Includes users who signed up but have not
    // created a Golden Wallet yet.
    //
    // This list will be displayed in the separate
    // customer deletion management section.

    const users = await sql`
      SELECT
        u.id::text AS user_id,
        u.name,
        u.email,
        u."emailVerified" AS email_verified,

        a.member_code,
        a.phone,

        COALESCE(
          a.points_balance,
          0
        ) AS points_balance,

        CASE
          WHEN a.user_id IS NOT NULL
          THEN true
          ELSE false
        END AS has_wallet

      FROM neon_auth."user" u

      LEFT JOIN public.golden_loyalty_accounts a
        ON a.user_id = u.id

      WHERE (
        ${search} = ''

        OR u.email ILIKE
          '%' || ${search} || '%'

        OR COALESCE(u.name, '') ILIKE
          '%' || ${search} || '%'

        OR COALESCE(a.member_code, '') ILIKE
          '%' || ${search} || '%'

        OR COALESCE(a.phone, '') ILIKE
          '%' || ${search} || '%'
      )

      ORDER BY u.email ASC

      LIMIT 100
    `;

    // ------------------------------------------------
    // 3. PROTECT ADMINISTRATOR ACCOUNTS
    // ------------------------------------------------

    // Administrator accounts should never appear
    // as deletion choices.

    const protectedEmails = new Set(
      (process.env.GOLDEN_ADMIN_EMAILS || '')
        .split(',')
        .map((email) =>
          email.trim().toLowerCase()
        )
        .filter(Boolean)
    );

    const registeredUsers = users.filter(
      (user) =>
        !protectedEmails.has(
          String(user.email || '').toLowerCase()
        )
    );

    // ------------------------------------------------
    // 4. RETURN CUSTOMER INFORMATION
    // ------------------------------------------------

    res.status(200).json({
      customers,

      registeredUsers,

      totalShown: registeredUsers.length,
    });

  } catch (error) {
    sendError(res, error);
  }
};
