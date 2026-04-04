# GreenLedger CLI — Task Breakdown for 4 Developers

---

## Team Structure

| Person | Role | Focus Area |
|--------|------|-----------|
| **Dev A** | CLI Core + Analyzer | CLI engine, REPL loop, analyzer LLM integration, model picker |
| **Dev B** | Providers + Backend API | AI provider wrappers, /analyze endpoint, /infer endpoint, model benchmarks |
| **Dev C** | Budget + Receipts + Display | Carbon wallet, receipt engine, all Rich TUI rendering |
| **Dev D** | Demo + Polish + Frontend Dashboard | Demo mode, slash commands, session export, optional web dashboard |

---

## Shared Setup (Everyone, Day 1 morning — 2 hours)

Before splitting into individual tracks, the whole team does this together:

- [ ] Agree on the CLI flow (review `CLI-PRODUCT-WORKFLOW.md` together)
- [ ] Set up the `cli/` directory structure
- [ ] Install shared dependencies: `rich`, `prompt_toolkit`, `click`, `httpx`, `pydantic`
- [ ] Create `cli/models/schemas.py` with shared types (extend from existing `apps/api/models/schemas.py`)
- [ ] Create `cli/config.py` with `CLIConfig` loading from `~/.greenledger/config.yaml`
- [ ] Create `.env.example` for backend: `SUPABASE_URL`, `SUPABASE_KEY`, `FIREBASE_*`, `ENCRYPTION_KEY` (for BYOK key storage), `ANTHROPIC_API_KEY` (for analyzer only)
- [ ] Set up Railway or Render project linked to GitHub repo for auto-deploy
- [ ] Each person creates their own feature branch: `feat/cli-core`, `feat/providers-backend`, `feat/budget-display`, `feat/demo-polish`

---

## Dev A — CLI Core + Analyzer LLM

**Goal**: The main REPL loop works. User can type prompts, pick models, see analyzer recommendations, and get responses.

### Day 1 (after shared setup)

- [ ] **A1: CLI Entry Point** (`cli/__main__.py`, `cli/app.py`)
  - `python -m greenledger` launches the CLI
  - Parse CLI args with Click: `--demo`, `--config`, `--budget`
  - Load config from `~/.greenledger/config.yaml`
  - Start the async main loop
  - Handle graceful shutdown (Ctrl+C shows session summary)
  - **Test**: Running `python -m greenledger` shows the welcome screen

- [ ] **A2: Prompt Input + Model Picker** (`cli/display/model_picker.py`)
  - Use `prompt_toolkit` for input with history and autocomplete
  - After user types a prompt, show numbered model list
  - Model list loaded from `cli/models/registry.py` (hardcoded for now)
  - Show energy bar next to each model (visual indicator)
  - User types a number to select
  - Handle: empty input, invalid number, Ctrl+C to cancel
  - **Test**: User can type "Hello" and pick model #2

- [ ] **A3: Analyzer LLM Client** (`cli/analyzer.py`)
  - Build the analyzer system prompt (from `CLI-DEEP-DIVE.md`)
  - Send to Haiku 4.5 via Anthropic API (or configurable provider)
  - Parse JSON response into `AnalyzerResponse` schema
  - Handle: API errors, malformed JSON (fallback to "appropriate" assessment)
  - Calculate analyzer overhead CO2e
  - **Test**: Send a simple prompt, get back a valid classification

### Day 2

- [ ] **A4: Recommendation Display + User Decision** (`cli/display/analysis.py`)
  - Render the analyzer output as a Rich panel
  - Show: task type, complexity, assessment, suggestions with CO2 comparison
  - Show numbered options: Accept suggestion(s) / Override
  - Capture user's choice
  - Handle budget warnings from analyzer
  - **Test**: Analyzer says "overpowered" → user sees alternatives → picks one

