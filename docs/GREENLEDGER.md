# GreenLedger

**The carbon-aware infrastructure layer for the agentic AI economy.**

---

## The Problem

AI agents are becoming autonomous economic actors. They negotiate, purchase, subscribe, and transact without a human clicking "buy."

- Stripe launched Machine Payments Protocol (MPP) in March 2026
- Google launched Agent Payments Protocol (AP2) in 2026
- Coinbase's x402 protocol has processed 161M+ machine-to-machine transactions
- Visa and Mastercard both launched agentic commerce frameworks
- AI agents completed 140M payments in 9 months (2025), averaging $0.31/tx
- Gartner projects $15T of B2B spend will flow through agent-driven marketplaces by 2028

Every one of these transactions has a hidden environmental cost that nobody is tracking:

- A single AI query emits 0.03-1.14g CO2e
- Reasoning models (o3, DeepSeek-R1) consume 33+ Wh per prompt — 70x a lightweight model
- Inference accounts for 60-90% of AI's total lifecycle energy consumption
- AI data centers projected to consume ~90 TWh/year by 2026 (10x vs 2022)
- Google emissions up 50%, Meta up 60%, Microsoft up 23% — all driven by AI infrastructure

The infrastructure for agents to spend money exists. The infrastructure for agents to account for their environmental cost does not.

---

## The Insight

Stripe made payments invisible to developers — one SDK, complexity handled underneath. We do the same for carbon accountability.

Carbon awareness shouldn't be a reporting exercise after the fact. It should be embedded in every AI action at the infrastructure level. Not opt-in. Not a dashboard you check quarterly. A primitive — like authentication or payments.

---

## The Solution

GreenLedger is a single SDK + platform that sits between AI agents and the services they consume (model providers, APIs, payment rails). One integration gives you:

### 1. Green Router
Automatically picks the most eco-efficient model and compute region that meets the agent's quality and latency requirements.

- Real-time grid carbon intensity data per region
- Eco-efficiency scores per model (Claude 3.7 Sonnet: 0.886, o4-mini: 0.867, etc.)
- Quality-constrained optimization: "greenest option that meets my bar"
- Batch scheduling: defer non-urgent tasks to peak renewable hours

### 2. Carbon Wallet
Every AI agent gets a carbon budget alongside its payment budget.

- Company sets carbon budgets per agent, per team, per department
- Agent checks carbon balance before transacting
- When budget is low: auto-switch to lighter model, defer task, or purchase offsets
- Real-time balance tracking via API

### 3. Carbon Levy Protocol
Calculates and collects a micro carbon charge per transaction, routed to verified carbon removal.

- Real-time calculation: model used + region + grid mix + task complexity = carbon cost
- Auto-appended to agent payments (works with Stripe MPP, x402, AP2)
- Levies flow to verified carbon removal (Stripe Climate Orders / Frontier)
- Configurable: companies set their levy rate or use our recommended default

### 4. Environmental Receipt Engine
Every AI action produces a standardized environmental receipt.

- CO2e emitted (grams)
- Water consumed (mL)
- Energy used (Wh)
- Offset/levy paid ($)
- Model used, region, grid carbon intensity
- Running totals (like a bank statement for planetary impact)
- Open receipt spec — auditable, exportable, machine-readable

### 5. Sustainability Dashboard
Company-wide visibility and optimization.

- Agent Sustainability Score (benchmarked against industry)
- Per-agent and per-team carbon breakdowns
- Trend analysis: are you getting greener or worse?
- Optimization suggestions ("switching 40% of inference to off-peak saves 22% emissions")
- Compliance-ready reports for ESG/CSRD/SEC disclosure

---

## How It Works — End to End

```
┌──────────────────────────────────────────────────────────┐
│                    YOUR AI AGENT                         │
│              (wants to perform a task)                   │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                  GREENLEDGER SDK                          │
│                                                          │
│  1. GREEN ROUTER                                         │
│     - Checks grid carbon intensity across regions        │
│     - Scores available models by eco-efficiency          │
│     - Selects optimal model + region for the task        │
│                                                          │
│  2. CARBON WALLET                                        │
│     - Checks agent's remaining carbon budget             │
│     - If over budget: downgrade model / defer / offset   │
│     - Deducts estimated carbon cost from wallet          │
│                                                          │
│  3. EXECUTE                                              │
│     - Routes inference to selected provider + region     │
│     - Executes the task                                  │
│                                                          │
│  4. CARBON LEVY                                          │
│     - Calculates actual carbon cost post-execution       │
│     - Appends micro-levy to any associated payment       │
│     - Routes levy to Stripe Climate / carbon removal     │
│                                                          │
│  5. RECEIPT                                              │
│     - Generates environmental receipt                    │
│     - Logs to dashboard                                  │
│     - Returns receipt alongside task result              │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   DASHBOARD                              │
│  - Real-time carbon spend per agent/team/company         │
│  - Sustainability score + benchmarks                     │
│  - Optimization recommendations                          │
│  - Exportable compliance reports                         │
└──────────────────────────────────────────────────────────┘
```

