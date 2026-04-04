# GreenLedger — Implementation Roadmap

---

## Phase 0: Foundation (Week 1-2)

**Goal:** Core infrastructure, database schema, and a working API skeleton.

### Backend (apps/api)
- [ ] Define Pydantic schemas for all entities (orgs, agents, wallets, receipts, scores)
- [ ] Create Supabase tables: `organizations`, `api_keys`, `agents`, `carbon_wallets`, `wallet_transactions`, `receipts`, `model_benchmarks`, `grid_carbon_intensity`
- [ ] Set up API key authentication middleware (alongside existing Firebase JWT auth)
- [ ] Implement basic CRUD routes for orgs, agents, wallets
- [ ] Seed `model_benchmarks` table with known data:
  - Claude 3.7 Sonnet: eco-efficiency 0.886, ~0.24 Wh per query
  - GPT-4.1: ~0.34 Wh per query
  - o3/DeepSeek-R1: ~33 Wh for reasoning tasks
  - GPT-4.1 nano, Claude Haiku: lightweight tier
- [ ] Set up Redis for caching (or use Supabase edge functions as fallback)

### Frontend (apps/web)
- [ ] Set up dashboard layout with sidebar navigation
- [ ] Create placeholder pages: Dashboard, Agents, Receipts, Scores, Settings
- [ ] Build `api-client.ts` methods for all new endpoints

### Deliverable
A running API where you can create an org, register agents, and create carbon wallets. Dashboard skeleton renders with navigation.

---

## Phase 1: Green Router (Week 2-3)

**Goal:** AI inference routing based on carbon intensity and model efficiency.

### Backend
- [ ] Build Electricity Maps integration (`integrations/electricity_maps.py`)
  - Poll carbon intensity for major cloud regions every 5 min
  - Store in `grid_carbon_intensity` table + Redis cache
  - Regions to cover: us-east-1, us-west-2, eu-west-1, eu-central-1, ap-northeast-1
- [ ] Build Green Router service (`services/router.py`)
  - Input: quality tier, carbon priority, latency constraint, provider allowlist
  - Output: recommended model + region + estimated CO2e
  - Scoring algorithm: weighted combination of eco-efficiency and grid carbon intensity
- [ ] Build unified AI provider interface (`integrations/ai_providers.py`)
  - Abstract wrapper for Anthropic, OpenAI, Google APIs
  - Metering: capture token counts, compute energy estimate from model benchmarks
- [ ] Implement `POST /v1/infer` endpoint
  - Accepts prompt + preferences
  - Calls Green Router for model/region selection
  - Executes inference via selected provider
  - Returns result + routing metadata
- [ ] Implement `POST /v1/route` endpoint (routing recommendation only, no execution)

### Frontend
- [ ] Green Router visualization: show which model/region was selected and why
- [ ] Real-time grid carbon map (simple visualization of region carbon intensities)

### Deliverable
You can call `POST /v1/infer` with a prompt and carbon preference, and it routes to the greenest viable option. Dashboard shows routing decisions.

---

## Phase 2: Carbon Wallet + Receipts (Week 3-4)

**Goal:** Budget enforcement and environmental receipts for every action.

### Backend
- [ ] Build Carbon Wallet service (`services/wallet.py`)
  - Create/read/update wallets
  - Pre-execution budget check
  - Post-execution reconciliation (estimated → actual)
  - Policy enforcement: downgrade_model, defer, offset, block
  - Monthly auto-reset with configurable rollover
- [ ] Build Receipt Engine (`services/receipt.py`)
  - Generate receipt for every `infer()` call
  - Calculate: CO2e, water, energy, grid mix, comparison vs naive routing
  - Store in `receipts` table
  - Export: JSON, CSV
- [ ] Wire wallet checks into the `/v1/infer` flow:
  1. Route → Check wallet → Execute → Generate receipt → Deduct wallet → Return
- [ ] Implement wallet API routes (`routes/wallets.py`)
- [ ] Implement receipt API routes (`routes/receipts.py`)

### Frontend
- [ ] Carbon Wallet dashboard widget: gauge showing budget used/remaining
- [ ] Receipt explorer: searchable, filterable list of all receipts
- [ ] Receipt detail view: full breakdown of a single action's environmental cost
- [ ] Agent detail page: wallet status + receipt history for a single agent

### Deliverable
Agents have carbon budgets. Every inference generates a receipt. Dashboard shows real-time carbon spend per agent.

---

## Phase 3: Levy Engine + Stripe Climate Integration (Week 4-5)

**Goal:** Automatic carbon levies routed to verified carbon removal.

### Backend
- [ ] Build Levy Engine (`services/levy.py`)
  - Calculate levy: `carbon_cost_g * configured_price_per_gram`
  - Default carbon price: use current voluntary market rate (~$50-200/ton for removal)
  - Configurable per org
- [ ] Build Stripe Climate integration (`integrations/stripe_climate.py`)
  - Connect to Stripe Climate Orders API
  - Pool levies and batch-submit (hourly or when pool exceeds threshold)
  - Track order status and link back to receipts
- [ ] Add levy info to receipts
- [ ] Build `POST /v1/pay` endpoint
  - Wraps payment execution with carbon levy calculation
  - Attaches environmental metadata to payment
  - Routes levy to configured destination
- [ ] Create background job: `jobs/levy_batch.py`
  - Runs hourly
  - Submits pooled levies to Stripe Climate
  - Updates levy_transactions with confirmation

