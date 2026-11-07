
const { getDb } = require('../../../lib/db');
const { requireAdmin } = require('../../../lib/auth');
const { requireSameOrigin } = require('../../../lib/mfa');

const {
  HttpError,
  getBody,
  sendError,
  requireMethod,
} = require('../../../lib/errors');

// ==================================================
// GOLDEN SPREADS - DELETE CUSTOMER
// ==================================================

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // Only requests from our website are accepted.
    requireSameOrigin(req);

    // Administrator must complete authentication and MFA.
    const admin = await requireAdmin(req);

    const {
      userId,
      confirmationPhrase,
    } = getBody(req);

    // Only the selected user ID and DELETE are required.
    if (
      typeof userId !== 'string' ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId) ||
      confirmationPhrase !== 'DELETE'
    ) {
      throw new HttpError(
        400,
        'Select a customer and type DELETE to confirm.'
      );
    }

    // ------------------------------------------------
    // PROTECT ADMIN ACCOUNTS
    // ------------------------------------------------

    const protectedEmails = new Set(
      (process.env.GOLDEN_ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    );

    const sql = getDb();

    // ------------------------------------------------
    // FIND CUSTOMER
    // ------------------------------------------------

    const rows = await sql`
      SELECT
        u.id::text AS user_id,
        u.email,
        a.member_code
      FROM neon_auth."user" AS u
      LEFT JOIN public.golden_loyalty_accounts AS a
        ON a.user_id::text = u.id::text
      WHERE u.id::text = ${userId}
      LIMIT 1
    `;

    if (rows.length !== 1) {
      throw new HttpError(
        404,
        'Customer account not found.'
      );
    }

    const customer = rows[0];

    const customerEmail = String(
      customer.email || ''
    ).trim().toLowerCase();

    // Protect the current admin and all configured admins.
    if (
      customer.user_id === admin.id ||
      !customerEmail ||
      protectedEmails.has(customerEmail)
    ) {
      throw new HttpError(
        403,
        'Administrator accounts cannot be deleted here.'
      );
    }

    // ------------------------------------------------
    // PERMANENT DELETION TRANSACTION
    // ------------------------------------------------

    // All queries run in one transaction.
    // If a statement fails, PostgreSQL rolls back
    // the changes instead of partially deleting data.

    const results = await sql.transaction([

      // Preserve other customers' transactions.
      sql`
        UPDATE public.golden_loyalty_transactions
        SET created_by = NULL
        WHERE created_by::text = ${userId}
          AND user_id::text <> ${userId}
      `,

      // Preserve other customers' redemptions.
      sql`
        UPDATE public.golden_reward_redemptions
        SET used_by = NULL
        WHERE used_by::text = ${userId}
          AND user_id::text <> ${userId}
      `,

      // Delete this customer's transaction history.
      sql`
        DELETE FROM public.golden_loyalty_transactions
        WHERE user_id::text = ${userId}
      `,

      // Delete this customer's reward codes.
      sql`
        DELETE FROM public.golden_reward_redemptions
        WHERE user_id::text = ${userId}
      `,

      // Delete login verification challenges.
      sql`
        DELETE FROM public.golden_login_challenges
        WHERE user_id::text = ${userId}
      `,

      // Delete Golden Wallet and points.
      sql`
        DELETE FROM public.golden_loyalty_accounts
        WHERE user_id::text = ${userId}
      `,

      // Delete the Neon authentication account.
      sql`
        DELETE FROM neon_auth."user"
        WHERE id::text = ${userId}
          AND LOWER(email) = ${customerEmail}
        RETURNING id::text AS id
      `,

    ], {
      isolationLevel: 'Serializable',
    });

    // ------------------------------------------------
    // CONFIRM DELETION
    // ------------------------------------------------

    const deletedUsers = results[results.length - 1];

    if (
      !Array.isArray(deletedUsers) ||
      deletedUsers.length !== 1
    ) {
      throw new HttpError(
        409,
        'The authentication account was not removed.'
      );
    }

    return res.status(200).json({
      success: true,
      memberCode: customer.member_code,
      message: 'Customer account deleted successfully.',
    });

  } catch (error) {
    return sendError(res, error);
  }
};
