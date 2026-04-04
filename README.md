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

#### Frontend (`apps/web`)
Create `apps/web/.env` based on `apps/web/.env.example`.
```bash
cd apps/web
npm install
npm run dev
```

---

## 🏗️ Architecture & Features

- **Green Router:** Automatically selects the most eco-efficient model for any given task.
- **Carbon Wallet:** Enforces carbon budgets per agent, team, or organization.
- **Environmental Receipts:** Standardized accounting of CO2e, water, and energy for every query.
- **Carbon Levy Protocol:** Automatically routes micro-contributions to verified carbon removal.
- **Sustainability Dashboard:** High-level visibility into your AI infrastructure's planetary impact.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Pydantic, Supabase
- **CLI:** Rich, Prompt Toolkit, Click
- **AI Integration:** Anthropic, OpenAI, Google GenAI SDKs

---

## 📄 Documentation
- [Technical Deep Dive](./docs/CLI-DEEP-DIVE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Product Workflow](./docs/CLI-PRODUCT-WORKFLOW.md)
- [Green Router Deep Dive](./docs/GREEN-ROUTER-DEEP-DIVE.md)
