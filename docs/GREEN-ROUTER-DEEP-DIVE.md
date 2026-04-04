# Green Router — Deep Dive: How We Choose, Route, and Score

This document answers three questions:
1. How do we pick the right model for a task?
2. How do we pick the right region to run it in?
3. How do we score models by eco-efficiency?

All of this is grounded in real, published research and live APIs available today.

---

## The Three Inputs to Every Routing Decision

```
ROUTING DECISION = f(task_requirements, model_efficiency, region_carbon_intensity)
```

The Green Router takes in what the agent needs, cross-references it against how efficient each model is and how clean each region's grid is right now, and picks the best option.

---

## 1. Choosing the Right Model

### The Problem
Not all tasks need the most powerful model. A simple summarization doesn't need o3. A complex multi-step reasoning task can't use GPT-4.1 nano. We need to match task complexity to model capability while minimizing environmental cost.

### Quality Tiers

We classify models into capability tiers based on published benchmarks (MMLU-Pro, HLE, GPQA, MATH-500, LiveCodeBench):

| Tier | Use Case | Example Models | Typical Energy |
|------|----------|---------------|----------------|
| **Nano** | Simple extraction, classification, formatting | GPT-4.1 nano, Claude Haiku | 0.1-0.3 Wh/query |
| **Light** | Summarization, basic Q&A, translation | GPT-4.1 mini, Claude Haiku | 0.2-0.5 Wh/query |
| **Standard** | General tasks, writing, analysis | Claude Sonnet, GPT-4o | 0.3-1.0 Wh/query |
| **Heavy** | Complex reasoning, coding, math | Claude Opus, GPT-4.1 | 1.0-5.0 Wh/query |
| **Reasoning** | Multi-step chain-of-thought, research | o3, DeepSeek-R1 | 5.0-33+ Wh/query |

**Energy range is 100x+ between the lightest and heaviest models.** This is the single biggest lever for carbon reduction.

### How the SDK Decides the Tier

The developer specifies a `quality` parameter:

```python
response = gl.infer(
    prompt="Summarize this 3-paragraph email",
    quality="low",          # → routes to Nano/Light tier
    carbon_priority="low",  # → picks the greenest within that tier
)
```

Mapping:
- `quality="low"` → Nano or Light tier (simple, structured tasks)
- `quality="medium"` → Standard tier (general-purpose)
- `quality="high"` → Heavy tier (complex reasoning, creativity)
- `quality="max"` → Reasoning tier (no compromise on capability)

If the developer doesn't specify quality, we can infer it:
- **Token count heuristic**: Short prompts (<200 tokens) with simple instructions → low
- **Keyword detection**: "analyze", "reason step by step", "write code" → high
- **Historical patterns**: If this agent_id typically uses heavy models, default to its pattern

### Model Benchmarks Table (our database)

We maintain a `model_benchmarks` table seeded from published data:

