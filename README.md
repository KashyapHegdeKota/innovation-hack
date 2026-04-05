# GreenLedger

**Carbon-aware AI infrastructure for the agentic economy**

GreenLedger sits between you and AI model providers, ensuring every inference is environmentally accountable. It automatically detects overkill model usage, suggests greener alternatives, and tracks CO2e, energy, and water consumption per query — with full environmental receipts.

---

## How It Works

```
You type a prompt
       |
       v
  [Green Router]  -- classifies task complexity
       |
       v
  "Overkill Detected!" -- suggests lighter model if appropriate
       |
       v
  [Inference] -- routes to selected provider (Anthropic / OpenAI / Google)
       |
       v
  [Environmental Receipt] -- CO2e, energy, water, carbon levy per query
       |
       v
  [Dashboard] -- real-time sustainability tracking across all sessions
```

---

</div>

---

## The Problem

Every AI inference has a carbon cost. Most teams never think about it.

When an agent calls `claude-opus-4-6` to summarize a two-sentence email, it burns **5–20× more energy** than necessary. Nobody measures it. Nobody offsets it. Nobody even knows it happened.

Meanwhile:

- **Google** emissions up **+50%** — driven by AI infrastructure
- **Meta** emissions up **+60%** — AI training and inference workloads
- **Microsoft** emissions up **+23%** — Azure AI + Copilot deployment
- **161M+** machine-to-machine agent transactions have already happened
- **$15 trillion** in B2B agent spend projected by 2028
- **0** real-time carbon trackers built for AI agents. Until now.

---

## What GreenLedger Does

GreenLedger is the **carbon accountability layer** for AI agents. It sits between your agent and the model provider, and handles everything:

```
Your Agent  →  GreenLedger  →  Best Model  →  Response + Environmental Receipt
                    ↓
              Carbon Levy  →  Stripe Climate (verified removal)
                    ↓
              Dashboard  →  Sustainability Score, Budget, Audit Trail
```

**One integration. Five primitives.**

| Primitive | What it does |
|-----------|-------------|
| 🌿 **Green Router** | Classifies prompt complexity. Routes to the cheapest model that meets your quality bar. Haiku handles ~80% of typical tasks. |
| 💳 **Carbon Wallet** | Per-agent carbon budgets. Auto-downgrades when budget runs low. Real-time balance API. |
| 🪙 **Carbon Levy** | Micro-levy per transaction, routed to verified carbon removal via Stripe Climate. Works with MPP, x402, AP2. |
| 🧾 **Receipt Engine** | Every inference produces a standardized environmental receipt — CO₂e, energy, water, offset, model, region. Open spec. |
| 📊 **Dashboard** | Company-wide sustainability scores, per-agent breakdowns, trend analysis, optimization recommendations. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GreenLedger Stack                        │
├──────────────┬──────────────────────┬───────────────────────────┤
│   Frontend   │      Backend API     │        Data Layer         │
│              │                      │                           │
│  Next.js 14  │  FastAPI (Python)    │  Supabase (PostgreSQL)    │
│  TypeScript  │  /v1/analyze         │  receipts                 │
│  Tailwind    │  /v1/infer           │  carbon_wallets           │
│  Framer      │  /v1/receipts        │  wallet_transactions      │
│  Motion      │  /v1/score           │                           │
│              │                      │                           │
│  Vercel      │  Render              │  Supabase Cloud           │
└──────────────┴──────────────────────┴───────────────────────────┘
                              ↑
                         CLI Tool
                    python3 -m cli.main
                    (Auth0 · Anthropic SDK)
```

### How the Green Router works

```
Prompt received
      │
      ▼
┌─────────────┐     low complexity      ┌──────────────────┐
│  Classifier │ ──────────────────────► │  claude-haiku-4-5│ ~80% of requests
│  (local LLM │                         └──────────────────┘
│   or rules) │    medium complexity    ┌──────────────────┐
│             │ ──────────────────────► │ claude-sonnet-4-6│ ~17% of requests
│             │                         └──────────────────┘
│             │     high complexity     ┌──────────────────┐
│             │ ──────────────────────► │  claude-opus-4-6 │  ~3% of requests
└─────────────┘                         └──────────────────┘
                                                 │
                                                 ▼
                                    ┌────────────────────────┐
                                    │  Environmental Receipt │
                                    │  co2e · energy · water │
                                    │  levy → Stripe Climate │
                                    └────────────────────────┘
