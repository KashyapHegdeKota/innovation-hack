# GreenLedger CLI — Technical Deep Dive

How the analyzer LLM works, how the CLI selects models, and how every piece connects.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        GREENLEDGER CLI                             │
│                   (Python — Rich/Textual TUI)                      │
│                                                                    │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Prompt   │  │  Model    │  │  Budget   │  │  Slash Command │  │
│  │  Input    │  │  Picker   │  │  Status   │  │  Handler       │  │
│  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────────┬───────┘  │
│       │              │              │                  │           │
│       ▼              ▼              ▼                  ▼           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    CLI ENGINE (core loop)                    │  │
│  │                                                             │  │
│  │  1. Collect prompt + model choice                           │  │
│  │  2. Send to Analyzer LLM                                    │  │
│  │  3. Show recommendation, get user decision                  │  │
│  │  4. Execute inference via provider API                      │  │
│  │  5. Generate receipt, update budget                         │  │
│  │  6. Display everything                                      │  │
│  └────────┬────────────────────────┬──────────────────┬────────┘  │
│           │                        │                  │           │
└───────────┼────────────────────────┼──────────────────┼───────────┘
            │                        │                  │
            ▼                        ▼                  ▼
   ┌─────────────────┐    ┌──────────────────┐   ┌──────────────────┐
   │  ANALYZER LLM   │    │  MODEL           │   │  AI PROVIDERS    │
   │  (self-hosted)  │    │  BENCHMARKS      │   │                  │
   │                 │    │                  │   │  Anthropic       │
   │  Task classify  │    │  Energy/query    │   │  OpenAI          │
   │  Model advise   │    │  Eco-efficiency  │   │  Google          │
   │  Budget warn    │    │  CO2 estimates   │   │  Local/OSS       │
   └─────────────────┘    └──────────────────┘   └──────────────────┘
```

**Note on region routing**: We do NOT control which datacenter/region serves an API request. Cloud providers (AWS, Azure, GCP) use their own load balancers to route requests. Therefore, our primary carbon lever is **model selection** — choosing the right-sized model for the task — not region selection. The 100x energy difference between a nano model and a reasoning model dwarfs any regional grid variation.

---

## 1. The Analyzer LLM — How It Works

The analyzer is the new core innovation. It's a lightweight LLM that classifies tasks and advises on model selection before the actual inference happens.

### Why an LLM Instead of Heuristics

The original plan used keyword detection and token count heuristics to classify tasks:
- Short prompt + simple words = low quality tier
- "analyze", "reason step by step" = high quality tier

This breaks on real prompts. "Explain quantum computing" is short (3 words) but could need a heavy model if the user wants depth, or a light model if they want a simple explanation. An LLM can understand intent in a way heuristics cannot.

### Self-Hosted Setup

The analyzer must be:
1. **Fast** — adds latency before every query, so must respond in <500ms
2. **Cheap** — runs on every single request, so cost per call must be negligible
3. **Accurate enough** — doesn't need to be perfect, needs to be right 80%+ of the time

Options (pick one for hackathon):

| Option | Latency | Cost | Accuracy | Setup |
|--------|---------|------|----------|-------|
| Claude Haiku 4.5 via API | ~300ms | ~$0.0002/call | High | API key only |
| GPT-4.1 nano via API | ~200ms | ~$0.0001/call | Good | API key only |
| Llama 3.1 8B local (Ollama) | ~400ms | $0 | Good | `ollama pull llama3.1` |
| Phi-3 mini local (Ollama) | ~200ms | $0 | Moderate | `ollama pull phi3:mini` |

**Recommendation for hackathon**: Use Claude Haiku 4.5 via API. Fast, accurate, minimal setup. Switch to local Ollama for the "self-hosted" narrative if judges ask.

### Analyzer System Prompt

```
You are the GreenLedger Analyzer — a sustainability advisor for AI model selection.

Given a user's prompt and their selected model, you must:

1. CLASSIFY the task into exactly one category:
   - simple: greetings, short Q&A, formatting, extraction, classification
   - medium: summarization, explanation, translation, moderate writing
   - complex: deep analysis, long-form writing, creative work, multi-step reasoning
   - reasoning: math proofs, code generation, research synthesis, chain-of-thought
   - code: writing, reviewing, or debugging code

2. DETERMINE the minimum viable model tier:
   - simple → nano or light (Haiku, GPT-4.1 nano/mini)
   - medium → light or standard (Haiku, Sonnet, GPT-4o)
   - complex → standard or heavy (Sonnet, Opus, GPT-4.1)
   - reasoning → heavy or reasoning (Opus, o3)
   - code → standard or heavy (Sonnet, GPT-4.1, Opus)