```sql
CREATE TABLE model_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL UNIQUE,      -- e.g. "claude-sonnet-4-6"
    provider TEXT NOT NULL,              -- "anthropic" | "openai" | "google"
    quality_tier TEXT NOT NULL,          -- "nano" | "light" | "standard" | "heavy" | "reasoning"

    -- Energy data (from Hugging Face AI Energy Score, Jegham et al., provider disclosures)
    energy_per_1k_tokens_wh NUMERIC,    -- Wh per 1000 output tokens
    energy_per_query_wh_avg NUMERIC,    -- average Wh per typical query (1k in, 500 out)

    -- Performance scores (from public benchmarks, normalized 0-1)
    reasoning_score NUMERIC,            -- composite: MMLU-Pro, HLE, GPQA
    coding_score NUMERIC,               -- composite: SciCode, LiveCodeBench
    math_score NUMERIC,                 -- composite: MATH-500, AIME

    -- Eco-efficiency (from Jegham DEA or our own calculation)
    eco_efficiency_score NUMERIC,        -- 0-1, higher = better perf per unit carbon

    -- Metadata
    parameter_count_b NUMERIC,           -- billions of parameters (if public)
    available_regions TEXT[],             -- cloud regions where this model is served
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed Data (from published research)

| Model | Provider | Tier | Wh/query (avg) | Eco-efficiency | Source |
|-------|----------|------|-----------------|----------------|--------|
| GPT-4.1 nano | OpenAI | nano | ~0.15 | — | Muxup analysis |
| Claude Haiku 4.5 | Anthropic | light | ~0.20 | — | Provider estimate |
| GPT-4o | OpenAI | standard | ~0.34 | 0.789 | Altman disclosure, Jegham |
| Claude Sonnet 4.6 | Anthropic | standard | ~0.24 | 0.825 | Google methodology, Jegham |
| GPT-4.1 | OpenAI | heavy | ~0.50 | — | Muxup analysis |
| Claude Opus 4.6 | Anthropic | heavy | ~1.0 | — | Estimated from tier |
| o3-mini | OpenAI | reasoning | ~3.0 | 0.884 | Jegham |
| o3 | OpenAI | reasoning | ~33.0 | 0.758 | Jegham |
| DeepSeek-R1 | DeepSeek | reasoning | ~16.0 | 0.067-0.539 | Muxup, Jegham (varies by infra) |

**Key insight from Jegham:** DeepSeek-R1 running on its own infrastructure scores 0.067 eco-efficiency, but running on Azure scores 0.539. **Infrastructure matters as much as the model itself.** This is exactly why Green Router needs to control the routing.

---

## 2. Choosing the Right Region

### The Problem
The same model, running the same query, can produce 5-10x different carbon emissions depending on where it runs. A region powered by hydro/nuclear is dramatically cleaner than one powered by coal/gas.

### Data Source: Electricity Maps API

Electricity Maps provides real-time carbon intensity for 200+ electricity zones worldwide.

**API call:**
```
GET https://api.electricitymap.org/v3/carbon-intensity/latest?zone=US-CAL-CISO
Headers: auth-token: {ELECTRICITY_MAPS_API_KEY}

Response:
{
  "zone": "US-CAL-CISO",
  "carbonIntensity": 89,          // gCO2e per kWh RIGHT NOW
  "datetime": "2026-04-04T14:00:00Z",
  "updatedAt": "2026-04-04T14:05:00Z",
  "emissionFactorType": "lifecycle"
}
```

### Mapping Cloud Regions to Electricity Zones

We maintain a mapping table:

```sql
CREATE TABLE region_zone_mapping (
    cloud_region TEXT PRIMARY KEY,       -- e.g. "us-west-2"
    provider TEXT NOT NULL,              -- "aws" | "gcp" | "azure"
    electricity_zone TEXT NOT NULL,      -- Electricity Maps zone ID
    display_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC
);
```

**Key mappings:**

| Cloud Region | Electricity Zone | Typical gCO2e/kWh | Why |
|-------------|-----------------|-------------------|-----|
| us-west-2 (Oregon) | US-NW-PACW | 50-120 | Heavy hydro |
| eu-north-1 (Stockholm) | SE-SE3 | 10-40 | Almost all hydro/nuclear/wind |
| eu-west-1 (Ireland) | IE | 200-350 | Gas + wind (variable) |
| us-east-1 (Virginia) | US-MIDA-PJM | 300-450 | Gas/coal heavy |
| ap-northeast-1 (Tokyo) | JP-TK | 400-500 | Gas/coal heavy |
| ca-central-1 (Montreal) | CA-QC | 5-20 | Almost 100% hydro |

**ca-central-1 (Montreal/Quebec) and eu-north-1 (Stockholm) are consistently the greenest major cloud regions.**

### Real-Time Grid Data Cache

We poll Electricity Maps every 5 minutes for all regions where our supported AI providers operate:

```sql
CREATE TABLE grid_carbon_intensity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electricity_zone TEXT NOT NULL,
    carbon_intensity_gco2e_kwh NUMERIC NOT NULL,
    renewable_percentage NUMERIC,
    measured_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(electricity_zone, measured_at)
);

