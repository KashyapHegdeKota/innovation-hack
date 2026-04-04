# GreenLedger CLI — Product Workflow

**A Claude Code-style CLI that makes every AI prompt carbon-conscious.**

---

## What We're Building

A terminal-based interactive CLI (like Claude Code) where users chat with AI models, but every interaction flows through a sustainability layer. The CLI shows real-time carbon budget, sends prompts through an analyzer LLM that suggests the most efficient model for the task, and prints an environmental receipt after every response.

The key insight: **model selection is the single biggest lever for carbon reduction.** A reasoning model like o3 consumes 100x+ more energy than a nano model. Most users default to the most powerful model for every task — even trivial ones. GreenLedger makes that waste visible and offers smarter alternatives.

This is not a dashboard you check later. This is carbon awareness embedded into the moment you type a prompt.

---

## The User Experience — Step by Step

### Step 1: User Launches the CLI

```
$ greenledger

  ╔══════════════════════════════════════════════════════════╗
  ║  GreenLedger CLI v0.1.0                                 ║
  ║  Carbon-aware AI inference                              ║
  ╚══════════════════════════════════════════════════════════╝

  Session started. Type your prompt, or /help for commands.

  ┌─ Budget ─────────────────────────────────────────────────┐
  │  CO2: 0.0g / 50.0g (0%)   Energy: 0.0Wh / 20.0Wh      │
  │  Water: 0.0mL / 10.0mL    Levy: $0.000                  │
  │  ████████████████████████████████████████░░ 0% used       │
  └──────────────────────────────────────────────────────────┘

  >
```

The CLI loads the user's session config (API keys, budget limits, preferred providers). Budget is shown at all times in a status bar — like a bank balance for planetary impact.

---

### Step 2: User Types a Prompt and Selects a Model

```
  > Explain quantum computing in simple terms

  Select model:
    [1] Claude Opus 4.6     (heavy)     ~1.0 Wh/query   ████████░░
    [2] Claude Sonnet 4.6   (standard)  ~0.24 Wh/query  ████░░░░░░
    [3] Claude Haiku 4.5    (light)     ~0.20 Wh/query  ███░░░░░░░
    [4] GPT-4.1             (heavy)     ~0.50 Wh/query  ██████░░░░
    [5] GPT-4.1 mini        (light)     ~0.15 Wh/query  ██░░░░░░░░
    [6] GPT-4.1 nano        (nano)      ~0.10 Wh/query  █░░░░░░░░░

  Your choice: 1

  ┌─ Budget ─────────────────────────────────────────────────┐
  │  CO2: 0.0g / 50.0g (0%)   Energy: 0.0Wh / 20.0Wh      │
  │  Water: 0.0mL / 10.0mL    Levy: $0.000                  │
  │  ████████████████████████████████████████░░ 0% used       │
  └──────────────────────────────────────────────────────────┘
```

The model list shows energy cost per query inline. The bar next to each model is a visual indicator of relative energy consumption — users can see at a glance which models are expensive.

---

### Step 3: Analyzer LLM Evaluates the Choice

Before sending the request to the selected model, the prompt + model choice goes to our **self-hosted analyzer LLM** (a lightweight model like Haiku or a local model). The analyzer classifies the task and evaluates whether the selected model is appropriate.

```
  ⏳ Analyzing task...

  ┌─ Analyzer Recommendation ──────────────────────────────────┐
  │                                                            │
  │  Task type:     Explanation / Q&A                          │
  │  Complexity:    Low-Medium                                 │
  │  Your pick:     Claude Opus 4.6 (heavy tier)               │
  │                                                            │
  │  ⚠  Opus 4.6 is overpowered for this task.                │
  │  This is a general knowledge explanation — it doesn't      │
  │  require deep reasoning, multi-step logic, or code gen.    │
  │                                                            │
  │  Suggested alternatives:                                   │
  │    → Claude Sonnet 4.6  (saves ~76% CO2, same quality)    │
  │    → Claude Haiku 4.5   (saves ~80% CO2, slightly shorter)│
  │                                                            │
  │  Estimated impact of your choice:                          │
  │    Opus 4.6:   ~0.38g CO2  |  1.0 Wh  |  0.4mL water     │
  │    Sonnet 4.6: ~0.09g CO2  |  0.24 Wh |  0.1mL water     │
  │    Haiku 4.5:  ~0.03g CO2  |  0.20 Wh |  0.08mL water    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  Proceed with:
    [1] Accept → Claude Sonnet 4.6 (recommended)
    [2] Accept → Claude Haiku 4.5
    [3] Override → Keep Claude Opus 4.6 (your original choice)

  Your choice:
```

