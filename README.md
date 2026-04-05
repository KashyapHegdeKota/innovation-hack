# GreenLedger

**Carbon-aware AI infrastructure for the agentic economy.**

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

## Features

- **Smart Model Router** — Analyzes prompt complexity and recommends the most eco-efficient model. A simple "hello" doesn't need Opus.
- **Environmental Receipts** — Every query generates a receipt: CO2e (grams), energy (Wh), water (mL), and a carbon micro-levy (USD).
- **11 Models, 5 Tiers** — From GPT-4.1 Nano (0.10 Wh) to o3 (33 Wh). 100x energy range means model selection is the #1 carbon lever.
- **BYOK (Bring Your Own Key)** — Use your own API keys. GreenLedger routes requests using your keys with encrypted storage.
- **API Key Validation** — Keys are validated against provider APIs during setup. Invalid keys are rejected immediately.
- **Sustainability Dashboard** — Track CO2e, energy, water, and carbon levy across agents and sessions. View routing decisions, agent leaderboards, and optimization recommendations.
- **Session Tracking** — Cumulative stats per CLI session: total CO2e, energy, water, and router acceptance rate.
- **Fun Guilt Trips** — Reject a greener suggestion and get a random ASCII art guilt trip. A polar bear judges you.

---

## Architecture

```
greenledger (CLI)          apps/web (Dashboard)
     |                          |
     v                          v
apps/api (FastAPI Backend on Render)
     |
     +-- /v1/analyze    Green Router (task classification)
     +-- /v1/infer      Inference + receipt generation
     +-- /v1/models     Model registry (sorted by eco_score)
     |
     v
Supabase (receipts, user data)
     |
     v
AI Providers (Anthropic, OpenAI, Google)
```

| Component | Tech | Deployed On |
|-----------|------|-------------|
| CLI | Python, Rich, Prompt Toolkit | PyPI (`pip install greenledger`) |
| Backend API | FastAPI, Pydantic | Render |
| Dashboard | Next.js 14, TypeScript, Tailwind, Recharts | Vercel |
| Database | Supabase (PostgreSQL) | Supabase Cloud |
| Auth | Auth0 (Device Code Flow) | Auth0 |

---

## Quick Start

### Option 1: Install from PyPI

```bash
pip install greenledger
greenledger
```

On first launch, you'll be guided through Auth0 login and API key setup.

### Option 2: Run from Source