-- Keep 7 days of history for trend analysis
-- Index for fast lookups
CREATE INDEX idx_grid_latest ON grid_carbon_intensity(electricity_zone, measured_at DESC);
```

**Redis cache layer:**
```
Key:   grid:{zone}:latest
Value: {"carbon_intensity": 89, "renewable_pct": 78, "measured_at": "..."}
TTL:   300 seconds (5 minutes)
```

### Supplementary Data: Cloud Provider Carbon Tools

When Electricity Maps data isn't available for a zone, fall back to:

- **GCP Carbon Free Energy (CFE%)**: Google publishes hourly CFE% per region. Available via `cloud.google.com/sustainability/region-carbon`
- **Azure Emissions API**: Microsoft provides per-region emissions data via `Microsoft Cloud for Sustainability APIs`
- **Climatiq API**: Third-party API that converts cloud usage to CO2e for AWS/GCP/Azure. `climatiq.io/docs`
- **Cloud Carbon Footprint (open source)**: `cloudcarbonfootprint.org` — methodology for estimating emissions from cloud billing data
- **Static fallback**: EPA eGRID data (US) or IEA data (global) provides annual average carbon intensity per grid region

### Forecasting (future enhancement)

Electricity Maps also provides **72-hour forecasts**:
```
GET /v3/carbon-intensity/forecast?zone=US-CAL-CISO
```
This enables deferred task scheduling: "Run this batch job when California grid is forecast to be cleanest in the next 24 hours."

---

## 3. Scoring Models by Eco-Efficiency

### What Eco-Efficiency Means

Raw energy consumption doesn't tell the whole story. A model that uses 2x the energy but produces 5x better output is more eco-efficient. Eco-efficiency = **performance per unit of environmental cost.**

### The Jegham Framework (our foundation)

The paper "How Hungry is AI?" (Jegham et al., 2025) provides the most rigorous methodology. Here's how it works:

#### Step 1: Calculate Environmental Cost Per Query

For each model i:

```
Energy (Wh):
  E_i = ((L_i + OutputTokens / R_i) / 3600) × [P_GPU × U_GPU + P_nonGPU × U_nonGPU] × PUE

Water (L):
  W_i = (E_i / PUE) × WUE_site + E_i × WUE_source

Carbon (kgCO2e):
  C_i = E_i × CIF
```

Where:
- `L_i` = latency to first token (seconds)
- `R_i` = tokens per second throughput
- `P_GPU` = GPU power draw (kW), e.g., H100 = 0.7 kW
- `U_GPU` = GPU utilization fraction
- `PUE` = Power Usage Effectiveness of the data center
- `WUE_site` = on-site Water Usage Effectiveness (L/kWh)
- `WUE_source` = off-site water for electricity generation (L/kWh)
- `CIF` = Carbon Intensity Factor (kgCO2e/kWh) — this is what Electricity Maps gives us

#### Step 2: Calculate Performance Score

Composite AI performance index, weighted:
- **Reasoning/Knowledge** (50%): MMLU-Pro, HLE, GPQA Diamond
- **Mathematics** (25%): MATH-500, AIME 2024
- **Coding** (25%): SciCode, LiveCodeBench

```
Performance_i = 0.50 × reasoning_composite + 0.25 × math_composite + 0.25 × coding_composite
```

Each composite is a normalized (0-1) average of its constituent benchmarks.

#### Step 3: Cross-Efficiency DEA

Data Envelopment Analysis finds the efficiency frontier — models that deliver the best performance for the least environmental cost.

For each model, DEA solves:
```
Maximize: (weighted performance output) / (weighted environmental inputs)
Subject to: no model's efficiency exceeds 1.0
```

**Cross-efficiency** means each model is evaluated not just by its own optimal weights, but by the weights that are optimal for every other model. This prevents gaming — a model can't look good just by weighting the one benchmark it aces.

Final eco-efficiency score = average of all cross-evaluations. Range: 0.0 to 1.0.

### Our Simplified Real-Time Score

The full DEA is computationally intensive and meant for periodic benchmarking. For real-time routing, we use a simplified score:

```python
def calculate_realtime_eco_score(model, region):
    """
    Simplified eco-efficiency for real-time routing decisions.
    Full DEA scores are precomputed weekly and stored in model_benchmarks.
    This function adjusts for current grid conditions.
    """
    # Base eco-efficiency from precomputed DEA (or our own calculation)
    base_score = model.eco_efficiency_score  # 0-1, from model_benchmarks table

    # Current grid carbon intensity for this region
    grid_ci = get_grid_carbon_intensity(region)  # gCO2e/kWh, from Electricity Maps

    # Reference carbon intensity (global average ~400 gCO2e/kWh)
    reference_ci = 400

    # Grid adjustment factor: running in a clean region boosts effective eco-score
    # Running in Quebec (15 gCO2e/kWh) vs Virginia (400 gCO2e/kWh) = massive difference
    grid_factor = reference_ci / max(grid_ci, 1)  # higher = cleaner grid
    grid_factor = min(grid_factor, 10)  # cap at 10x to prevent extreme skew

    # Adjusted score
    adjusted_score = base_score * (0.6 + 0.4 * (grid_factor / 10))

    return {
        "eco_score": adjusted_score,
        "base_score": base_score,
        "grid_factor": grid_factor,
        "estimated_co2e_g": model.energy_per_query_wh_avg * grid_ci / 1000,
        "estimated_energy_wh": model.energy_per_query_wh_avg,
    }
