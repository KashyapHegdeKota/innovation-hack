# GreenLedger — Technical Architecture

---

## System Overview

GreenLedger is composed of five core services, a client SDK, and a web dashboard. The system is designed as a set of loosely coupled services that communicate via REST APIs and an event bus.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ GreenLedger │  │ Python SDK  │  │  Node SDK    │  │ REST API   │ │
│  │    CLI      │  │ (future)    │  │  (future)    │  │ (direct)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └──────┬─────┘ │
└─────────┼────────────────┼────────────────┼─────────────────┼───────┘
          │                │                │                 │
          ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                   │
│               (FastAPI — apps/api)                                   │
│                                                                     │
│  - Authentication (Firebase JWT)                                    │
│  - Rate limiting                                                    │
│  - Request routing                                                  │
│  - API key management                                               │
└────────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
         │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  GREEN   │ │  CARBON  │ │  LEVY    │ │ RECEIPT  │ │ SCORING  │
│  ROUTER  │ │  WALLET  │ │  ENGINE  │ │  ENGINE  │ │  ENGINE  │
│          │ │          │ │          │ │          │ │          │
│ Model +  │ │ Budget   │ │ Carbon   │ │ Generate │ │ Compute  │
│ region   │ │ tracking │ │ cost →   │ │ standard │ │ sustain- │
│ selection│ │ enforce  │ │ payment  │ │ receipts │ │ ability  │
│          │ │ limits   │ │ routing  │ │          │ │ scores   │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │
     ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │   Supabase    │  │    Redis      │  │   External APIs         │ │
│  │  (PostgreSQL) │  │   (Cache)     │  │                         │ │
│  │               │  │               │  │  - Electricity Maps     │ │
│  │  - Wallets    │  │  - Grid data  │  │  - Stripe Climate API   │ │
│  │  - Receipts   │  │  - Model      │  │  - AI Provider APIs     │ │
│  │  - Scores     │  │    scores     │  │  - Cloud region APIs    │ │
│  │  - Orgs/Users │  │  - Route      │  │                         │ │
│  │  - Agents     │  │    cache      │  │                         │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Services

### 1. Green Router Service

**Purpose:** Given a task's quality/latency requirements and a carbon priority, select the optimal model + compute region.

**Inputs:**
- `quality`: "low" | "medium" | "high" (maps to model capability tiers)
- `carbon_priority`: "lowest" | "low" | "balanced" | "none"
- `max_latency_ms`: optional latency constraint
- `provider_allowlist`: optional (e.g., only Anthropic and OpenAI)

**Decision Logic:**
```
1. Fetch real-time grid carbon intensity for all available regions
   (Source: Electricity Maps API, cached in Redis with 5-min TTL)

2. Fetch model eco-efficiency scores
   (Source: our benchmarks table, updated weekly)

3. Filter models that meet the quality bar

4. Filter regions that meet the latency constraint

5. Score remaining options:
   score = (eco_efficiency * carbon_weight) + (cost_efficiency * cost_weight)
   where carbon_weight is derived from carbon_priority

6. Return top option: {model, region, provider, estimated_co2e}
```

**Data Dependencies:**
- `grid_carbon_intensity` table — region, gCO2e/kWh, timestamp (refreshed every 5 min)
- `model_benchmarks` table — model_id, energy_per_1k_tokens_wh, eco_efficiency_score, quality_tier

**API:**
```
POST /v1/route
{
  "quality": "high",
  "carbon_priority": "low",
  "max_latency_ms": 3000,
  "provider_allowlist": ["anthropic", "openai"]
}

Response:
{
  "model": "claude-sonnet-4-6",
  "provider": "anthropic",
  "region": "us-west-2",
  "grid_carbon_intensity_gco2e_kwh": 89,
  "estimated_co2e_g": 0.08,
  "estimated_energy_wh": 0.24
}
```

---

### 2. Carbon Wallet Service

**Purpose:** Track and enforce carbon budgets per agent, team, and organization.

**Database Schema:**
```sql
-- Wallets
CREATE TABLE carbon_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    agent_id TEXT NOT NULL,
    team_id TEXT,
    monthly_budget_co2e_g NUMERIC NOT NULL,
    current_spend_co2e_g NUMERIC DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    on_exceeded TEXT DEFAULT 'downgrade_model', -- 'downgrade_model' | 'defer' | 'offset' | 'block'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, agent_id)
);

-- Wallet transactions (every deduction/credit)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES carbon_wallets(id),
    amount_co2e_g NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'deduction' | 'offset_credit' | 'budget_reset'
    receipt_id UUID REFERENCES receipts(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Logic:**
```
On every infer() call:
  1. Look up wallet for agent_id
  2. Check: current_spend + estimated_co2e <= monthly_budget?
     - YES → proceed, deduct estimated amount
     - NO → execute on_exceeded policy:
       - downgrade_model: re-route to a lighter model via Green Router
       - defer: return a "deferred" status, queue task for off-peak
       - offset: auto-purchase offset credits, proceed
       - block: return error, agent cannot proceed
  3. After execution, reconcile: replace estimate with actual cost
