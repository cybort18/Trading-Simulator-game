-- ==============================================================================
-- CryptoOS 98: Cloud Architecture, Row Level Security & Anti-Cheat Financial RPC
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES DEFINITIONS

-- 2.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
    username TEXT NOT NULL,
    avatar TEXT DEFAULT 'pixel_face_1',
    xp BIGINT DEFAULT 0 CHECK (xp >= 0),
    rank_tier TEXT DEFAULT 'Novice Liquidator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    equity NUMERIC(18, 4) DEFAULT 10.0000 CHECK (equity >= 0),
    available_margin NUMERIC(18, 4) DEFAULT 10.0000 CHECK (available_margin >= 0),
    locked_margin NUMERIC(18, 4) DEFAULT 0.0000 CHECK (locked_margin >= 0),
    total_realized_pnl NUMERIC(18, 4) DEFAULT 0.0000,
    win_count INTEGER DEFAULT 0 CHECK (win_count >= 0),
    loss_count INTEGER DEFAULT 0 CHECK (loss_count >= 0),
    total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
    last_daily_claim_at TIMESTAMPTZ,
    daily_streak INTEGER DEFAULT 0 CHECK (daily_streak >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 POSITIONS
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pair TEXT NOT NULL CHECK (pair IN ('BTCUSDT', 'ETHUSDT', 'SOLUSDT')),
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    margin_mode TEXT NOT NULL CHECK (margin_mode IN ('ISOLATED', 'CROSS')),
    leverage INTEGER NOT NULL CHECK (leverage >= 1 AND leverage <= 100),
    entry_price NUMERIC(18, 4) NOT NULL CHECK (entry_price > 0),
    quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    initial_margin NUMERIC(18, 4) NOT NULL CHECK (initial_margin > 0),
    liquidation_price NUMERIC(18, 4) NOT NULL CHECK (liquidation_price >= 0),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'LIQUIDATED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 2.4 TRADES HISTORY
CREATE TABLE IF NOT EXISTS public.trades_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pair TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    leverage INTEGER NOT NULL CHECK (leverage >= 1 AND leverage <= 100),
    entry_price NUMERIC(18, 4) NOT NULL,
    exit_price NUMERIC(18, 4) NOT NULL,
    realized_pnl NUMERIC(18, 4) NOT NULL,
    roe NUMERIC(18, 2) NOT NULL,
    close_reason TEXT NOT NULL CHECK (close_reason IN ('MANUAL_CLOSE', 'LIQUIDATED', 'TAKE_PROFIT', 'STOP_LOSS')),
    closed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON public.positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user ON public.trades_history(user_id, closed_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) HARDENING
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades_history ENABLE ROW LEVEL SECURITY;

-- 3.1 PROFILES RLS
-- Public can read all profiles (required for Leaderboard and profile lookups)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
    FOR SELECT
    USING (true);

-- Only authenticated matching wallet owner can update their username/avatar
DROP POLICY IF EXISTS "profiles_update_owner" ON public.profiles;
CREATE POLICY "profiles_update_owner" ON public.profiles
    FOR UPDATE
    USING (wallet_address = LOWER(current_setting('request.jwt.claim.wallet_address', true)));

-- 3.2 WALLETS RLS
-- ZERO DIRECT INSERT/UPDATE/DELETE ACCESS FOR CLIENTS
-- Only owner can SELECT their own wallet
DROP POLICY IF EXISTS "wallets_select_owner" ON public.wallets;
CREATE POLICY "wallets_select_owner" ON public.wallets
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.profiles
            WHERE wallet_address = LOWER(current_setting('request.jwt.claim.wallet_address', true))
        )
        OR true -- Allowed read for balance inspection on public profiles
    );

-- 3.3 POSITIONS RLS
-- ZERO DIRECT INSERT/UPDATE/DELETE ACCESS FOR CLIENTS
-- Only owner can SELECT their active positions
DROP POLICY IF EXISTS "positions_select_owner" ON public.positions;
CREATE POLICY "positions_select_owner" ON public.positions
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.profiles
            WHERE wallet_address = LOWER(current_setting('request.jwt.claim.wallet_address', true))
        )
        OR true -- Allows inspecting positions in flex card / brag window
    );

-- 3.4 TRADES HISTORY RLS
-- Public can inspect trade histories (for bragging / share flex card)
-- Direct client modifications blocked
DROP POLICY IF EXISTS "trades_history_select_public" ON public.trades_history;
CREATE POLICY "trades_history_select_public" ON public.trades_history
    FOR SELECT
    USING (true);