### Frontend
- [ ] Levy dashboard: total levies collected, total carbon removal purchased
- [ ] Settings page: configure carbon price, levy destination, Stripe Climate API key
- [ ] Receipt cards now show levy amount and offset status

### Deliverable
Every inference action incurs a carbon levy. Levies pool and route to Stripe Climate for verified carbon removal. Full audit trail.

---

## Phase 4: Scoring + Optimization (Week 5-6)

**Goal:** Sustainability scores and actionable optimization recommendations.

### Backend
- [ ] Build Scoring Engine (`services/scoring.py`)
  - Compute daily scores at agent, team, and org level
  - Components: carbon efficiency, budget adherence, offset coverage, optimization adoption, trend
  - Store in `sustainability_scores` table
- [ ] Build recommendation engine
  - Analyze receipt patterns
  - Generate suggestions: "Switch agent X to off-peak hours", "Model Y is 3x greener for this task type"
  - Store in `recommendations` table
- [ ] Create background job: `jobs/score_compute.py`
  - Runs daily at midnight UTC
  - Computes and stores scores for all active orgs
- [ ] Implement score API routes (`routes/scores.py`)
  - Org score, agent scores, benchmarks, recommendations

### Frontend
- [ ] Sustainability Score card: prominent display on main dashboard
- [ ] Score breakdown: expandable view of each component
- [ ] Trend chart: score over time (30d, 90d, 1y)
- [ ] Recommendations panel: actionable cards with estimated impact
- [ ] Agent leaderboard: rank agents by sustainability score

### Deliverable
Companies see their sustainability score, understand what drives it, and get specific recommendations to improve.

---

## Phase 5: SDK + Public Launch (Week 6-8)

**Goal:** Publishable Python and Node SDKs. Developer documentation.

### Python SDK (sdk/python/)
- [ ] `greenledger.Client` — main class with `infer()`, `pay()`, `wallets`, `receipts`, `scores`
- [ ] Type hints for all methods and responses
- [ ] Async support (`greenledger.AsyncClient`)
- [ ] Error handling with clear messages
- [ ] Publish to PyPI (or private registry)

### Node SDK (sdk/node/)
- [ ] `GreenLedger` class with same interface
- [ ] TypeScript types
- [ ] Publish to npm (or private registry)

### Documentation
- [ ] API reference (auto-generated from FastAPI OpenAPI spec)
- [ ] Quickstart guide: "Add carbon awareness in 5 minutes"
- [ ] Integration guides: Stripe MPP, x402, AP2
- [ ] Example projects: simple agent with GreenLedger

### Deliverable
Developers can `pip install greenledger` or `npm install greenledger`, get an API key, and have carbon-aware AI agents in minutes.

---

## Phase 6: Advanced Features (Week 8+)

**Goal:** Differentiation and enterprise readiness.

- [ ] **Deferred task queue**: agents can submit non-urgent tasks that execute when grid is greenest
- [ ] **Multi-provider failover**: if primary green route is down, fall back to next greenest
- [ ] **Custom carbon models**: let enterprises input their own emission factors for internal compute
- [ ] **Compliance report generator**: auto-generate CSRD/SEC-compatible sustainability disclosures
- [ ] **Public sustainability badge**: embeddable widget ("This company's AI is GreenLedger verified")
- [ ] **Webhook notifications**: alert when agent exceeds budget, score drops, etc.
- [ ] **Team-level budgets**: hierarchical budgets (org → team → agent) with rollup
- [ ] **Carbon removal marketplace integration**: let companies choose between multiple removal providers (not just Stripe Climate)
- [ ] **API for third-party dashboards**: allow BI tools to pull GreenLedger data

---

## Key Milestones

| Milestone | Target | What it proves |
|-----------|--------|---------------|
| First routed inference | End of Phase 1 | Green routing works, we can pick the optimal model+region |
| First carbon receipt | End of Phase 2 | We can measure and report environmental cost per action |
| First carbon levy collected | End of Phase 3 | We can turn environmental cost into environmental action |
| First sustainability score | End of Phase 4 | We can benchmark and drive improvement |
| First external SDK user | End of Phase 5 | The developer experience works end-to-end |

---

## Dependencies & External Accounts Needed

| Service | Purpose | Setup |
|---------|---------|-------|
| Electricity Maps API | Grid carbon intensity | Sign up at electricitymap.org, free tier available |
| Stripe account + Climate Orders | Carbon levy routing | Stripe dashboard, enable Climate |
| Anthropic API key | AI provider (routing target) | console.anthropic.com |
| OpenAI API key | AI provider (routing target) | platform.openai.com |
| Google Gemini API key | AI provider (routing target) | aistudio.google.com |
| Supabase project | Database (already configured) | Existing project |
| Firebase project | Auth (already configured) | Existing project |
| Redis instance | Caching grid data + routing | Upstash (free tier) or local |

---

## Division of Work (Suggested for a Team)

| Role | Owns | Touches |
|------|------|---------|
| Backend Lead | Green Router, AI provider integration, API gateway | All backend services |
| Backend 2 | Carbon Wallet, Levy Engine, Stripe integration | Receipt Engine |
| Frontend Lead | Dashboard, all visualization components | API client integration |
| Full-stack | Receipt Engine, Scoring Engine, SDK development | Frontend components for scores/receipts |

All team members share responsibility for database schema design and API contract definition.