3. EVALUATE whether the user's selected model is appropriate:
   - If overpowered: explain why a lighter model suffices, estimate CO2 savings
   - If appropriate: confirm the choice, note if there are cheaper alternatives
   - If underpowered: warn that quality may suffer, suggest upgrading

4. CHECK budget context:
   - If budget is >80% used, flag it and suggest conservation strategies
   - If this query would exceed budget, warn before proceeding

Respond in this exact JSON format:
{
  "task_type": "simple|medium|complex|reasoning|code",
  "minimum_tier": "nano|light|standard|heavy|reasoning",
  "selected_model_assessment": "overpowered|appropriate|underpowered",
  "explanation": "1-2 sentence human-readable explanation",
  "suggestions": [
    {
      "model_id": "claude-sonnet-4-6",
      "reason": "Handles explanations well at 76% less CO2",
      "estimated_co2e_g": 0.09,
      "estimated_energy_wh": 0.24,
      "estimated_water_ml": 0.1
    }
  ],
  "budget_warning": null | "You're at 82% of monthly budget. This query uses ~0.38g."
}
```

### Analyzer Request/Response

```python
# What we send to the analyzer
class AnalyzerRequest(BaseModel):
    prompt: str                          # the user's actual prompt
    selected_model: str                  # e.g. "claude-opus-4-6"
    selected_model_tier: QualityTier     # e.g. "heavy"
    budget_remaining_co2e_g: float       # e.g. 37.6
    budget_total_co2e_g: float           # e.g. 50.0
    budget_utilization_pct: float        # e.g. 24.8
    available_models: list[ModelOption]   # all models with their energy data

class ModelOption(BaseModel):
    model_id: str
    provider: str
    quality_tier: QualityTier
    energy_per_query_wh_avg: float
    eco_efficiency_score: float | None

# What the analyzer returns
class AnalyzerResponse(BaseModel):
    task_type: str                       # "simple" | "medium" | "complex" | "reasoning" | "code"
    minimum_tier: QualityTier
    selected_model_assessment: str       # "overpowered" | "appropriate" | "underpowered"
    explanation: str                     # human-readable explanation
    suggestions: list[ModelSuggestion]
    budget_warning: str | None

class ModelSuggestion(BaseModel):
    model_id: str
    reason: str
    estimated_co2e_g: float
    estimated_energy_wh: float
    estimated_water_ml: float
```

### Analyzer Cost Budget

The analyzer itself consumes energy. We account for it:

- Typical analyzer call: ~150 tokens in, ~200 tokens out
- Using Haiku 4.5: ~0.003g CO2e per analysis
- This is <1% of even a light model query — negligible
- We include it in the receipt as a separate line: "Analyzer overhead: 0.003g CO2"

---

## 2. The CLI Engine — Core Loop

### Technology

- **Python 3.11+** — matches the existing backend
- **Rich** — terminal formatting, tables, panels, progress bars, markdown rendering
- **Prompt Toolkit** — input handling, autocomplete for slash commands, history
- **Click** — CLI argument parsing (config, flags)
- **httpx** — async HTTP client for API calls

### Main Loop

```python
import asyncio
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from prompt_toolkit import PromptSession

console = Console()
session = PromptSession()

async def main_loop(config: CLIConfig):
    """The core REPL loop — runs until /exit."""

    state = SessionState(config)
    display_welcome(state)
    display_budget(state)

    while True:
        # 1. Get user input
        user_input = await session.prompt_async("  > ")

        # Handle slash commands
        if user_input.startswith("/"):
            handled = await handle_command(user_input, state)
            if handled == "exit":
                display_session_summary(state)
                break
            continue

        # 2. Show model picker
        selected_model = await show_model_picker(state)
        if selected_model is None:
            continue  # user cancelled

        # 3. Run analyzer
        analysis = await run_analyzer(
            prompt=user_input,
            selected_model=selected_model,
            state=state,
        )
        display_analysis(analysis)

        # 4. Get user decision (accept/alternative/override)
        final_model = await get_user_decision(analysis, selected_model)

        # 5. Execute inference
        console.print(f"  ⚡ Sending to {final_model.display} via {final_model.provider}...")
        result = await execute_inference(
            prompt=user_input,
            model=final_model,
            state=state,
        )
        console.print(f"  ⚡ Estimated: ~{result.estimated_co2e_g:.3f}g CO2 | {result.energy_wh:.2f} Wh")

        # 6. Display response
        console.print()
        console.print(Panel(result.response_text, border_style="green"))

        # 7. Generate and display receipt
        receipt = generate_receipt(result, state)
        display_receipt(receipt)

        # 8. Update state
        state.add_receipt(receipt)
        display_budget(state)