---

## Developer Experience

### Before GreenLedger (no carbon awareness)
```python
import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Summarize this report..."}]
)
print(response.content)
# No idea what this cost the planet.
```

### After GreenLedger (one wrapper, everything handled)
```python
import greenledger

gl = greenledger.Client(api_key="gl_...")

response = gl.infer(
    prompt="Summarize this report...",
    quality="high",              # GL picks best model meeting this bar
    carbon_priority="low",       # prefer eco-efficient option
    agent_id="research-agent-1", # tracks against this agent's carbon wallet
)

print(response.result)           # the AI output
print(response.receipt)          # {co2e: "0.08g", water: "0.3ml", energy: "0.28Wh",
                                 #  offset: "$0.002", model: "claude-sonnet-4-6",
                                 #  region: "us-west-2", grid_mix: "78% renewable"}
```

### Agent payments with carbon levy
```python
# Agent makes a purchase through Stripe MPP
gl.pay(
    amount=4.99,
    currency="usd",
    to="supplier-api-endpoint",
    agent_id="procurement-agent-1",
    payment_protocol="stripe_mpp",
    # GreenLedger auto-appends:
    # - carbon cost of this transaction's full inference chain
    # - micro-levy routed to Stripe Climate Orders
    # - environmental receipt attached to payment
)
```

### Carbon wallet management
```python
# Set budget for an agent
gl.wallets.create(
    agent_id="procurement-agent-1",
    monthly_budget_co2e_kg=50,
    on_budget_exceeded="downgrade_model",  # or "defer", "offset", "block"
)

# Check balance
wallet = gl.wallets.get("procurement-agent-1")
print(wallet.remaining_co2e_kg)  # 32.4
print(wallet.spend_this_month)   # 17.6 kg
print(wallet.trend)              # "on_track" | "at_risk" | "exceeded"
```

---

## Business Model

### 1. SDK — Free Tier + Usage-Based
- Free up to 10,000 requests/month (drives adoption)
- $0.001 per request beyond free tier
- Self-serve onboarding

### 2. Carbon Levy Processing — Take Rate
- Every carbon levy routed through GreenLedger earns a 5-10% processing fee
- Volume play: grows linearly with the agent economy
- Aligns our revenue with environmental action

### 3. Dashboard + Compliance — SaaS
- Starter: Free (basic dashboard, 30-day history)
- Pro: $99/mo (full analytics, optimization suggestions, 1-year history)
- Enterprise: Custom (compliance reports, SSO, audit logs, dedicated support)

---

## Competitive Landscape

| Player | What They Do | Gap GreenLedger Fills |
|--------|-------------|----------------------|
| Stripe Climate | Carbon removal for payment volume | Enterprise opt-in, not agent-native |
| Watershed / Persefoni | Enterprise carbon accounting | Backward-looking reports, not real-time agent infra |
| Climatiq | Emission factor database/API | Data provider, not an action layer |
| Climate TRACE | Global emissions tracking | Macro-level, not per-transaction |
| Electricity Maps | Grid carbon intensity data | Data feed, not an SDK |

GreenLedger is the only product that combines real-time routing, budgeting, levying, and receipting into a single developer primitive purpose-built for the agentic AI economy.

---

## The Bet

In 5 years, no serious company will deploy AI agents without carbon accountability — the same way no serious company deploys software without security today.

We want to be the default way that happens.

---

## Key Data Sources & Integrations

### Carbon Data
- **Electricity Maps API** — real-time grid carbon intensity by region
- **Cloud provider APIs** — region-level energy data (AWS, GCP, Azure)
- **Model benchmarks** — energy per inference from published research (Arbor, Google Cloud, academic papers)
- **EPA / IPCC emission factors** — for non-compute costs

### Payment Rails
- **Stripe MPP** — Machine Payments Protocol for agent transactions
- **Coinbase x402** — HTTP-native crypto payment protocol
- **Google AP2** — Agent-to-Payments protocol
- **Visa Trusted Agent Protocol** — card network agent framework

### Carbon Removal
- **Stripe Climate Orders API** — pre-order carbon removal tons
- **Frontier portfolio** — verified permanent carbon removal suppliers
- **Gold Standard / Verra registries** — for offset verification

### AI Providers (routed through Green Router)
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- Open-source models via cloud endpoints