- [ ] **A5: Wire the Main Loop** (`cli/app.py`)
  - Connect: input → model pick → analyze → user decision → (hand off to Dev B for execution) → display
  - For now, mock the inference response (Dev B builds the real one)
  - Ensure the loop continues after each query
  - Handle slash commands (dispatch to command handler, Dev D builds commands)
  - **Test**: Full loop works end-to-end with mocked inference

### Day 3

- [ ] **A5b: POST /v1/analyze Endpoint** (`apps/api/routes/analyze.py`) — *Moved from Dev B (B5)*
  - Server-side endpoint wrapping the analyzer LLM
  - Input: prompt, selected_model, agent_id (optional)
  - Calls the analyzer LLM (Haiku 4.5) using GreenLedger's own API key
  - Returns: AnalyzeResponse with task classification, suggestions, budget status
  - **Test**: POST to /v1/analyze with a simple prompt, get valid analysis back

- [ ] **A6: Setup Flow** (`cli/commands/setup.py`)
  - `greenledger setup` — interactive first-run: prompt for GreenLedger API key, then each provider key (Anthropic, OpenAI)
  - Sends keys to `POST /v1/keys` on hosted backend
  - Saves GreenLedger API key + backend URL to `~/.greenledger/config.yaml`
  - Validates each key works before storing (test call to provider)
  - **Test**: Run setup, provide keys, verify stored on backend

- [ ] **A7: Streaming Response Display** (`cli/display/response.py`)
  - If provider supports streaming, show tokens as they arrive (like Claude Code)
  - Render inside a Rich panel with green border
  - Show a spinner while waiting for first token
  - **Test**: Response streams token by token in the terminal

- [ ] **A8: Analyzer Prompt Tuning**
  - Test analyzer with 20+ diverse prompts:
    - "Hi" (simple)
    - "Explain quantum computing" (medium)
    - "Write a Python web scraper with error handling" (code)
    - "Prove that the square root of 2 is irrational" (reasoning)
    - "Summarize this paragraph: ..." (simple/medium)
  - Tune system prompt to get >80% correct classification
  - Handle edge cases: very long prompts, multi-language, ambiguous intent
  - **Deliverable**: Analyzer correctly classifies and advises for common prompt types

---

## Dev B — AI Providers + Backend API

**Goal**: AI provider wrappers work, model benchmarks are accurate, and the backend API endpoints are functional.

### Day 1 (after shared setup)

- [x] **B1: Model Benchmarks Registry** (`cli/models/registry.py`)
  - Complete model registry with accurate data for all supported models
  - Fields per model: model_id, provider, tier, energy_per_query_wh, energy_per_1k_tokens_wh, eco_efficiency_score
  - Source data from GREEN-ROUTER-DEEP-DIVE.md + Jegham et al. + Hugging Face AI Energy Score
  - Include provider carbon intensity constants (avg gCO2e/kWh per provider)
  - **Test**: All 6+ models have complete benchmark data, constants match published sources

