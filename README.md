# GreenLedger

**The carbon-aware infrastructure layer for the agentic AI economy.**

GreenLedger is a sustainability layer that sits between AI agents and model providers. It ensures every AI action is environmentally accountable through real-time model routing, carbon budgeting, and automated carbon levies.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Python (3.11+)
- API Keys for AI Providers (Anthropic, OpenAI, or Google)

### 2. Launch the CLI
The fastest way to experience GreenLedger is through our interactive terminal interface.

```bash
# Install dependencies
pip install -e .

# Launch the CLI in a new terminal window
python cli/launch.py
```
*For more details, see the [CLI README](./cli/README.md).*

### 3. Setup Backend & Frontend

#### Backend (`apps/api`)
Create `apps/api/.env` based on `apps/api/.env.example`.
```bash
cd apps/api
pip install -r requirements.txt
python main.py
```

#### Frontend Dashboard (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard. No API keys required — the dashboard ships with mock data and Firebase auth is bypassed for development.

**Dashboard Pages:**
- **Overview** — Sustainability score gauge, CO2e/energy/water stats, emissions chart, model usage breakdown, recommendations
- **Green Router** — Every routing decision visualized: why a model was picked, alternatives considered, savings achieved
- **Agents** — Sustainability leaderboard across all AI agents with score, wallet usage, and trend
- **Carbon Wallets** — Per-agent carbon budgets with burn charts, utilization gauges, and exceeded policy configuration
- **Carbon Levy** — Micro-levy tracking to Stripe Climate: confirmed vs pooled vs pending, carbon removal over time
- **Receipts** — Searchable receipt explorer with expandable detail rows and CSV/JSON export

---

## 🏗️ Architecture & Features

- **Green Router:** Automatically selects the most eco-efficient model for any given task.
- **Carbon Wallet:** Enforces carbon budgets per agent, team, or organization.
- **Environmental Receipts:** Standardized accounting of CO2e, water, and energy for every query.
- **Carbon Levy Protocol:** Automatically routes micro-contributions to verified carbon removal.
- **Sustainability Dashboard:** High-level visibility into your AI infrastructure's planetary impact.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI, Pydantic, Supabase
- **CLI:** Rich, Prompt Toolkit, Click
- **AI Integration:** Anthropic, OpenAI, Google GenAI SDKs

---

## 📄 Documentation
- [Technical Deep Dive](./docs/CLI-DEEP-DIVE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Product Workflow](./docs/CLI-PRODUCT-WORKFLOW.md)
- [Green Router Deep Dive](./docs/GREEN-ROUTER-DEEP-DIVE.md)