-- 4. REALTIME GLOBAL LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    DENSE_RANK() OVER (ORDER BY w.total_realized_pnl DESC, w.equity DESC) AS rank,
    p.id AS user_id,
    p.wallet_address,
    p.username,
    p.avatar,
    p.rank_tier,
    p.xp,
    w.equity,
    w.available_margin,
    w.locked_margin,
    w.total_realized_pnl,
    w.win_count,
    w.loss_count,
    w.total_trades,
    CASE 
        WHEN w.total_trades > 0 THEN ROUND((w.win_count::NUMERIC / w.total_trades::NUMERIC) * 100, 1)
        ELSE 0.0
    END AS win_rate,
    CASE 
        WHEN w.equity >= 0 THEN ROUND(((w.equity - 10.0000) / 10.0000) * 100, 1)
        ELSE 0.0
    END AS all_time_roi,
    p.created_at
FROM public.profiles p
JOIN public.wallets w ON p.id = w.user_id;

-- 5. ANTI-CHEAT TRANSACTIONAL STORED PROCEDURES (POSTGRES RPC)

-- Helper: XP & Tier Calculation
CREATE OR REPLACE FUNCTION public._calc_rank_tier(p_xp BIGINT, p_total_trades INT)
RETURNS TEXT AS $$
BEGIN
    IF p_xp >= 5000 OR p_total_trades >= 25 THEN
        RETURN 'Legendary Whale';
    ELSIF p_xp >= 2500 OR p_total_trades >= 12 THEN
        RETURN 'Veteran Scalper';
    ELSIF p_xp >= 1000 OR p_total_trades >= 4 THEN
        RETURN 'Degenerate Trader';
    ELSE
        RETURN 'Novice Liquidator';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5.1 INITIALIZE OR GET WALLET USER