- [x] **B2: AI Provider Wrappers** (`apps/api/services/providers.py`)
  - Anthropic wrapper: call Claude models via `anthropic` SDK using user's decrypted BYOK key
  - OpenAI wrapper: call GPT models via `openai` SDK using user's decrypted BYOK key
  - Unified interface: `execute_inference(model_id, prompt, max_tokens, user_api_key) → InferenceResult`
  - Capture: response text, tokens_in, tokens_out, latency_ms
  - Support streaming (yield chunks for Dev A's streaming display)
  - **Test**: Send "Hello" to Haiku, get a response back with token counts

- [x] **B3: Carbon Estimation per Provider** (`cli/utils/carbon.py` — shared with Dev C)
  - Implement provider-level constants: avg carbon intensity, PUE, WUE (site + source)
  - Function: `estimate_co2e(model, tokens_in, tokens_out) → EstimatedCost`
  - Function: `estimate_water(energy_wh, provider) → float`
  - These use per-provider averages since we can't control region routing
  - **Test**: Known inputs produce expected outputs matching deep dive examples

### Day 2

- [x] **B4: BYOK Key Storage** (`apps/api/routes/keys.py`, `apps/api/services/keystore.py`)
  - `POST /v1/keys` — accept + encrypt (Fernet/AES-256) user's provider API keys, store in Supabase
  - `GET /v1/keys` — return which providers the user has configured (no raw keys)
  - `DELETE /v1/keys/:provider` — revoke a stored key
  - Encryption key from `ENCRYPTION_KEY` env var
  - **Test**: Store a key, retrieve it decrypted server-side, verify it works against provider

- [ ] **B5: Implement POST /v1/analyze Endpoint** (`apps/api/routes/analyze.py`) — *Deferred to Dev A (analyzer LLM is Dev A's domain)*
  - New endpoint that wraps the analyzer LLM
  - Input: prompt, selected_model, agent_id (optional)
  - Calls the analyzer LLM (same logic as Dev A's `analyzer.py` but server-side)
  - Looks up wallet if agent_id is provided
  - Returns: AnalyzeResponse with suggestions + budget status
  - **Test**: POST to /v1/analyze with a simple prompt, get valid analysis back

- [x] **B6: Wire POST /v1/infer** (`apps/api/routes/infer.py`)
  - Implement the full pipeline:
    1. Decrypt user's BYOK key for selected provider
    2. Budget check
    3. Execute inference using user's key
    4. Generate receipt
    5. Deduct budget
    6. Return InferResponse
  - **Test**: POST to /v1/infer with prompt + model, get response + receipt

- [x] **B7: Provider Error Handling + Fallback**
  - Handle: rate limits, timeouts, auth errors, model not available
  - If a provider is down, surface a clear error (don't crash the CLI)
  - Return structured errors that Dev A can display nicely
  - **Test**: Mock a timeout, verify CLI shows a helpful error

### Day 3

- [x] **B8: Multi-Provider Model Comparison** (`apps/api/routes/models.py`)
  - `/models` command data: for equivalent tiers, show cross-provider comparison
  - Example: "standard" tier → Sonnet (0.24 Wh, Anthropic) vs GPT-4o (0.34 Wh, OpenAI)
  - Rank by eco-efficiency within each tier
  - **Test**: `/models` shows sorted list with energy + eco-score per model

- [x] **B9: Streaming Support** (`apps/api/services/streaming.py`)
  - Implement async generator for streaming responses from Anthropic + OpenAI
  - Yield chunks as they arrive so Dev A can display token-by-token
  - Track token count incrementally during stream
  - **Test**: Streaming response appears token by token in terminal

---

## Dev C — Budget + Receipts + Display

**Goal**: Budget tracks and displays correctly. Receipts look polished. All Rich TUI panels are production-quality.

### Day 1 (after shared setup)

- [ ] **C1: Welcome Screen** (`cli/display/welcome.py`)
  - ASCII art or styled banner: "GreenLedger CLI"
  - Version, session start time
  - Design should look intentional, not default (refer to design quality rules)
  - **Test**: Launch CLI, see a clean branded welcome

- [ ] **C2: Budget Status Bar** (`cli/display/budget.py`)
  - Rich panel showing: CO2 used/total, Energy used/total, Water used/total, Levy total
  - Progress bar with color coding: green (<50%), yellow (50-80%), red (>80%)
  - Updates after every query
  - Function: `display_budget(state: SessionState) → None`
  - **Test**: Budget bar renders correctly with sample data

- [ ] **C3: Receipt Panel** (`cli/display/receipt.py`)
  - Rich panel with sections: Model info, Environmental Cost, Grid info, Savings, Session Totals
  - Color-coded savings percentage (green = good savings)
  - Compact mode (1-line summary) and expanded mode (full receipt)
  - Function: `display_receipt(receipt: Receipt) → None`
  - **Test**: Receipt renders beautifully with realistic data

### Day 2

- [ ] **C4: Carbon Calculation Utilities** (`cli/utils/carbon.py` — coordinate with Dev B)
  - `calculate_co2e(energy_wh, provider) → float` (grams, using provider avg carbon intensity)
  - `calculate_water(energy_wh, provider) → float` (mL)
  - `calculate_levy(co2e_g, carbon_price_per_ton) → float` (USD)
  - `calculate_savings_vs_original(current_model, original_model, tokens) → float` (% saved)
  - Provider-specific PUE/WUE constants from the deep dive
  - **Test**: Known inputs produce expected outputs matching deep dive examples

- [ ] **C5: Session State + Budget Tracking** (`cli/state.py`)
  - `SessionState` dataclass: tracks all cumulative stats
  - `add_receipt()` method updates all counters
  - Budget warning logic: returns warning message when >80% utilized
  - Persist session to `~/.greenledger/sessions/` as JSON for `/history` across sessions
  - **Test**: Add 5 receipts, verify all totals are correct

- [ ] **C6: Receipt Generation** (`cli/state.py` or `cli/receipt_engine.py`)
  - Takes inference result + routing data + model benchmarks → produces Receipt
  - Calculates: CO2e, water, energy, levy, savings vs naive, savings vs original pick
  - Includes analyzer overhead
  - **Test**: Generate receipt from a real inference result, verify all fields

### Day 3

- [ ] **C7: Session Summary Display** (`cli/display/session_summary.py`)
  - Shown on `/session` command and when user exits (`/exit` or Ctrl+C)
  - Total queries, total CO2e, total energy, total water, total levy
  - Average savings vs naive per query
  - "Greenest query" and "Most expensive query" highlights
  - Equivalent comparisons: "Your session's CO2 = X seconds of driving" or "X smartphone charges"
  - **Test**: After 5 queries, session summary shows correct totals with equivalents

- [ ] **C8: Formatting Polish**
  - Ensure all numbers display with appropriate precision (CO2: 3 decimals, energy: 2, percentages: 1)
  - Ensure panels align and don't overflow on standard 80-col terminals
  - Test with narrow terminals (80 cols) and wide terminals (200 cols)
  - Add subtle color theme: green for eco-positive, red for warnings, blue for info
  - **Test**: CLI looks polished on both narrow and wide terminals

---

## Dev D — Demo Mode + Commands + Polish

**Goal**: The demo works flawlessly without live API keys. Slash commands work. Optional dashboard page.

### Day 1 (after shared setup)

- [ ] **D1: Demo Mode Infrastructure** (`cli/demo/`)
  - `--demo` flag triggers mock mode
  - Mock analyzer: returns hardcoded classifications based on keyword matching
  - Mock provider: returns pre-written responses for common prompts
  - Mock budget: starts at configurable values, decrements realistically
  - Carbon calculations still run using real model benchmarks (only API calls are mocked)
  - **Test**: `python -m greenledger --demo` works with zero API keys

- [ ] **D2: Demo Response Bank** (`cli/demo/responses.py`)
  - Pre-written responses for ~10 common demo prompts:
    - "Hi" / "Hello" (simple)
    - "Explain quantum computing" (medium)
    - "Write a Python function to sort a list" (code)
    - "What's the meaning of life?" (medium)
    - "Analyze the environmental impact of cryptocurrency" (complex)
    - "Prove P != NP" (reasoning — should trigger "this needs a heavy model")
    - "Translate 'hello world' to Spanish" (simple)
    - "Write a business plan for a sustainable fashion startup" (complex)
    - "What is 2+2?" (simple — should trigger "way overpowered" if user picks Opus)
    - "Debug this code: ..." (code)
  - Each response should be realistic and well-written
  - **Test**: Demo mode handles all 10 prompts with appropriate responses

- [ ] **D3: Demo Analyzer** (`cli/demo/mock_analyzer.py`)
  - Keyword-based classification that mimics the real analyzer output
  - Maps: greeting keywords → simple, "explain/what is" → medium, "write code/debug" → code, "prove/analyze deeply" → reasoning
  - Returns proper `AnalyzerResponse` with suggestions and CO2 estimates
  - Always shows realistic CO2 numbers from the model benchmarks
  - **Test**: Demo analyzer correctly classifies all 10 demo prompts

### Day 2

- [ ] **D4: Slash Commands — Core** (`cli/commands/`)
  - `/help` — formatted help text with all available commands
  - `/budget` — detailed budget view (reuses Dev C's budget display, adds history chart)
  - `/models` — table of all models with tier, energy, eco-score, provider
  - `/history` — table of this session's receipts (compact: model, CO2, savings, timestamp)
  - `/session` — session stats (reuses Dev C's session summary)
  - `/exit` — show session summary, confirm exit
  - `/clear` — clear terminal
  - **Test**: All 7 commands work and display correctly

- [ ] **D5: Slash Commands — Advanced** (`cli/commands/`)
  - `/export json` — export all receipts as JSON to `./greenledger-session-{timestamp}.json`
  - `/export csv` — export as CSV
  - `/compare` — show "what if" for the last query: what if you'd used every other model?
  - `/config` — show current config, allow inline edits (budget, default model, providers)
  - `/leaderboard` — rank models by eco-efficiency score
  - **Test**: All 5 commands work, export produces valid files

### Day 3

- [ ] **D6: End-to-End Demo Script**
  - Write a scripted demo flow (for the hackathon presentation):
    1. Launch CLI
    2. Ask "Hi" with Opus → analyzer says overpowered → accept Haiku → receipt shows 96% savings
    3. Ask "Write a Python sorting algorithm" with Sonnet → analyzer says appropriate → receipt
    4. Ask complex question with Haiku → analyzer says underpowered → upgrade to Sonnet
    5. Run `/budget` to show budget status
    6. Run `/history` to show all receipts
    7. Run `/session` to show cumulative savings
    8. Run `/export json` to show export
    9. Exit → session summary with total environmental impact
  - Test the full script 3x, fix any rough edges
  - **Deliverable**: Smooth 3-5 minute demo that hits all hackathon criteria

- [ ] **D7: Optional — Dashboard Page** (`apps/web/app/dashboard/cli-sessions/page.tsx`)
  - If time permits: a simple web page that reads exported session JSON and displays:
    - Session timeline (queries over time)
    - Cumulative CO2 chart
    - Model usage pie chart
    - Total savings vs naive
  - This connects the CLI to the existing Next.js frontend
  - **Test**: Upload a session JSON, see charts render

- [ ] **D8: Deploy Backend to Railway/Render**
  - Configure `railway.json` or `render.yaml` for auto-deploy
  - Set env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `ENCRYPTION_KEY`, `ANTHROPIC_API_KEY` (analyzer)
  - Verify `/health` endpoint works on deployed URL
  - Update `cli/config.py` default `backend_url` to deployed URL
  - **Test**: CLI on local machine talks to deployed backend end-to-end

- [ ] **D9: README + Setup Guide**
  - Update project README with:
    - What GreenLedger CLI is (2 paragraphs)
    - Quick start: install deps, set API keys, run
    - Demo mode: `python -m greenledger --demo`
    - Screenshots of key screens (welcome, analyzer, receipt)
    - Architecture diagram (simplified)
  - **Deliverable**: A stranger can clone the repo and run the demo in <5 minutes

---

## Timeline Overview

```
         Day 1              Day 2              Day 3
       ┌──────────┐      ┌──────────┐      ┌──────────┐
Dev A  │ Entry pt │      │ Wire     │      │ Streaming│
       │ Model pk │      │ main loop│      │ Analyzer │
       │ Analyzer │      │          │      │ tuning   │
       ├──────────┤      ├──────────┤      ├──────────┤
Dev B  │ Elec Maps│      │ Provider │      │ Region   │
       │ Benchmark│      │ wrappers │      │ display  │
       │ Router   │      │ /analyze │      │ Multi-   │
       │          │      │ /infer   │      │ provider │
       ├──────────┤      ├──────────┤      ├──────────┤
Dev C  │ Welcome  │      │ Carbon   │      │ Session  │
       │ Budget   │      │ calc     │      │ summary  │
       │ Receipt  │      │ State    │      │ Format   │
       │ panels   │      │ Receipt  │      │ polish   │
       │          │      │ gen      │      │          │
       ├──────────┤      ├──────────┤      ├──────────┤
Dev D  │ Demo mode│      │ Slash    │      │ Demo     │
       │ Response │      │ commands │      │ script   │
       │ bank     │      │ (core +  │      │ Dashboard│
       │ Mock     │      │ advanced)│      │ README   │
       │ analyzer │      │          │      │          │
       └──────────┘      └──────────┘      └──────────┘

       Morning: shared setup (2h)
       Then split into parallel tracks
```

---

## Integration Points (Where Devs Need to Coordinate)

| Interface | Producer | Consumer | Contract |
|-----------|----------|----------|----------|
| `AnalyzerResponse` schema | Dev A | Dev C (display), Dev D (mock) | Defined in `cli/models/schemas.py` |
| `InferenceResult` schema | Dev B | Dev A (loop), Dev C (receipt) | Defined in `cli/models/schemas.py` |
| Carbon constants (PUE, WUE, CI) | Dev B | Dev C (receipt calc) | Defined in `cli/utils/carbon.py` |
| `Receipt` schema | Dev C | Dev A (loop), Dev D (export) | Defined in `cli/models/schemas.py` |
| `SessionState` | Dev C | Dev A (loop), Dev D (commands) | Defined in `cli/state.py` |
| `ModelInfo` registry | Dev B | Dev A (picker), Dev C (calculations), Dev D (mock) | Defined in `cli/models/registry.py` |
| Display functions | Dev C | Dev A (called from main loop) | `display_*(data) → None` |
| Slash command handler | Dev D | Dev A (dispatched from main loop) | `handle_command(cmd, state) → str\|None` |
| Demo mock layer | Dev D | Dev A, Dev B (swap in when `--demo`) | Same interfaces, mock implementations |

### Handoff Protocol

1. **Day 1 end**: Dev A has the loop running with mock inference. Dev B has real grid data + routing. Dev C has all display panels. Dev D has demo mode.
2. **Day 2 morning**: Dev A replaces mock inference with Dev B's real providers. Dev C's receipt generation uses Dev B's routing data. Dev D's slash commands use Dev C's session state.
3. **Day 2 end**: Full loop works end-to-end with real APIs. Slash commands work. Demo mode is an alternative path through the same code.
4. **Day 3**: Polish, edge cases, demo rehearsal, README.

---

## Definition of Done (Hackathon Deliverable)

The hackathon submission is complete when:

- [ ] `python -m greenledger --demo` runs without errors and shows the full flow
- [ ] User can type a prompt, pick a model, see analyzer recommendation, get a response, see a receipt
- [ ] Budget bar updates after each query and shows correct running totals
- [ ] Analyzer correctly identifies when a model is overpowered (e.g., Opus for "Hi")
- [ ] Analyzer correctly agrees when a model is appropriate (e.g., Opus for complex reasoning)
- [ ] Receipts show CO2, energy, water, levy, savings vs naive, session totals
- [ ] At least 3 slash commands work: `/help`, `/budget`, `/history`
- [ ] `/export json` produces a valid session report
- [ ] Session summary on exit shows total environmental impact
- [ ] Demo can run smoothly for 3-5 minutes without crashes
- [ ] README explains what the project is and how to run it
- [ ] At least one real API integration works (Anthropic or OpenAI)
- [ ] Carbon estimates use published model benchmarks and provider averages

### Stretch Goals (if time permits)

- [ ] Streaming token display (like Claude Code)
- [ ] Web dashboard page that visualizes exported sessions
- [ ] `/compare` command showing what-if analysis
- [ ] Cross-provider model comparison in analyzer suggestions
- [ ] Local Ollama analyzer (truly self-hosted)
- [ ] Conversation history (multi-turn within session)