```

### Infrastructure Multipliers We Use

From Jegham et al. Table 1 and cloud provider disclosures:

| Provider | Typical PUE | WUE Site (L/kWh) | WUE Source (L/kWh) | Notes |
|----------|-------------|-------------------|---------------------|-------|
| AWS | 1.14 | 0.18 | 5.11 | US average; varies by region |
| Google Cloud | 1.10 | 0.26 | 3.91 | Best-in-class PUE |
| Microsoft Azure | 1.12 | 0.30 | 4.35 | |
| DeepSeek (China) | 1.27 | 1.20 | 6.016 | Higher due to grid mix |
| Anthropic (via AWS) | 1.14 | 0.18 | 5.11 | Hosted on AWS |
| OpenAI (via Azure) | 1.12 | 0.30 | 4.35 | Hosted on Azure |

CIF (Carbon Intensity Factor) is NOT static — it comes from Electricity Maps in real-time. This is what makes our routing dynamic rather than relying on annual averages.

---

## The Complete Routing Algorithm

Putting it all together — here's the actual decision flow:

```python
def route(request: InferRequest) -> RoutingDecision:
    """
    Main routing function. Called on every gl.infer() request.
    """

    # Step 1: Determine quality tier
    tier = resolve_quality_tier(request.quality)
    # "low" → ["nano", "light"]
    # "medium" → ["standard"]
    # "high" → ["heavy"]
    # "max" → ["reasoning"]

    # Step 2: Get candidate models in this tier
    candidates = db.query(
        "SELECT * FROM model_benchmarks WHERE quality_tier = ANY(:tiers)",
        tiers=tier
    )

    # Step 3: Filter by provider allowlist (if specified)
    if request.provider_allowlist:
        candidates = [m for m in candidates if m.provider in request.provider_allowlist]

    # Step 4: For each candidate, get all available regions
    options = []
    for model in candidates:
        for region in model.available_regions:
            # Get current grid carbon intensity
            grid_ci = redis.get(f"grid:{region_to_zone(region)}:latest")
            if not grid_ci:
                grid_ci = get_static_fallback(region)

            # Calculate eco-score for this model+region combo
            eco = calculate_realtime_eco_score(model, region)

            # Check latency constraint
            estimated_latency = get_estimated_latency(model, region, request.prompt_tokens)
            if request.max_latency_ms and estimated_latency > request.max_latency_ms:
                continue  # skip this option

            options.append({
                "model": model,
                "region": region,
                "eco_score": eco["eco_score"],
                "estimated_co2e_g": eco["estimated_co2e_g"],
                "estimated_energy_wh": eco["estimated_energy_wh"],
                "estimated_latency_ms": estimated_latency,
                "grid_carbon_intensity": grid_ci.carbon_intensity,
                "grid_renewable_pct": grid_ci.renewable_pct,
            })

    # Step 5: Rank by carbon priority
    if request.carbon_priority == "lowest":
        # Pure carbon minimization
        options.sort(key=lambda o: o["estimated_co2e_g"])
    elif request.carbon_priority == "low":
        # Weighted: 70% carbon, 30% cost/latency
        options.sort(key=lambda o: o["estimated_co2e_g"] * 0.7 + normalized_cost(o) * 0.3)
    elif request.carbon_priority == "balanced":
        # Equal weight
        options.sort(key=lambda o: o["estimated_co2e_g"] * 0.5 + normalized_cost(o) * 0.5)
    else:  # "none"
        # Pure cost/latency optimization (traditional routing)
        options.sort(key=lambda o: normalized_cost(o))

    # Step 6: Return the best option
    best = options[0]

    # Step 7: Calculate what the "naive" choice would have cost
    # (cheapest model in highest-carbon region — the default without GreenLedger)
    naive = calculate_naive_baseline(candidates, request)

    return RoutingDecision(
        model=best["model"].model_id,
        provider=best["model"].provider,
        region=best["region"],
        estimated_co2e_g=best["estimated_co2e_g"],
        estimated_energy_wh=best["estimated_energy_wh"],
        grid_carbon_intensity=best["grid_carbon_intensity"],
        grid_renewable_pct=best["grid_renewable_pct"],
        eco_score=best["eco_score"],
        estimated_latency_ms=best["estimated_latency_ms"],
        savings_vs_naive_pct=((naive.co2e - best["estimated_co2e_g"]) / naive.co2e) * 100,
    )