```

**API:**
```
POST   /v1/wallets                    — create wallet
GET    /v1/wallets/:agent_id          — get wallet status
PATCH  /v1/wallets/:agent_id          — update budget/policy
GET    /v1/wallets/:agent_id/history  — transaction history
POST   /v1/wallets/:agent_id/offset   — manually purchase offset credits
```

---

### 3. Levy Engine Service

**Purpose:** Calculate carbon cost of each AI action and route a micro-levy to carbon removal.

**Carbon Cost Calculation:**
```
carbon_cost_g = energy_consumed_wh * grid_carbon_intensity_gco2e_kwh / 1000

where:
  energy_consumed_wh = tokens_processed * energy_per_token_wh(model)
  grid_carbon_intensity = lookup(region, timestamp) from Electricity Maps

levy_usd = carbon_cost_g * carbon_price_per_gram
  (carbon_price derived from current voluntary carbon market rates
   or company-configured rate)
```

**Levy Routing:**
```
1. Calculate levy amount
2. If org has Stripe Climate integration:
   → Route via Stripe Climate Orders API to Frontier portfolio
3. If org has custom carbon removal partner:
   → Route to their configured endpoint
4. Default:
   → Accumulate in GreenLedger pooled fund, batch-purchase monthly
```

**Integration with Payment Rails:**
```
When gl.pay() is called:
  1. Calculate total carbon cost of the inference chain that led to this payment
  2. Add levy to payment metadata
  3. Execute payment via configured protocol (Stripe MPP / x402 / AP2)
  4. Execute levy payment separately to carbon removal endpoint
  5. Link both in the receipt
```

---

### 4. Receipt Engine Service

**Purpose:** Generate standardized environmental receipts for every AI action.

**Receipt Schema:**
```json
{
  "receipt_id": "rcpt_abc123",
  "timestamp": "2026-04-04T14:32:00Z",
  "org_id": "org_xyz",
  "agent_id": "procurement-agent-1",

  "action": {
    "type": "inference",
    "model": "claude-sonnet-4-6",
    "provider": "anthropic",
    "region": "us-west-2",
    "tokens_in": 1200,
    "tokens_out": 450
  },

  "environmental_cost": {
    "co2e_g": 0.08,
    "water_ml": 0.3,
    "energy_wh": 0.28
  },

  "grid": {
    "carbon_intensity_gco2e_kwh": 89,
    "renewable_percentage": 78
  },

  "offset": {
    "levy_usd": 0.002,
    "destination": "stripe_climate_frontier",
    "status": "completed"
  },

  "wallet": {
    "budget_remaining_co2e_g": 32400,
    "monthly_budget_co2e_g": 50000
  },

  "comparison": {
    "vs_naive_co2e_g": 0.31,
    "savings_percentage": 74
  }
}
```

**Database Schema:**
```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    agent_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
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
    levy_status TEXT,
    naive_co2e_g NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_receipts_org_created ON receipts(org_id, created_at);
CREATE INDEX idx_receipts_agent ON receipts(agent_id, created_at);
```

**API:**
```
GET  /v1/receipts/:receipt_id          — single receipt
GET  /v1/receipts?agent_id=X&from=&to= — list receipts with filters
GET  /v1/receipts/export?format=csv     — export for compliance
```

---

### 5. Scoring Engine Service

**Purpose:** Compute sustainability scores at agent, team, and org level.

**Score Components:**
```
Agent Sustainability Score (0-100) =
  (carbon_efficiency_score * 0.30)     — how green are your model/region choices?
  + (budget_adherence_score * 0.20)    — are you staying within carbon budgets?
  + (offset_coverage_score * 0.20)     — what % of emissions are offset?
  + (optimization_adoption * 0.15)     — are you following optimization suggestions?
  + (trend_score * 0.15)              — are you improving month over month?
```

**Computed daily, stored:**
```sql
CREATE TABLE sustainability_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    scope TEXT NOT NULL,       -- 'agent' | 'team' | 'org'
    scope_id TEXT NOT NULL,    -- agent_id, team_id, or org_id
    score NUMERIC NOT NULL,
    components JSONB NOT NULL, -- breakdown of each component
    period DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, scope, scope_id, period)
);
```

**API:**
```
GET /v1/scores/:org_id                     — org-level score + trend
GET /v1/scores/:org_id/agents              — all agent scores
GET /v1/scores/:org_id/agents/:agent_id    — single agent detail
GET /v1/scores/:org_id/benchmarks          — industry comparison
GET /v1/scores/:org_id/recommendations     — optimization suggestions
```

---

## Database Schema Overview

```sql
-- Core tables
organizations          — company accounts
api_keys               — SDK authentication
agents                 — registered AI agents per org