```

---

## Repo Structure

```
innovation-hack/
├── apps/
│   ├── web/                    # Next.js 14 frontend (Vercel)
│   │   ├── app/
│   │   │   ├── dashboard/      # Main dashboard pages
│   │   │   │   ├── page.tsx    # Overview (grade hero + metrics)
│   │   │   │   ├── router/     # Green Router visualization
│   │   │   │   ├── agents/     # Per-agent leaderboard + detail
│   │   │   │   ├── wallets/    # Carbon wallet budgets
│   │   │   │   ├── levy/       # Carbon levy tracking
│   │   │   │   ├── receipts/   # Full receipt audit trail
│   │   │   │   └── cli/        # CLI installation guide
│   │   │   └── page.tsx        # Landing page
│   │   └── components/         # EmissionsChart, ModelPieChart, etc.
│   │
│   └── api/                    # FastAPI backend (Render)
│       ├── main.py             # App entry point + CORS
│       ├── store.py            # Supabase + in-memory store
│       ├── auth.py             # Auth0 JWT verification
│       └── routes/
│           ├── infer.py        # /v1/analyze + /v1/infer
│           ├── receipts.py     # /v1/receipts CRUD
│           ├── wallets.py      # /v1/wallets
│           └── score.py        # /v1/score + recommendations
│
├── cli/                        # Python CLI tool
│   ├── main.py                 # Interactive CLI entry
│   ├── router.py               # Complexity classifier
│   ├── models.py               # Model pricing + emission factors
│   └── receipt.py              # Receipt display + push
│
└── demo_seed.py                # Seed realistic demo data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project
- Auth0 tenant
- Anthropic API key

### 1. Clone & install

```bash
git clone https://github.com/KashyapHegdeKota/innovation-hack.git
cd innovation-hack

# Frontend
cd apps/web && npm install

# Backend
cd apps/api && pip install -r requirements.txt
```

### 2. Environment variables

**`apps/web/.env.local`**
```env
AUTH0_SECRET=<32-char-random-string>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<your-tenant>.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`apps/api/.env`**
```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
AUTH0_DOMAIN=<your-tenant>.auth0.com
AUTH0_AUDIENCE=https://<your-api-identifier>
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run locally

```bash
# Terminal 1 — Frontend
cd apps/web && npm run dev          # http://localhost:3000

# Terminal 2 — Backend
cd apps/api && uvicorn main:app --reload --port 8000
```

### 4. Use the CLI

```bash
# Install
pip install -e .

# Point at local backend
export ROUTER_URL=http://localhost:8000/v1/analyze
export INFER_URL=http://localhost:8000/v1/infer
export RECEIPTS_URL=http://localhost:8000/v1/receipts

# Run
python3 -m cli.main
```

### 5. Seed demo data

```bash
python3 demo_seed.py
```

---

## The Receipt Format

Every inference produces a machine-readable receipt:

```json
{
  "id": "rcpt_01jx...",
  "timestamp": "2025-04-05T14:32:11Z",
  "agent_id": "inbox-processor",
  "requested_model": "claude-opus-4-6",
  "model": "claude-haiku-4-5",
  "provider": "anthropic",
  "tokens_in": 120,
  "tokens_out": 340,
  "latency_ms": 420,
  "environmental_cost": {
    "co2e_g": 0.047,
    "energy_wh": 0.20,
    "water_ml": 0.36
  },
  "offset": {
    "levy_usd": 0.000024,
    "destination": "stripe_climate_frontier",
    "status": "confirmed"
  },
  "comparison": {
    "naive_co2e_g": 0.233,
    "savings_pct": 80
  }
}
```

---

## Sustainability Score

Each agent gets a 0–100 score and a letter grade:

| Score | Grade | Label |
|-------|-------|-------|
| 90–100 | A+ | Excellent |
| 80–89 | A | Excellent |
| 70–79 | B | Good |
| 55–69 | C | Fair |
| 40–54 | D | Poor |
| 0–39 | F | Critical |

Score is computed from routing efficiency, model selection accuracy, budget adherence, and offset coverage.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | Supabase (PostgreSQL) |
| Auth | Auth0 (JWT + PKCE) |
| Payments / Offset | Stripe Climate Orders API |
| AI | Anthropic Claude (Haiku · Sonnet · Opus) |
| Deployment | Vercel (frontend) · Render (API) · Supabase Cloud |
| CLI | Python, httpx, Rich |

---

## Carbon Math

Emission factors used (g CO₂e per 1K tokens):

| Model | Input | Output |
|-------|-------|--------|
| claude-haiku-4-5 | 0.00035 | 0.00140 |
| claude-sonnet-4-6 | 0.00042 | 0.00168 |
| claude-opus-4-6 | 0.00175 | 0.00700 |

Energy: `tokens × energy_per_token × grid_carbon_intensity`  
Water: estimated from datacenter PUE and WUE ratios  
Levy: `co2e_g × $0.0005/g` → routed to Stripe Climate Frontier portfolio

---

## Roadmap

- [x] Green Router (complexity-based model selection)
- [x] Carbon Wallet with per-agent budgets
- [x] Environmental receipts + audit trail
- [x] Carbon levy → Stripe Climate
- [x] Real-time dashboard (sustainability score, emissions chart)
- [x] CLI tool with Auth0 SSO
- [x] Supabase persistent storage
- [ ] OpenAI + Gemini provider support
- [ ] Webhook / SDK for direct integration
- [ ] Grid carbon intensity by region (real-time)
- [ ] CSRD / SEC climate disclosure export
- [ ] Multi-tenant org support
- [ ] Batch scheduling for off-peak inference

---

## Built at Innovation Hacks 2.0

> *"In 5 years, no serious company will deploy AI agents without carbon accountability. The same way no serious company deploys software without security today. We want to be the default way that happens."*

---

<div align="center">

Made with obsession by **Rahul Baweja** & **Kashyap Hegde Kota**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KashyapHegdeKota/innovation-hack)

</div>