```bash
git clone https://github.com/KashyapHegdeKota/innovation-hack.git
cd innovation-hack
pip install -e .
greenledger
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `greenledger` | Start the CLI (auto-setup on first run) |
| `greenledger setup` | Re-run API key setup and Auth0 login |
| `/model` | Switch model mid-session |
| `/stats` | View session statistics |
| `/exit` | End session and show summary |

---

## Supported Models

| # | Model | Provider | Tier | Energy/query | Eco Score |
|---|-------|----------|------|-------------|-----------|
| 1 | GPT-4.1 Nano | OpenAI | Nano | 0.10 Wh | 0.910 |
| 2 | GPT-4.1 Mini | OpenAI | Light | 0.15 Wh | 0.860 |
| 3 | Claude Haiku 4.5 | Anthropic | Light | 0.20 Wh | 0.890 |
| 4 | Gemini 3.1 Flash | Google | Light | 0.18 Wh | 0.880 |
| 5 | Claude Sonnet 4.6 | Anthropic | Standard | 0.24 Wh | 0.825 |
| 6 | GPT-5.2 Mini | OpenAI | Standard | 0.30 Wh | 0.810 |
| 7 | Gemini 3.1 Pro | Google | Standard | 0.28 Wh | 0.830 |
| 8 | GPT-5.2 | OpenAI | Heavy | 0.55 Wh | 0.770 |
| 9 | Claude Opus 4.6 | Anthropic | Heavy | 1.00 Wh | 0.720 |
| 10 | o3-mini | OpenAI | Reasoning | 3.00 Wh | 0.884 |
| 11 | o3 | OpenAI | Reasoning | 33.00 Wh | 0.758 |

Energy benchmarks sourced from Jegham et al. DEA methodology and provider sustainability reports.

---

## Dashboard

The web dashboard provides org-level visibility into AI sustainability:

- **Overview** — Sustainability score gauge, CO2e/energy/water stat cards, emissions over time, model usage breakdown
- **Green Router** — Routing decision log with alternatives considered and savings achieved
- **Agents** — Sustainability leaderboard across AI agents with scores and trends
- **Carbon Wallets** — Per-agent carbon budgets with utilization gauges
- **Carbon Levy** — Micro-levy tracking routed to carbon removal
- **Receipts** — Searchable receipt explorer with CSV/JSON export

### Running the Dashboard Locally

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Backend API

### Running Locally

```bash
cd apps/api
pip install -r requirements.txt
uvicorn apps.api.main:app --reload
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/analyze` | Classify prompt complexity, recommend greener model |
| POST | `/v1/infer` | Execute inference with BYOK key, return receipt |
| GET | `/v1/models` | List all models sorted by eco_score |
| GET | `/health` | Health check |

---

## Project Structure

```
innovation-hack/
  cli/                    Python CLI (packaged as `greenledger`)
    main.py                 920-line REPL with streaming + tool use
    tools.py                Tool executor (read/write/edit/bash/grep)
    renderer.py             Real-time markdown renderer
    config.py               Setup, Auth0 login, key validation
    launch.py               Terminal launcher (Win/Mac/Linux)
    models/registry.py      11 models, 5 tiers, 3 providers
    utils/carbon.py         CO2e, water, levy estimation
    assets/                 ASCII art assets

  apps/
    api/                  FastAPI backend
      main.py               App + route registration
      auth.py               Bearer token auth
      routes/
        infer.py              /v1/infer + /v1/analyze
        models.py             /v1/models
      services/
        providers.py          Unified Anthropic/OpenAI/Google wrapper
        streaming.py          Async token streaming
        keystore.py           BYOK encrypted key storage (Fernet AES-256)

    web/                  Next.js dashboard
      app/dashboard/        6 pages (overview, router, agents, wallets, levy, receipts)
      components/           StatCard, SustainabilityGauge, EmissionsChart, etc.
      lib/mock-data.ts      Demo data (swappable with real API)

  tests/                  pytest suite
  docs/                   Architecture, deep dives, task breakdowns
  pyproject.toml          Package config + dependencies
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | At least one provider key | Anthropic API key |
| `OPENAI_API_KEY` | At least one provider key | OpenAI API key |
| `GEMINI_API_KEY` | At least one provider key | Google Gemini API key |
| `ENCRYPTION_KEY` | Backend only | Key for encrypting stored BYOK keys |
| `ROUTER_URL` | Optional | Override router endpoint URL |
| `INFER_URL` | Optional | Override inference endpoint URL |

---

## Carbon Calculation Methodology

```
Energy (Wh) = (total_tokens / 1000) * model.energy_per_1k_tokens_wh
CO2e (g)    = energy_wh * provider_carbon_intensity / 1000
Water (mL)  = ((energy / PUE) * WUE_site + energy * WUE_source) * 1000
Levy (USD)  = co2e_g * $0.0001/g  (~$100/ton carbon price)
```

Provider constants from AWS, Azure, and GCP sustainability reports.

---

## Tech Stack

- **CLI**: Python 3.11+, Rich, Prompt Toolkit, httpx
- **Backend**: FastAPI, Pydantic, Cryptography (Fernet)
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Auth**: Auth0 (Device Code Flow for CLI)
- **Database**: Supabase (PostgreSQL)
- **AI SDKs**: Anthropic, OpenAI, Google GenAI
- **Package**: PyPI (`greenledger`)

---

## Team

Built at Innovation Hackathon 2026.

---

## License

MIT