-- Green Router data
grid_carbon_intensity  — real-time grid data (cached from Electricity Maps)
model_benchmarks       — energy/efficiency per model (updated weekly)
routing_decisions      — log of every routing decision made

-- Carbon Wallet
carbon_wallets         — budgets per agent
wallet_transactions    — every debit/credit

-- Receipts
receipts               — every environmental receipt generated

-- Scoring
sustainability_scores  — daily computed scores
recommendations        — generated optimization suggestions

-- Levy
levy_transactions      — every levy calculated and routed
levy_destinations      — configured carbon removal endpoints per org
```

---

## External API Integrations

### Electricity Maps (grid carbon intensity)
```
GET https://api.electricitymap.org/v3/carbon-intensity/latest?zone={zone}
Response: { "zone": "US-CAL-CISO", "carbonIntensity": 89, "datetime": "..." }
```
- Polled every 5 minutes per active region
- Cached in Redis
- Fallback: static average values per region from EPA/IEA data

### Stripe Climate Orders (carbon removal)
```
POST https://api.stripe.com/v1/climate/orders
{ "metric_tons": 0.00005, "currency": "usd" }
```
- Batched: individual levies are pooled and submitted hourly
- Minimum order thresholds handled by pooling

### AI Provider APIs (inference routing)
- Anthropic Messages API
- OpenAI Chat Completions API
- Google Gemini API
- Each wrapped with energy metering (token counts + model benchmark lookup)

---

## Tech Stack Mapping to Existing Repo

```
apps/
  api/                  ← FastAPI backend (already exists)
    main.py             ← API gateway, route registration
    auth.py             ← Firebase JWT verification (already exists)
    database.py         ← Supabase client (already exists)
    services/
      router.py         ← Green Router service
      wallet.py         ← Carbon Wallet service
      levy.py           ← Levy Engine service
      receipt.py        ← Receipt Engine service
      scoring.py        ← Scoring Engine service
    models/
      schemas.py        ← Pydantic models for all request/response types
    integrations/
      electricity_maps.py  ← Grid carbon intensity client
      stripe_climate.py    ← Stripe Climate Orders client
      ai_providers.py      ← Unified AI provider interface
    routes/
      infer.py          ← POST /v1/infer endpoint
      pay.py            ← POST /v1/pay endpoint
      wallets.py        ← Wallet CRUD endpoints
      receipts.py       ← Receipt query endpoints
      scores.py         ← Score query endpoints
    jobs/
      grid_refresh.py   ← Background job: poll Electricity Maps
      levy_batch.py     ← Background job: batch levy submissions
      score_compute.py  ← Daily job: compute sustainability scores

  web/                  ← Next.js frontend (already exists)
    app/
      dashboard/
        page.tsx        ← Main dashboard (extend with GreenLedger widgets)
        agents/
          page.tsx      ← Per-agent carbon view
          [id]/
            page.tsx    ← Single agent detail
        receipts/
          page.tsx      ← Receipt explorer
        scores/
          page.tsx      ← Sustainability scores + benchmarks
        settings/
          page.tsx      ← Wallet configs, levy settings, integrations
    components/
      CarbonGauge.tsx       ← Visual carbon budget gauge
      ReceiptCard.tsx       ← Single receipt display
      SustainabilityScore.tsx ← Score badge/chart
      EmissionsChart.tsx    ← Time-series emissions chart
      GreenRouterViz.tsx    ← Visual of routing decision

sdk/                    ← NEW: Client SDKs
  python/
    greenledger/
      client.py         ← Main client class
      router.py         ← Green routing helpers
      wallet.py         ← Wallet management
      types.py          ← Type definitions
    setup.py
  node/
    src/
      index.ts          ← Main client class
      types.ts
    package.json

docs/                   ← Project documentation (this folder)
```

---

## Security Considerations

- All API calls authenticated via Firebase JWT or API key
- API keys scoped per organization, never exposed client-side
- Carbon wallet operations are atomic (no double-spend)
- Levy routing uses Stripe's PCI-compliant infrastructure
- Receipt data is org-isolated (Supabase RLS by org_id)
- Grid data and model benchmarks are non-sensitive, cached aggressively
- No AI provider API keys stored in GreenLedger — orgs provide their own or use our proxy