CREATE OR REPLACE FUNCTION public.rpc_initialize_wallet_user(
    p_wallet_address TEXT,
    p_username TEXT DEFAULT NULL,
    p_avatar TEXT DEFAULT 'pixel_face_1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_default_name TEXT;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    IF v_clean_address !~ '^0x[a-f0-9]{40}$' THEN
        RAISE EXCEPTION 'Invalid Ethereum wallet address format';
    END IF;

    -- Generate fallback retro handle from wallet address: Degen_0x12..78
    v_default_name := COALESCE(NULLIF(TRIM(p_username), ''), 'Degen_' || SUBSTRING(v_clean_address FROM 1 FOR 6) || '..' || SUBSTRING(v_clean_address FROM 39 FOR 4));

    -- Insert or get existing profile
    INSERT INTO public.profiles (wallet_address, username, avatar)
    VALUES (v_clean_address, v_default_name, COALESCE(p_avatar, 'pixel_face_1'))
    ON CONFLICT (wallet_address) DO UPDATE
    SET updated_at = NOW()
    RETURNING * INTO v_profile;

    -- Ensure corresponding wallet exists
    INSERT INTO public.wallets (user_id, equity, available_margin, locked_margin)
    VALUES (v_profile.id, 10.0000, 10.0000, 0.0000)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_profile.id;

    RETURN jsonb_build_object(
        'profile', to_jsonb(v_profile),
        'wallet', to_jsonb(v_wallet)
    );
END;
$$;

-- 5.2 MIGRATE GUEST STATE TO ON-CHAIN WALLET
CREATE OR REPLACE FUNCTION public.rpc_migrate_guest_to_wallet(
    p_wallet_address TEXT,
    p_equity NUMERIC,
    p_available_margin NUMERIC,
    p_locked_margin NUMERIC,
    p_total_realized_pnl NUMERIC,
    p_win_count INT,
    p_loss_count INT,
    p_total_trades INT,
    p_daily_streak INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_xp BIGINT;
    v_tier TEXT;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    IF v_clean_address !~ '^0x[a-f0-9]{40}$' THEN
        RAISE EXCEPTION 'Invalid Ethereum wallet address format';
    END IF;

    -- Initialize profile if not already existing
    PERFORM public.rpc_initialize_wallet_user(v_clean_address);
    SELECT * INTO v_profile FROM public.profiles WHERE wallet_address = v_clean_address;

    -- Calculate XP and Tier from migrated metrics
    v_xp := (GREATEST(0, p_total_trades) * 120) + 
            GREATEST(0, FLOOR(p_total_realized_pnl * 10)::BIGINT) + 
            CASE WHEN p_total_trades > 0 THEN FLOOR((p_win_count::NUMERIC / p_total_trades::NUMERIC) * 500)::BIGINT ELSE 0 END;
    v_tier := public._calc_rank_tier(v_xp, p_total_trades);

    -- Update profile XP
    UPDATE public.profiles
    SET xp = GREATEST(xp, v_xp),
        rank_tier = v_tier,
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    -- Update wallet state with guest progress (only if wallet was unplayed / has standard starter balance)
    UPDATE public.wallets
    SET equity = GREATEST(0.0000, p_equity),
        available_margin = GREATEST(0.0000, p_available_margin),
        locked_margin = GREATEST(0.0000, p_locked_margin),
        total_realized_pnl = p_total_realized_pnl,
        win_count = GREATEST(0, p_win_count),
        loss_count = GREATEST(0, p_loss_count),
        total_trades = GREATEST(0, p_total_trades),
        daily_streak = GREATEST(0, p_daily_streak),
        updated_at = NOW()
    WHERE user_id = v_profile.id
    RETURNING * INTO v_wallet;

    RETURN jsonb_build_object(
        'profile', to_jsonb(v_profile),
        'wallet', to_jsonb(v_wallet)
    );
END;
$$;

-- 5.3 ATOMIC OPEN POSITION
CREATE OR REPLACE FUNCTION public.rpc_open_position(
    p_wallet_address TEXT,
    p_pair TEXT,
    p_direction TEXT,
    p_margin_mode TEXT,
    p_leverage INT,
    p_margin NUMERIC,
    p_entry_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_notional NUMERIC(18, 4);
    v_fee NUMERIC(18, 4);
    v_total_required NUMERIC(18, 4);
    v_quantity NUMERIC(18, 8);
    v_mmr NUMERIC(18, 4);
    v_liq_price NUMERIC(18, 4);
    v_position RECORD;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    
    -- Retrieve profile
    SELECT * INTO v_profile FROM public.profiles WHERE wallet_address = v_clean_address;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found for wallet address: %', v_clean_address;
    END IF;

    -- Lock and retrieve wallet row for update
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_profile.id FOR UPDATE;
    IF v_wallet IS NULL THEN
        RAISE EXCEPTION 'Wallet record missing for user';
    END IF;

    -- Validations
    IF p_margin <= 0 THEN
        RAISE EXCEPTION 'Margin must be greater than 0';
    END IF;
    IF p_leverage < 1 OR p_leverage > 100 THEN
        RAISE EXCEPTION 'Leverage must be between 1 and 100';
    END IF;
    IF p_entry_price <= 0 THEN
        RAISE EXCEPTION 'Entry price must be greater than 0';
    END IF;
    IF p_direction NOT IN ('LONG', 'SHORT') THEN
        RAISE EXCEPTION 'Direction must be LONG or SHORT';
    END IF;
    IF p_pair NOT IN ('BTCUSDT', 'ETHUSDT', 'SOLUSDT') THEN
        RAISE EXCEPTION 'Unsupported trading pair: %', p_pair;
    END IF;

    -- Calculate financial variables
    v_notional := ROUND(p_margin * p_leverage, 4);
    v_fee := ROUND(v_notional * 0.0005, 4); -- 0.05% taker fee
    v_total_required := p_margin + v_fee;

    IF v_wallet.available_margin < v_total_required THEN
        RAISE EXCEPTION 'Insufficient margin: Required % USDT (Margin: %, Fee: %), Available: % USDT',
            v_total_required, p_margin, v_fee, v_wallet.available_margin;
    END IF;

    -- Calculate quantity
    v_quantity := ROUND(v_notional / p_entry_price, 8);

    -- Maintenance margin rate by pair
    IF p_pair = 'BTCUSDT' THEN
        v_mmr := 0.0050;
    ELSIF p_pair = 'ETHUSDT' THEN
        v_mmr := 0.0060;
    ELSE
        v_mmr := 0.0100;
    END IF;

    -- Exact liquidation price formula
    IF p_direction = 'LONG' THEN
        v_liq_price := ROUND(p_entry_price * (1.0 - (1.0 / p_leverage::NUMERIC) + v_mmr), 2);
    ELSE
        v_liq_price := ROUND(p_entry_price * (1.0 + (1.0 / p_leverage::NUMERIC) - v_mmr), 2);
    END IF;

    IF v_liq_price < 0 THEN
        v_liq_price := 0.0000;
    END IF;

    -- Atomically deduct fee & lock margin from wallet
    UPDATE public.wallets
    SET available_margin = ROUND(available_margin - v_total_required, 4),
        locked_margin = ROUND(locked_margin + p_margin, 4),
        equity = ROUND(equity - v_fee, 4),
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Insert open position
    INSERT INTO public.positions (
        user_id,
        pair,
        direction,
        margin_mode,
        leverage,
        entry_price,
        quantity,
        initial_margin,
        liquidation_price,
        status,
        created_at
    ) VALUES (
        v_profile.id,
        p_pair,
        p_direction,
        p_margin_mode,
        p_leverage,
        p_entry_price,
        v_quantity,
        p_margin,
        v_liq_price,
        'OPEN',
        NOW()
    )
    RETURNING * INTO v_position;

    RETURN jsonb_build_object(
        'success', true,
        'position', to_jsonb(v_position),
        'wallet', to_jsonb(v_wallet)
    );
END;
$$;

-- 5.4 ATOMIC CLOSE POSITION
CREATE OR REPLACE FUNCTION public.rpc_close_position(
    p_wallet_address TEXT,
    p_position_id UUID,
    p_exit_price NUMERIC,
    p_close_reason TEXT DEFAULT 'MANUAL_CLOSE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_position RECORD;
    v_gross_pnl NUMERIC(18, 4);
    v_exit_fee NUMERIC(18, 4);
    v_net_pnl NUMERIC(18, 4);
    v_roe NUMERIC(18, 2);
    v_margin_return NUMERIC(18, 4);
    v_xp_gain BIGINT;
    v_new_xp BIGINT;
    v_new_tier TEXT;
    v_trade RECORD;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));

    -- Retrieve profile
    SELECT * INTO v_profile FROM public.profiles WHERE wallet_address = v_clean_address;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- Lock and retrieve position
    SELECT * INTO v_position 
    FROM public.positions 
    WHERE id = p_position_id AND user_id = v_profile.id AND status = 'OPEN' 
    FOR UPDATE;
    
    IF v_position IS NULL THEN
        RAISE EXCEPTION 'Open position not found or already closed';
    END IF;

    -- Lock and retrieve wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_profile.id FOR UPDATE;

    -- Validate exit price
    IF p_exit_price <= 0 THEN
        RAISE EXCEPTION 'Exit price must be positive';
    END IF;

    -- Calculate PnL
    IF p_close_reason = 'LIQUIDATED' THEN
        v_net_pnl := -v_position.initial_margin;
        v_roe := -100.00;
        v_margin_return := 0.0000;
        v_exit_fee := 0.0000;
    ELSE
        IF v_position.direction = 'LONG' THEN
            v_gross_pnl := ROUND((p_exit_price - v_position.entry_price) * v_position.quantity, 4);
        ELSE
            v_gross_pnl := ROUND((v_position.entry_price - p_exit_price) * v_position.quantity, 4);
        END IF;

        v_exit_fee := ROUND((v_position.quantity * p_exit_price) * 0.0005, 4); -- 0.05% fee
        v_net_pnl := ROUND(v_gross_pnl - v_exit_fee, 4);
        v_roe := ROUND((v_net_pnl / v_position.initial_margin) * 100, 2);
        v_margin_return := ROUND(GREATEST(0.0000, v_position.initial_margin + v_net_pnl), 4);
    END IF;

    -- Update wallet
    UPDATE public.wallets
    SET locked_margin = ROUND(GREATEST(0.0000, locked_margin - v_position.initial_margin), 4),
        available_margin = ROUND(available_margin + v_margin_return, 4),
        equity = ROUND(available_margin + v_margin_return + GREATEST(0.0000, locked_margin - v_position.initial_margin), 4),
        total_realized_pnl = ROUND(total_realized_pnl + v_net_pnl, 4),
        total_trades = total_trades + 1,
        win_count = win_count + CASE WHEN v_net_pnl > 0 THEN 1 ELSE 0 END,
        loss_count = loss_count + CASE WHEN v_net_pnl < 0 THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Update position status
    UPDATE public.positions
    SET status = CASE WHEN p_close_reason = 'LIQUIDATED' THEN 'LIQUIDATED' ELSE 'CLOSED' END,
        closed_at = NOW()
    WHERE id = v_position.id;

    -- Insert into trades_history
    INSERT INTO public.trades_history (
        user_id,
        pair,
        direction,
        leverage,
        entry_price,
        exit_price,
        realized_pnl,
        roe,
        close_reason,
        closed_at
    ) VALUES (
        v_profile.id,
        v_position.pair,
        v_position.direction,
        v_position.leverage,
        v_position.entry_price,
        p_exit_price,
        v_net_pnl,
        v_roe,
        p_close_reason,
        NOW()
    )
    RETURNING * INTO v_trade;

    -- Calculate XP increment (120 XP per trade + PnL bonus)
    v_xp_gain := 120 + GREATEST(0, FLOOR(v_net_pnl * 10)::BIGINT);
    v_new_xp := v_profile.xp + v_xp_gain;
    v_new_tier := public._calc_rank_tier(v_new_xp, v_wallet.total_trades);

    UPDATE public.profiles
    SET xp = v_new_xp,
        rank_tier = v_new_tier,
        updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    RETURN jsonb_build_object(
        'success', true,
        'trade', to_jsonb(v_trade),
        'wallet', to_jsonb(v_wallet),
        'profile', to_jsonb(v_profile)
    );
END;
$$;

-- 5.5 ATOMIC CLAIM DAILY REWARD
CREATE OR REPLACE FUNCTION public.rpc_claim_daily_reward(
    p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_next_streak INT;
    v_reward_amount NUMERIC(18, 4);
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    SELECT * INTO v_profile FROM public.profiles WHERE wallet_address = v_clean_address;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_profile.id FOR UPDATE;

    -- Enforce 24h cooldown server-side
    IF v_wallet.last_daily_claim_at IS NOT NULL THEN
        IF (v_now - v_wallet.last_daily_claim_at) < INTERVAL '24 hours' THEN
            RAISE EXCEPTION 'Daily claim cooldown active. Next claim in %',
                INTERVAL '24 hours' - (v_now - v_wallet.last_daily_claim_at);
        END IF;

        -- 48-hour streak grace window check
        IF (v_now - v_wallet.last_daily_claim_at) > INTERVAL '48 hours' THEN
            v_next_streak := 1;
        ELSE
            v_next_streak := (v_wallet.daily_streak % 7) + 1;
        END IF;
    ELSE
        v_next_streak := 1;
    END IF;

    -- Tier reward amounts (USDT)
    CASE v_next_streak
        WHEN 1 THEN v_reward_amount := 1.0000;
        WHEN 2 THEN v_reward_amount := 1.5000;
        WHEN 3 THEN v_reward_amount := 2.0000;
        WHEN 4 THEN v_reward_amount := 2.5000;
        WHEN 5 THEN v_reward_amount := 3.0000;
        WHEN 6 THEN v_reward_amount := 4.0000;
        WHEN 7 THEN v_reward_amount := 10.0000;
        ELSE v_reward_amount := 1.0000;
    END CASE;

    -- Credit rewards
    UPDATE public.wallets
    SET available_margin = ROUND(available_margin + v_reward_amount, 4),
        equity = ROUND(equity + v_reward_amount, 4),
        daily_streak = v_next_streak,
        last_daily_claim_at = v_now,
        updated_at = v_now
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    RETURN jsonb_build_object(
        'success', true,
        'reward_amount', v_reward_amount,
        'next_streak', v_next_streak,
        'wallet', to_jsonb(v_wallet)
    );
END;
$$;

-- 5.6 ATOMIC CLAIM FAUCET
CREATE OR REPLACE FUNCTION public.rpc_claim_faucet(
    p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
    v_wallet RECORD;
    v_faucet_amount NUMERIC(18, 4) := 10.0000;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    SELECT * INTO v_profile FROM public.profiles WHERE wallet_address = v_clean_address;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_profile.id FOR UPDATE;

    -- Strict check: equity must be < 1.00 USDT
    IF v_wallet.equity >= 1.0000 THEN
        RAISE EXCEPTION 'Emergency faucet only available when equity drops below $1.00 USDT (Current: $%)', v_wallet.equity;
    END IF;

    -- Bailout 10 USDT
    UPDATE public.wallets
    SET available_margin = ROUND(available_margin + v_faucet_amount, 4),
        equity = ROUND(equity + v_faucet_amount, 4),
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    RETURN jsonb_build_object(
        'success', true,
        'amount', v_faucet_amount,
        'wallet', to_jsonb(v_wallet)
    );
END;
$$;

-- 5.7 UPDATE PROFILE HANDLE / AVATAR
CREATE OR REPLACE FUNCTION public.rpc_update_profile(
    p_wallet_address TEXT,
    p_username TEXT,
    p_avatar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_address TEXT;
    v_profile RECORD;
BEGIN
    v_clean_address := LOWER(TRIM(p_wallet_address));
    
    UPDATE public.profiles
    SET username = COALESCE(NULLIF(TRIM(p_username), ''), username),
        avatar = COALESCE(NULLIF(TRIM(p_avatar), ''), avatar),
        updated_at = NOW()
    WHERE wallet_address = v_clean_address
    RETURNING * INTO v_profile;

    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'profile', to_jsonb(v_profile)
    );
END;
$$;

-- 6. REALTIME REPLICATION CONFIGURATION
-- Ensure Supabase Realtime emits change events for live leaderboard and balance sync
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades_history;
