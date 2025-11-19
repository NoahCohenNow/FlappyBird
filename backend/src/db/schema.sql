-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creator Wallets
CREATE TABLE IF NOT EXISTS creator_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT UNIQUE NOT NULL,
    currency TEXT DEFAULT 'SOL',
    decimals INTEGER DEFAULT 9,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Events (Incoming transfers)
CREATE TABLE IF NOT EXISTS fee_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_sig TEXT UNIQUE NOT NULL,
    amount_raw BIGINT NOT NULL, -- raw lamports
    amount_native DECIMAL NOT NULL, -- converted SOL
    amount_usd DECIMAL NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Aggregate (Tracking cumulative fees for threshold)
CREATE TABLE IF NOT EXISTS fee_aggregate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_wallet_id UUID REFERENCES creator_wallets(id),
    cumulative_usd DECIMAL DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game Events (Mega Green Candle, etc.)
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'MEGA_GREEN_CANDLE', 'MANUAL_TRIGGER', 'DAILY_PAYOUT'
    params JSONB DEFAULT '{}',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    amount_usd_consumed DECIMAL,
    metadata JSONB DEFAULT '{}'
);

-- Players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scores
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    score INTEGER NOT NULL,
    game_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Leaderboard
CREATE TABLE IF NOT EXISTS daily_leaderboard (
    date DATE NOT NULL,
    player_id UUID REFERENCES players(id),
    total_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (date, player_id)
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    amount_usd DECIMAL NOT NULL,
    amount_sol DECIMAL NOT NULL,
    tx_sig TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
    attempt_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs (for simple queue persistence if needed, though we use BullMQ)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
