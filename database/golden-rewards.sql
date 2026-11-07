-- Golden Spreads Rewards schema
-- Run this once in the Neon SQL Editor on the production branch.
-- This script creates only Golden Spreads application tables; it does not modify neon_auth.

CREATE TABLE IF NOT EXISTS public.golden_loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  member_code text NOT NULL UNIQUE DEFAULT (
    'GS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  phone text,
  points_balance integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_earned_points integer NOT NULL DEFAULT 0 CHECK (total_earned_points >= 0),
  total_redeemed_points integer NOT NULL DEFAULT 0 CHECK (total_redeemed_points >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.golden_loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.golden_loyalty_accounts(user_id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (
    transaction_type IN ('purchase', 'redemption', 'adjustment', 'refund')
  ),
  points_delta integer NOT NULL CHECK (points_delta <> 0),
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  channel text CHECK (
    channel IS NULL OR channel IN ('whatsapp', 'instagram', 'phone', 'in_person', 'wallet', 'other')
  ),
  order_reference text UNIQUE,
  description text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.golden_reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.golden_loyalty_accounts(user_id) ON DELETE CASCADE,
  redemption_code text NOT NULL UNIQUE,
  points_spent integer NOT NULL CHECK (points_spent > 0),
  discount_cents integer NOT NULL CHECK (discount_cents > 0),
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_by text
);

CREATE INDEX IF NOT EXISTS golden_loyalty_transactions_user_created_idx
  ON public.golden_loyalty_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS golden_reward_redemptions_user_status_idx
  ON public.golden_reward_redemptions (user_id, status, created_at DESC);


-- =========================================================
-- GOLDEN SPREADS REDEMPTION IDEMPOTENCY
-- Keeps the original request ID to prevent double deduction.
-- =========================================================

ALTER TABLE public.golden_reward_redemptions
ADD COLUMN IF NOT EXISTS request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS
golden_reward_redemptions_user_request_uidx
ON public.golden_reward_redemptions (user_id, request_id)
WHERE request_id IS NOT NULL;


-- =========================================================
-- ATOMIC CUSTOMER REDEMPTION FUNCTION
-- 200 points = $1 discount
-- =========================================================

CREATE OR REPLACE FUNCTION public.golden_redeem_reward(
    p_user_id uuid,
    p_request_id uuid
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    redemption_code text,
    points_spent integer,
    discount_cents integer,
    status text,
    expires_at timestamptz,
    created_at timestamptz,
    replayed boolean
)
LANGUAGE plpgsql
AS $function$

DECLARE
    v_account public.golden_loyalty_accounts%ROWTYPE;
    v_redemption public.golden_reward_redemptions%ROWTYPE;
    v_code text;

BEGIN

    IF p_user_id IS NULL OR p_request_id IS NULL THEN
        RAISE EXCEPTION 'Invalid redemption request.'
        USING ERRCODE = '22023';
    END IF;

    -- Lock the customer's wallet.
    SELECT a.*
    INTO v_account
    FROM public.golden_loyalty_accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Return the original reward if this request
    -- was already processed.

    IF EXISTS (
        SELECT 1
        FROM public.golden_reward_redemptions r
        WHERE r.user_id = p_user_id
          AND r.request_id = p_request_id
    ) THEN

        RETURN QUERY
        SELECT
            r.id,
            r.user_id,
            r.redemption_code,
            r.points_spent,
            r.discount_cents,
            r.status,
            r.expires_at,
            r.created_at,
            TRUE
        FROM public.golden_reward_redemptions r
        WHERE r.user_id = p_user_id
          AND r.request_id = p_request_id;

        RETURN;
    END IF;

    -- Check available points.

    IF v_account.points_balance < 200 THEN
        RETURN;
    END IF;

    -- Generate a unique reward code.

    LOOP

        v_code := 'GS-' || UPPER(
            SUBSTR(
                REPLACE(gen_random_uuid()::text, '-', ''),
                1,
                16
            )
        );

        BEGIN

            INSERT INTO public.golden_reward_redemptions (
                user_id,
                request_id,
                redemption_code,
                points_spent,
                discount_cents,
                status,
                expires_at
            )
            VALUES (
                p_user_id,
                p_request_id,
                v_code,
                200,
                100,
                'issued',
                now() + interval '30 days'
            )
            RETURNING *
            INTO v_redemption;

            EXIT;

        EXCEPTION WHEN unique_violation THEN

            -- If this request already exists,
            -- return its original reward.

            IF EXISTS (
                SELECT 1
                FROM public.golden_reward_redemptions r
                WHERE r.user_id = p_user_id
                  AND r.request_id = p_request_id
            ) THEN

                RETURN QUERY
                SELECT
                    r.id,
                    r.user_id,
                    r.redemption_code,
                    r.points_spent,
                    r.discount_cents,
                    r.status,
                    r.expires_at,
                    r.created_at,
                    TRUE
                FROM public.golden_reward_redemptions r
                WHERE r.user_id = p_user_id
                  AND r.request_id = p_request_id;

                RETURN;

            END IF;

            -- Otherwise retry with another code.

        END;

    END LOOP;

    -- Deduct exactly 200 points.

    UPDATE public.golden_loyalty_accounts
    SET
        points_balance = points_balance - 200,
        total_redeemed_points = total_redeemed_points + 200,
        updated_at = now()
    WHERE golden_loyalty_accounts.user_id = p_user_id;

    -- Record the transaction.

    INSERT INTO public.golden_loyalty_transactions (
        user_id,
        transaction_type,
        points_delta,
        channel,
        description,
        created_by
    )
    VALUES (
        p_user_id,
        'redemption',
        -200,
        'wallet',
        'Redeemed 200 points for a $1 discount',
        p_user_id::text
    );

    -- Return the newly created reward.

    RETURN QUERY
    SELECT
        v_redemption.id,
        v_redemption.user_id,
        v_redemption.redemption_code,
        v_redemption.points_spent,
        v_redemption.discount_cents,
        v_redemption.status,
        v_redemption.expires_at,
        v_redemption.created_at,
        FALSE;

END;

$function$;