```

### Session State

```python
from dataclasses import dataclass, field

@dataclass
class SessionState:
    config: CLIConfig
    receipts: list[Receipt] = field(default_factory=list)
    total_co2e_g: float = 0.0
    total_energy_wh: float = 0.0
    total_water_ml: float = 0.0
    total_levy_usd: float = 0.0
    total_queries: int = 0
    total_savings_vs_naive_g: float = 0.0

    # Budget (loaded from wallet API or local config)
    budget_co2e_g: float = 50.0
    budget_energy_wh: float = 20.0
    budget_water_ml: float = 10.0

    @property
    def budget_utilization_pct(self) -> float:
        return (self.total_co2e_g / self.budget_co2e_g) * 100 if self.budget_co2e_g > 0 else 0

    def add_receipt(self, receipt: Receipt):
        self.receipts.append(receipt)
        self.total_co2e_g += receipt.co2e_g
        self.total_energy_wh += receipt.energy_wh
        self.total_water_ml += receipt.water_ml
        self.total_levy_usd += receipt.levy_usd
        self.total_queries += 1
        self.total_savings_vs_naive_g += receipt.savings_vs_naive_g
```

---

## 3. API Flow (from CLI)

The CLI can either call a backend API or run everything locally. For the hackathon, everything runs locally in the CLI process — no separate backend server needed.

**CLI-local flow** (hackathon):
```
CLI Process
 │
 ├── 1. Analyzer LLM call (Haiku via API / Ollama local)
 │      → task classification + model recommendation
 │
 ├── 2. User decision (accept/override)
 │
 ├── 3. Inference call (selected provider API)
 │      → response + token counts
 │
 └── 4. Local receipt generation
        → CO2/energy/water calculation from model benchmarks
```

**Backend flow** (post-hackathon, optional):
```
CLI                         Backend
 │                            │
 ├── POST /v1/analyze ───────►│  (analyzer LLM)
 │◄── analysis result ────────┤
 │                            │
 │  [user picks model]        │
 │                            │
 ├── POST /v1/infer ─────────►│  (execute + receipt)
 │◄── response + receipt ─────┤
 │                            │
```

### Backend Endpoint: POST /v1/analyze (optional)

```python
class AnalyzeRequest(BaseModel):
    prompt: str
    selected_model: str
    agent_id: str | None = None  # for budget lookup

class AnalyzeResponse(BaseModel):
    task_type: str
    minimum_tier: QualityTier
    assessment: str               # "overpowered" | "appropriate" | "underpowered"
    explanation: str
    suggestions: list[ModelSuggestion]
    budget_status: BudgetStatus | None
    analyzer_overhead_co2e_g: float  # the analyzer's own carbon cost

class BudgetStatus(BaseModel):
    remaining_co2e_g: float
    total_co2e_g: float
    utilization_pct: float
    warning: str | None           # null if fine, message if >80%

class ModelSuggestion(BaseModel):
    model_id: str
    provider: str
    quality_tier: QualityTier
    reason: str
    estimated_co2e_g: float
    estimated_energy_wh: float
    estimated_water_ml: float
    savings_vs_selected_pct: float
```

---

## 4. Carbon Estimation — How We Calculate Without Region Data

Since we can't control which datacenter serves an API request, we use **per-model energy benchmarks** from published research as our primary data source. This is still the biggest lever — model selection accounts for a 100x+ range in energy consumption.

### What we know (from published research)

| Data Point | Source | Confidence |
|-----------|--------|-----------|
| Energy per 1k tokens per model | Hugging Face AI Energy Score, Jegham et al. | High — measured on H100s |
| Provider PUE (Power Usage Effectiveness) | AWS/GCP/Azure sustainability reports | Medium — annual averages |
| Provider WUE (Water Usage Effectiveness) | AWS/GCP/Azure sustainability reports | Medium — annual averages |
| Average grid carbon intensity per provider | EPA eGRID, IEA data, provider reports | Low-Medium — annual averages |

### What we estimate

Since we don't know the exact datacenter, we use the **provider's weighted average carbon intensity** based on their published sustainability data:

| Provider | Estimated Avg gCO2e/kWh | Source |
|----------|------------------------|--------|
| Anthropic (via AWS) | ~200 | AWS sustainability report, weighted by region capacity |
| OpenAI (via Azure) | ~180 | Microsoft sustainability report |
| Google (GCP) | ~150 | Google CFE% reports (highest renewable share) |
| Self-hosted (Ollama) | Varies | User's local grid — can configure in settings |

These are **order-of-magnitude correct** — good enough for comparison between models. The 5-10x difference between models matters far more than the 2-3x difference between provider grids.

### Calculation

```python
# Provider average carbon intensity (gCO2e/kWh)
PROVIDER_CARBON_INTENSITY = {
    "anthropic": 200,   # AWS weighted average
    "openai": 180,      # Azure weighted average
    "google": 150,      # GCP weighted average
    "local": 400,       # conservative default for unknown grids
}

