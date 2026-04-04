# GreenLedger CLI

**A carbon-aware AI inference terminal that makes every prompt environmentally conscious.**

GreenLedger CLI is a terminal-based interactive chat interface (inspired by Claude Code) that embeds sustainability into the AI development workflow. It helps developers understand and minimize the carbon footprint of their AI interactions through real-time analysis, model routing, and environmental accounting.

---

## 🌟 Key Features

### 1. Smart Model Router & Analyzer
Before every query, a lightweight **Analyzer LLM** evaluates your prompt and your selected model. It classifies the task complexity (Simple, Medium, Complex, Reasoning, or Code) and suggests the most eco-efficient model that meets your quality requirements.

### 2. Real-time Carbon Budget
Track your environmental impact as you work. The CLI features a persistent status bar showing:
- **CO2e Emissions** (grams)
- **Energy Consumption** (Wh)
- **Water Usage** (mL)
- **Carbon Levy** (USD contribution to carbon removal)

### 3. Environmental Receipts
Every AI response is followed by a detailed **Environmental Receipt**, breaking down the impact of that specific query and showing how much carbon you saved by choosing an eco-efficient model compared to the heaviest alternatives.

### 4. BYOK (Bring Your Own Key)
Complete privacy and control. Provide your own API keys for Anthropic, OpenAI, and Google. GreenLedger routes the requests using your keys, ensuring you only pay for the inference you use.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Virtual environment (recommended)

### 2. Installation
From the project root:
```bash
pip install -e .
```

### 3. Launching the CLI
You can launch the CLI in a new dedicated terminal window (recommended for the best TUI experience):
```bash
python cli/launch.py
```
Or run it directly in your current terminal:
```bash
python cli/main.py
```

### 4. Setup
On first launch, or by running the `/setup` command, you will be prompted to enter your provider API keys. These are stored encrypted and used only for your inference requests.

---

## ⌨️ Slash Commands

| Command | Description |
| :--- | :--- |
| `/help` | Show all available commands |
| `/models` | List all supported models with their eco-efficiency scores |
| `/budget` | View detailed budget status and limits |
| `/history` | View environmental receipts for the current session |
| `/config` | Edit your preferences (default model, budget limits) |
| `/session` | View cumulative session statistics and planetary impact |
| `/clear` | Clear the terminal screen |
| `/exit` | End the session and show a final sustainability summary |

---

## 📊 Supported Models & Tiers

GreenLedger categorizes models into tiers based on their energy consumption per query:

- **Nano/Light:** (e.g., GPT-4.1 Nano, Claude Haiku 4.5) - *Minimal footprint, best for simple tasks.*
- **Standard:** (e.g., Claude Sonnet 4.6, GPT-5.2 Mini) - *The sweet spot for most development work.*
- **Heavy/Reasoning:** (e.g., Claude Opus 4.6, o3) - *High impact, reserved for deep analysis and complex logic.*

---

## 🛠️ Technology Stack
- **Rich & Prompt Toolkit:** For the beautiful, interactive terminal UI.
- **FastAPI:** Backend services for key management and routing.
- **Pydantic:** Robust data validation and settings management.
- **Anthropic/OpenAI/Google SDKs:** Native integration with top-tier AI providers.

---

## 📄 Documentation
For more details on the inner workings of GreenLedger, see the [docs](../docs/) directory:
- [Technical Deep Dive](../docs/CLI-DEEP-DIVE.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)
- [Product Workflow](../docs/CLI-PRODUCT-WORKFLOW.md)