Key design decisions:
- The analyzer **never blocks** the user. It suggests, the user decides.
- The override option is always available — we inform, not gatekeep.
- All three cost estimates are shown side-by-side so the tradeoff is visceral.
- The analyzer itself runs on the lightest possible model (its own CO2 cost is negligible).

---

### Step 4: Request Executes

```
  Your choice: 1

  ⚡ Sending to Claude Sonnet 4.6 via Anthropic...
  ⚡ Estimated: ~0.09g CO2 | 0.24 Wh (76% less than Opus)

  ─────────────────────────────────────────────────────────────

  Quantum computing uses quantum bits (qubits) instead of
  regular bits. While a normal bit is either 0 or 1, a qubit
  can be both at the same time — this is called superposition.

  Think of it like flipping a coin: a regular computer sees
  heads OR tails. A quantum computer sees the coin while it's
  still spinning — it works with all possibilities at once.

  This lets quantum computers solve certain problems much
  faster, like breaking codes, simulating molecules for drug
  discovery, or optimizing complex logistics.

  ─────────────────────────────────────────────────────────────
```

The execution line shows the estimated savings compared to the original model choice. The user sees the carbon impact of their decision in real-time.

---

### Step 5: Receipt + Updated Budget

```
  ┌─ Receipt ──────────────────────────────────────────────────┐
  │                                                            │
  │  Model:     claude-sonnet-4-6                              │
  │  Provider:  Anthropic                                      │
  │  Tier:      standard                                       │
  │                                                            │
  │  Tokens:    42 in → 187 out                                │
  │  Latency:   1.2s                                           │
  │                                                            │
  │  ── Environmental Cost ──                                  │
  │  CO2:       0.09g (estimated)                              │
  │  Energy:    0.24 Wh                                        │
  │  Water:     0.10 mL                                        │
  │  Levy:      $0.0004 → carbon removal                       │
  │                                                            │
  │  ── Savings ──                                             │
  │  vs Opus 4.6 (your original pick):  76% less CO2          │
  │  vs max model (o3 reasoning):       99.7% less CO2        │
  │                                                            │
  │  ── Session Totals ──                                      │
  │  Queries: 1  |  CO2: 0.09g  |  Energy: 0.24 Wh            │
  │  Avg savings: 76% vs user's original picks                 │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  ┌─ Budget ─────────────────────────────────────────────────┐
  │  CO2: 0.004g / 50.0g (0.01%)  Energy: 0.24Wh / 20.0Wh  │
  │  Water: 0.1mL / 10.0mL        Levy: $0.0004             │
  │  ████████████████████████████████████████░░ 0.01% used    │
  └──────────────────────────────────────────────────────────┘

  >
```

The receipt is the star of the show. It makes the invisible cost visible. The "savings" section is critical — it shows what would have happened without GreenLedger.

---

### Step 6: Budget Warning (When Running Low)

When the user approaches budget limits, the CLI warns proactively:

```
  > Write a comprehensive business plan for a SaaS startup

  Select model:
    [1] Claude Opus 4.6     (heavy)     ~1.0 Wh/query
    [2] Claude Sonnet 4.6   (standard)  ~0.24 Wh/query
    ...

  Your choice: 1

  ⏳ Analyzing task...

  ┌─ Analyzer Recommendation ──────────────────────────────────┐
  │                                                            │
  │  Task type:     Long-form generation / analysis            │
  │  Complexity:    High                                       │
  │  Your pick:     Claude Opus 4.6 — APPROPRIATE              │
  │                                                            │
  │  ✓ This task benefits from Opus-level reasoning.           │
  │  The analyzer agrees with your choice.                     │
  │                                                            │
  │  ⚠  BUDGET ALERT: You're at 82% of your monthly CO2       │
  │  budget. This query will use ~0.38g, leaving 8.6g.         │
  │                                                            │
  │  Options:                                                  │
  │    → Proceed with Opus 4.6 (uses ~0.38g)                  │
  │    → Sonnet 4.6 can also handle this (uses ~0.09g)        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  Proceed with:
    [1] Proceed → Claude Opus 4.6 (recommended for this task)
    [2] Downgrade → Claude Sonnet 4.6 (save budget)

  Your choice:
```

When the analyzer **agrees** with the user's model choice, it says so clearly. It's not always pushing you to downgrade — it's giving an honest assessment.

---

## CLI Commands

In addition to natural language prompts, the CLI supports slash commands:

```
  /help                 — Show all commands
  /budget               — Show detailed budget status
  /history              — Show this session's receipts
  /export [json|csv]    — Export session receipts
  /models               — List all available models with energy data
  /config               — Edit preferences (default model, budget, providers)
  /session              — Session stats: total queries, CO2, savings
  /compare              — Compare last query: what if you'd used a different model?
  /leaderboard          — Show model efficiency leaderboard
  /clear                — Clear screen
  /exit                 — End session
```

---

## Complete Request Lifecycle (Internal Flow)

```
User types prompt + selects model
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  1. BUDGET CHECK                                              │
│     Load user's carbon wallet                                 │
│     Show current budget status in status bar                  │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  2. ANALYZER LLM (self-hosted, lightweight)                   │
│     Input: prompt text, selected model, budget status         │
│     Process:                                                  │
│       a. Classify task complexity (simple/medium/complex/     │
│          reasoning)                                           │
│       b. Map complexity to minimum viable model tier          │
│       c. Compare user's selection vs minimum viable tier      │
│       d. Calculate estimated CO2/energy/water for all options │
│       e. Check budget impact                                  │
│     Output: recommendation + alternatives + cost comparison   │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  3. USER DECISION                                             │
│     Accept recommendation / pick alternative / override       │
│     (User always has final say)                               │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  4. EXECUTE INFERENCE                                         │
│     Send prompt to selected provider + model via their API    │
│     Capture: response text, tokens in/out, latency            │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  5. POST-EXECUTION                                            │
│       a. Calculate actual CO2e, energy, water from token      │
│          counts + model energy benchmarks                     │
│       b. Calculate carbon levy                                │
│       c. Generate environmental receipt                       │
│       d. Deduct from carbon wallet                            │
│       e. Update session totals                                │
│       f. Calculate savings vs naive baseline                  │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  6. DISPLAY                                                   │
│     Print AI response                                         │
│     Print environmental receipt                               │
│     Update budget status bar                                  │
└───────────────────────────────────────────────────────────────┘
```

---

## What Makes This Different from the Original SDK Plan

| Dimension | Original SDK Plan | New CLI Flow |
|-----------|-------------------|-------------|
| Interface | Python/Node library, programmatic | Interactive terminal, conversational |
| Model selection | Automatic (SDK decides based on quality param) | User picks, analyzer advises |
| Carbon visibility | Receipt returned as JSON in code | Receipt printed in terminal, always visible |
| Budget awareness | Checked programmatically, policy auto-enforced | Shown as live status bar, user makes informed choice |
| Analyzer LLM | Didn't exist — heuristic classification | New core feature — LLM-powered task analysis |
| User agency | Developer sets policy once, SDK enforces | User decides every interaction, learns over time |
| Demo appeal | Need to run code to show it | Type in terminal, judges watch in real-time |
| Educational value | Low — hidden behind API | High — every query teaches about carbon cost |

### What's preserved from the original

- Model efficiency scoring (energy per query, eco-efficiency from Jegham methodology)
- Carbon Wallet (budget tracking + enforcement)
- Receipt Engine (same data, different display)
- Model benchmarks database (same source data)
- Carbon cost calculations (CO2e, water, energy per query)

### What's new

- Self-hosted analyzer LLM (the "brain" that advises on model selection)
- Interactive model selection with inline energy data
- CLI interface with slash commands
- Session-level cumulative stats
- Real-time budget status bar
- Comparison mode (what-if analysis)

### What's simplified (vs original plan)

- No region-level routing (API providers handle load balancing — we can't control which datacenter serves a request)
- No Redis caching layer (unnecessary for a CLI tool)
- No Electricity Maps real-time polling (model selection is the primary lever, not region selection)
- Carbon estimates use per-model benchmarks from published research, not per-region grid data

---

## Why This Is Good for the Hackathon Track

The hackathon asks for: **actionable today, scalable tomorrow.**

- **Actionable today**: Any developer can use this CLI right now to make their AI usage carbon-conscious. No infrastructure changes needed.
- **Scalable tomorrow**: The analyzer LLM + Green Router core becomes the engine behind the SDK, API, and enterprise dashboard.
- **Innovation**: The analyzer LLM that evaluates model-task fit for sustainability is novel — nobody is doing this.
- **Environmental impact**: Measurable per-query, compounding over sessions.
- **Technical execution**: Real AI provider APIs, real model energy benchmarks from published research, real carbon calculations.
- **Feasibility**: A CLI is a buildable hackathon deliverable. An enterprise platform is not.
