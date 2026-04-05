-- GreenLedger — Initial Schema
-- Run this in Supabase SQL Editor

-- -----------------------------------------------------------------------
-- Receipts — one row per inference
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agent_id TEXT NOT NULL,
    model TEXT,
    provider TEXT,
    tokens_in INTEGER,
    tokens_out INTEGER,
    latency_ms INTEGER,
    co2e_g NUMERIC NOT NULL DEFAULT 0,
    energy_wh NUMERIC NOT NULL DEFAULT 0,
    water_ml NUMERIC DEFAULT 0,
    levy_usd NUMERIC DEFAULT 0,
    levy_destination TEXT DEFAULT 'stripe_climate_frontier',
    levy_status TEXT DEFAULT 'confirmed',
    naive_co2e_g NUMERIC DEFAULT 0,
    savings_pct INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_agent ON receipts(agent_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp DESC);

-- -----------------------------------------------------------------------
-- Carbon Wallets — one row per agent
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carbon_wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_id TEXT UNIQUE NOT NULL,
    monthly_budget_co2e_g NUMERIC NOT NULL DEFAULT 10000,
    current_spend_co2e_g NUMERIC NOT NULL DEFAULT 0,
    on_exceeded TEXT NOT NULL DEFAULT 'downgrade_model',
    period_start TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
    period_end TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'),
    trend TEXT NOT NULL DEFAULT 'on_track',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_agent ON carbon_wallets(agent_id);

-- -----------------------------------------------------------------------
-- Wallet transactions — one row per deduction
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_id TEXT NOT NULL REFERENCES carbon_wallets(agent_id) ON DELETE CASCADE,
    receipt_id TEXT REFERENCES receipts(id),
    co2e_g NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txns_agent ON wallet_transactions(agent_id, timestamp DESC);
