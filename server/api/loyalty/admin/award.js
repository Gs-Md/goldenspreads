
const { getDb } = require('../../../lib/db');
const { requireAdmin } = require('../../../lib/auth');

const {
  sendError,
  requireMethod,
  getBody,
  HttpError,
} = require('../../../lib/errors');

const ALLOWED_CHANNELS = new Set([
  'whatsapp',
  'instagram',
  'phone',
  'in_person',
  'other',
]);

// ==================================================
// GOLDEN SPREADS - AWARD PURCHASE POINTS
// ==================================================

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    // Only authorized administrators can award points.
    const admin = await requireAdmin(req);
    const body = getBody(req);

    const memberCode =
      typeof body.memberCode === 'string'
        ? body.memberCode.trim().toUpperCase()
        : '';

    const channel =
      typeof body.channel === 'string'
        ? body.channel
        : 'other';

    const description =
      typeof body.description === 'string'
        ? body.description.trim().slice(0, 240)
        : '';

    // Automatically created by the admin interface.
    // The same purchase keeps the same ID if retried.
    const purchaseId =
      typeof body.purchaseId === 'string'
        ? body.purchaseId.trim().toLowerCase()
        : '';

    if (
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(
        purchaseId
      )
    ) {
      throw new HttpError(
        400,
        'Invalid purchase request. Please refresh the admin dashboard.'
      );
    }

    if (!memberCode) {
      throw new HttpError(
        400,
        'Select a customer first.'
      );
    }

    if (!ALLOWED_CHANNELS.has(channel)) {
      throw new HttpError(
        400,
        'Invalid order channel.'
      );
    }

    // The admin enters dollars, not cents.
    const amount = Number(body.amount);

    if (!Number.isFinite(amount)) {
      throw new HttpError(
        400,
        'Enter a valid purchase amount.'
      );
    }

    const amountCents = Math.round(amount * 100);

    if (amountCents < 10 || amountCents > 10000000) {
      throw new HttpError(
        400,
        'Enter an eligible product total between $0.10 and $100,000.'
      );
    }

    // 10 points per $1 spent.
    const pointsAwarded = Math.floor(amountCents / 10);

    if (pointsAwarded < 1) {
      throw new HttpError(
        400,
        'The purchase is too small to earn points.'
      );
    }

    // Automatically construct the unique order reference.
    // No manual reference is needed.
    const orderReference = `GS-${purchaseId.toUpperCase()}`;

    const sql = getDb();

    // Find the selected customer's wallet.
    const accounts = await sql`
      SELECT user_id, member_code
      FROM public.golden_loyalty_accounts
      WHERE member_code = ${memberCode}
      LIMIT 1
    `;

    if (!accounts.length) {
      throw new HttpError(
        404,
        'Customer wallet not found.'
      );
    }

    // Record the purchase and update points atomically.
    // If the same purchase ID is submitted twice, the
    // unique order reference prevents double crediting.
    const rows = await sql`
      WITH inserted AS (
        INSERT INTO public.golden_loyalty_transactions (
          user_id,
          transaction_type,
          points_delta,
          amount_cents,
          channel,
          order_reference,
          description,
          created_by
        )
        VALUES (
          ${accounts[0].user_id}::uuid,
          'purchase',
          ${pointsAwarded},
          ${amountCents},
          ${channel},
          ${orderReference},
          ${
            description ||
            `Purchase recorded by ${admin.email}`
          },
          ${admin.id}
        )
        ON CONFLICT (order_reference) DO NOTHING
        RETURNING user_id, points_delta
      ),
      updated AS (
        UPDATE public.golden_loyalty_accounts a
        SET
          points_balance =
            a.points_balance + inserted.points_delta,
          total_earned_points =
            a.total_earned_points + inserted.points_delta,
          updated_at = now()
        FROM inserted
        WHERE a.user_id = inserted.user_id
        RETURNING
          a.member_code,
          a.points_balance
      )
      SELECT *
      FROM updated
    `;

    if (!rows.length) {
      throw new HttpError(
        409,
        'This purchase has already been recorded. No additional points were awarded.'
      );
    }

    return res.status(201).json({
      success: true,
      memberCode: rows[0].member_code,
      pointsAwarded,
      pointsBalance: rows[0].points_balance,
      orderReference,
      message: 'Purchase recorded successfully.',
    });

  } catch (error) {
    return sendError(res, error);
  }
};
