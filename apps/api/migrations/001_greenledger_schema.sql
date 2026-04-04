-- GreenLedger Database Schema
-- Run this in Supabase SQL Editor to create all tables.
-- All teammates depend on this schema being live.

-- ---------------------------------------------------------------------------
-- Organizations & Auth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    firebase_uid TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_firebase_uid ON organizations(firebase_uid);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,     -- first 8 chars for display
    label TEXT DEFAULT 'default',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);

-- ---------------------------------------------------------------------------
-- Agents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,          -- developer-chosen, e.g. "procurement-agent-1"
    display_name TEXT,
    team_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(org_id);

-- ---------------------------------------------------------------------------
-- Model Benchmarks (Green Router reference data)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS model_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    quality_tier TEXT NOT NULL,

    energy_per_1k_tokens_wh NUMERIC,
    energy_per_query_wh_avg NUMERIC NOT NULL,

    reasoning_score NUMERIC,
    coding_score NUMERIC,
    math_score NUMERIC,
    eco_efficiency_score NUMERIC,

    parameter_count_b NUMERIC,
    available_regions TEXT[] DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Grid Carbon Intensity (polled from Electricity Maps)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grid_carbon_intensity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electricity_zone TEXT NOT NULL,
    carbon_intensity_gco2e_kwh NUMERIC NOT NULL,
    renewable_percentage NUMERIC,
    measured_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(electricity_zone, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_grid_latest
    ON grid_carbon_intensity(electricity_zone, measured_at DESC);

-- ---------------------------------------------------------------------------
-- Region ↔ Electricity Zone mapping
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS region_zone_mapping (
    cloud_region TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    electricity_zone TEXT NOT NULL,
    display_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC
);

-- ---------------------------------------------------------------------------
-- Carbon Wallets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carbon_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    team_id TEXT,
    monthly_budget_co2e_g NUMERIC NOT NULL,
    current_spend_co2e_g NUMERIC DEFAULT 0,
    on_exceeded TEXT DEFAULT 'downgrade_model',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_org ON carbon_wallets(org_id);
CREATE INDEX IF NOT EXISTS idx_wallets_agent ON carbon_wallets(agent_id);

-- ---------------------------------------------------------------------------
-- Wallet Transactions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES carbon_wallets(id) ON DELETE CASCADE,
    amount_co2e_g NUMERIC NOT NULL,
    type TEXT NOT NULL,
    receipt_id UUID,  -- filled after receipt is created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Receipts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id TEXT,

    action_type TEXT NOT NULL,  -- 'inference' | 'payment'
    model TEXT,
    provider TEXT,
    region TEXT,
    tokens_in INTEGER,
    tokens_out INTEGER,

    co2e_g NUMERIC NOT NULL,
    water_ml NUMERIC,
    energy_wh NUMERIC NOT NULL,

    grid_carbon_intensity NUMERIC,
    grid_renewable_pct NUMERIC,

    levy_usd NUMERIC,
    levy_destination TEXT,
    levy_status TEXT DEFAULT 'pending',

    naive_co2e_g NUMERIC,
    savings_pct NUMERIC,

    wallet_budget_remaining_g NUMERIC,
    wallet_monthly_budget_g NUMERIC,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_org_created ON receipts(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_agent ON receipts(agent_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Levy Transactions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS levy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES receipts(id),
    carbon_cost_g NUMERIC NOT NULL,
    levy_amount_usd NUMERIC NOT NULL,
    destination TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_levy_status ON levy_transactions(status);
CREATE INDEX IF NOT EXISTS idx_levy_org ON levy_transactions(org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Sustainability Scores
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sustainability_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    scope_id TEXT NOT NULL,
    score NUMERIC NOT NULL,
    components JSONB NOT NULL,
    period DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, scope, scope_id, period)
);

CREATE INDEX IF NOT EXISTS idx_scores_org ON sustainability_scores(org_id, period DESC);

-- ---------------------------------------------------------------------------
-- Recommendations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    scope_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_savings_co2e_g NUMERIC,
    estimated_savings_pct NUMERIC,
    priority TEXT DEFAULT 'medium',
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Org Settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org_settings (
    org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    carbon_price_per_ton_usd NUMERIC DEFAULT 100.0,
    levy_destination TEXT DEFAULT 'stripe_climate',
    default_carbon_priority TEXT DEFAULT 'low',
    default_quality TEXT DEFAULT 'standard',
    default_budget_exceeded_policy TEXT DEFAULT 'downgrade_model',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