# Provider infrastructure multipliers
PROVIDER_PUE = {
    "anthropic": 1.14,  # AWS
    "openai": 1.12,     # Azure
    "google": 1.10,     # GCP
    "local": 1.20,      # conservative default
}

PROVIDER_WUE_SITE = {   # L/kWh on-site
    "anthropic": 0.18,
    "openai": 0.30,
    "google": 0.26,
    "local": 0.50,
}

PROVIDER_WUE_SOURCE = {  # L/kWh off-site (for electricity generation)
    "anthropic": 5.11,
    "openai": 4.35,
    "google": 3.91,
    "local": 5.00,
}
```

This is transparent: the receipt shows "estimated" next to CO2 values, and the `/models` command shows the data sources.

---

## 5. Receipt Generation

The receipt structure matches the original `ReceiptResponse` schema. The CLI formats it visually:

### Calculation

```python
def calculate_receipt(
    model: ModelBenchmark,
    tokens_in: int,
    tokens_out: int,
    latency_ms: int,
    analyzer_overhead_co2e_g: float,
    original_model: ModelBenchmark | None = None,  # user's pre-analyzer pick
) -> Receipt:

    # Energy consumed (from model benchmarks — Hugging Face AI Energy Score)
    total_tokens = tokens_in + tokens_out
    energy_wh = (total_tokens / 1000) * model.energy_per_1k_tokens_wh

    # CO2 emissions (using provider's average grid carbon intensity)
    provider_ci = PROVIDER_CARBON_INTENSITY[model.provider]  # gCO2e/kWh
    co2e_g = energy_wh * provider_ci / 1000

    # Water consumption (from Jegham methodology)
    pue = PROVIDER_PUE[model.provider]           # e.g. 1.14 for AWS
    wue_site = PROVIDER_WUE_SITE[model.provider]   # L/kWh
    wue_source = PROVIDER_WUE_SOURCE[model.provider] # L/kWh
    water_ml = ((energy_wh / pue) * wue_site + energy_wh * wue_source) * 1000

    # Carbon levy
    carbon_price_per_g = 0.0001  # ~$100/ton = $0.0001/g
    levy_usd = co2e_g * carbon_price_per_g

    # Savings vs user's original model pick (before analyzer suggestion)
    if original_model and original_model.model_id != model.model_id:
        original_energy = (total_tokens / 1000) * original_model.energy_per_1k_tokens_wh
        original_ci = PROVIDER_CARBON_INTENSITY[original_model.provider]
        original_co2e_g = original_energy * original_ci / 1000
        savings_vs_original_pct = ((original_co2e_g - co2e_g) / original_co2e_g) * 100
    else:
        original_co2e_g = co2e_g
        savings_vs_original_pct = 0.0

    # Savings vs max model (what if they'd used the heaviest model available)
    max_model_energy = (total_tokens / 1000) * MAX_MODEL_ENERGY_PER_1K  # e.g. o3 at 33 Wh
    max_co2e_g = max_model_energy * 400 / 1000  # worst case provider CI
    savings_vs_max_pct = ((max_co2e_g - co2e_g) / max_co2e_g) * 100

    # Include analyzer overhead
    total_co2e_g = co2e_g + analyzer_overhead_co2e_g

    return Receipt(
        co2e_g=total_co2e_g,
        energy_wh=energy_wh,
        water_ml=water_ml,
        levy_usd=levy_usd,
        model=model.model_id,
        provider=model.provider,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
        savings_vs_original_pct=savings_vs_original_pct,
        savings_vs_max_pct=savings_vs_max_pct,
        analyzer_overhead_co2e_g=analyzer_overhead_co2e_g,
    )
```

---

## 6. Budget System

### Local Mode (Hackathon Default)

For the hackathon, budget is tracked locally in the CLI session state + a local config file:

```yaml
# ~/.greenledger/config.yaml
budget:
  monthly_co2e_g: 50.0
  monthly_energy_wh: 20.0
  monthly_water_ml: 10.0
  on_exceeded: warn      # warn | downgrade | block