```

---

## Worked Example

**Request:** Agent wants to summarize a document. quality="low", carbon_priority="low"

**Step 1:** Tier = ["nano", "light"]

**Step 2:** Candidates:
- GPT-4.1 nano (0.15 Wh/query)
- Claude Haiku 4.5 (0.20 Wh/query)

**Step 3:** No provider filter → keep both

**Step 4:** Evaluate all model+region combos:

| Model | Region | Grid gCO2e/kWh | CO2e per query | Eco-score |
|-------|--------|----------------|----------------|-----------|
| GPT-4.1 nano | ca-central-1 (Quebec) | 15 | 0.002g | 0.91 |
| Claude Haiku | ca-central-1 | 15 | 0.003g | 0.89 |
| GPT-4.1 nano | eu-north-1 (Stockholm) | 25 | 0.004g | 0.88 |
| Claude Haiku | eu-north-1 | 25 | 0.005g | 0.86 |
| GPT-4.1 nano | us-west-2 (Oregon) | 90 | 0.014g | 0.72 |
| Claude Haiku | us-west-2 | 90 | 0.018g | 0.68 |
| GPT-4.1 nano | us-east-1 (Virginia) | 380 | 0.057g | 0.41 |
| Claude Haiku | us-east-1 | 380 | 0.076g | 0.35 |

**Step 5:** With carbon_priority="low", sort by 70% carbon + 30% cost.

**Winner:** GPT-4.1 nano in ca-central-1. CO2e = 0.002g.

**Naive baseline** (cheapest, no carbon awareness): GPT-4.1 nano in us-east-1. CO2e = 0.057g.

**Savings: 96.5% carbon reduction** just by routing to a clean region.

---

## Keeping the Data Fresh

| Data | Source | Refresh Rate | Method |
|------|--------|-------------|--------|
| Grid carbon intensity | Electricity Maps API | Every 5 min | Background polling job → Redis + Postgres |
| Grid forecast (72h) | Electricity Maps API | Every 30 min | Background polling job → Postgres |
| Model energy benchmarks | Hugging Face AI Energy Score, Jegham, provider disclosures | Weekly | Manual review + automated scrape where possible |
| Model performance benchmarks | LMSYS Arena, public evals | Weekly | Manual review |
| Eco-efficiency scores (DEA) | Our computation | Weekly | Batch job using latest energy + performance data |
| Infrastructure multipliers (PUE, WUE) | Provider sustainability reports | Quarterly | Manual update |
| Region-zone mapping | Cloud provider docs | On new region launch | Manual update |

---

## What We Can Build Today vs. What Needs Estimation

### Available right now (real APIs, real data):
- Electricity Maps: real-time grid carbon intensity for 200+ zones ✅
- Hugging Face AI Energy Score: Wh per 1000 queries for 166+ models on H100 ✅
- Jegham eco-efficiency scores: DEA scores for 30 commercial models ✅
- GCP CFE%: hourly carbon-free energy per Google Cloud region ✅
- Azure Emissions API: per-customer emissions data ✅
- Climatiq API: cloud usage to CO2e conversion ✅
- Cloud Carbon Footprint: open-source methodology ✅

### Needs estimation/inference:
- Exact energy for closed-source API models (OpenAI, Anthropic don't publish per-query Wh) — we use published research + provider disclosures to approximate
- Latency per region (varies with load) — we measure empirically by pinging endpoints
- Exact GPU utilization for API-served models — we use Jegham's probabilistic model with conservative assumptions

### Our edge over time:
Every request through GreenLedger gives us actual observed latency, token counts, and routing outcomes. Over time, our model energy estimates become the most accurate in the market because we have real production telemetry — not just benchmark data.