providers:
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
  openai:
    api_key: ${OPENAI_API_KEY}

analyzer:
  provider: anthropic
  model: claude-haiku-4-5
  # Or for local:
  # provider: ollama
  # model: llama3.1

defaults:
  default_model: claude-sonnet-4-6
```

### Server Mode (Post-Hackathon)

When connected to the GreenLedger backend, budget is tracked server-side via the Carbon Wallet API. The CLI calls `GET /v1/wallets/:agent_id` on startup and after every query.

---

## 7. Model Registry

The CLI loads the model list from the backend's `model_benchmarks` table (or a local fallback for offline mode):

```python
MODELS = [
    ModelInfo(
        id="claude-opus-4-6",
        display="Claude Opus 4.6",
        provider="anthropic",
        tier="heavy",
        energy_wh=1.0,
        eco_score=0.72,
    ),
    ModelInfo(
        id="claude-sonnet-4-6",
        display="Claude Sonnet 4.6",
        provider="anthropic",
        tier="standard",
        energy_wh=0.24,
        eco_score=0.825,
    ),
    ModelInfo(
        id="claude-haiku-4-5",
        display="Claude Haiku 4.5",
        provider="anthropic",
        tier="light",
        energy_wh=0.20,
        eco_score=0.89,
    ),
    ModelInfo(
        id="gpt-4.1",
        display="GPT-4.1",
        provider="openai",
        tier="heavy",
        energy_wh=0.50,
        eco_score=0.78,
    ),
    ModelInfo(
        id="gpt-4.1-mini",
        display="GPT-4.1 mini",
        provider="openai",
        tier="light",
        energy_wh=0.15,
        eco_score=0.86,
    ),
    ModelInfo(
        id="gpt-4.1-nano",
        display="GPT-4.1 nano",
        provider="openai",
        tier="nano",
        energy_wh=0.10,
        eco_score=0.91,
    ),
]
```

---

## 8. Offline / Demo Mode

For hackathon demos without live API keys, the CLI supports a mock mode:

```bash
$ greenledger --demo
```

In demo mode:
- AI responses come from a small set of pre-written responses per task type
- Budget and receipts still calculate and display correctly using model benchmarks
- The analyzer returns hardcoded classifications based on keyword matching
- All the UX is identical — judges see the full flow

---

## 9. Data Flow Summary

```
                    ┌──────────────────────┐
                    │    User's Terminal    │
                    │   (Rich + Prompt TK) │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │        CLI Engine           │
                │  (Python — async event loop) │
                └──┬───────┬──────────┬───────┘
                   │       │          │
          ┌────────┘       │          └────────┐
          ▼                ▼                   ▼
  ┌───────────────┐ ┌────────────────┐  ┌────────────────┐
  │ Analyzer LLM  │ │ Model          │  │  AI Provider   │
  │               │ │ Benchmarks     │  │  (Anthropic/   │
  │ Haiku/Local   │ │ (local JSON    │  │   OpenAI/etc)  │
  │               │ │  or Supabase)  │  │                │
  └───────────────┘ └────────────────┘  └────────────────┘
```

---

## 10. Key Files (New for CLI)

```
cli/
├── __init__.py
├── __main__.py              # entry point: `python -m greenledger`
├── app.py                   # main_loop(), startup, shutdown
├── config.py                # CLIConfig, load from ~/.greenledger/config.yaml
├── state.py                 # SessionState, Receipt tracking
├── analyzer.py              # Analyzer LLM client + system prompt
├── inference.py             # Execute inference via provider APIs
├── display/
│   ├── __init__.py
│   ├── welcome.py           # Welcome banner + branding
│   ├── budget.py            # Budget status bar rendering
│   ├── model_picker.py      # Interactive model selection
│   ├── analysis.py          # Analyzer recommendation display
│   ├── receipt.py           # Receipt panel rendering
│   ├── response.py          # AI response display
│   └── session_summary.py   # End-of-session stats
├── commands/
│   ├── __init__.py
│   ├── help.py              # /help
│   ├── budget.py            # /budget
│   ├── history.py           # /history
│   ├── export.py            # /export
│   ├── models.py            # /models
│   ├── config.py            # /config
│   ├── compare.py           # /compare
│   └── session.py           # /session
├── models/
│   ├── __init__.py
│   ├── registry.py          # Model list + benchmarks
│   ├── schemas.py           # CLI-specific Pydantic models
│   └── providers.py         # Provider API wrappers
└── utils/
    ├── __init__.py
    ├── carbon.py             # CO2/energy/water calculation helpers
    └── formatting.py         # Number formatting, progress bars
```
