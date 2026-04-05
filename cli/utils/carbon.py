"""Carbon, water, and levy estimation from model benchmarks and provider averages."""
from __future__ import annotations

from dataclasses import dataclass

from cli.models.registry import get_model

# Provider average carbon intensity (gCO2e/kWh) — from sustainability reports
PROVIDER_CARBON_INTENSITY: dict[str, float] = {
    "anthropic": 200.0,   # AWS weighted average
    "openai": 180.0,      # Azure weighted average
    "google": 150.0,      # GCP weighted average
    "local": 400.0,       # conservative default
}

# Power Usage Effectiveness
PROVIDER_PUE: dict[str, float] = {
    "anthropic": 1.14,
    "openai": 1.12,
    "google": 1.10,
    "local": 1.20,
}

# Water Usage Effectiveness — on-site (L/kWh)
PROVIDER_WUE_SITE: dict[str, float] = {
    "anthropic": 0.18,
    "openai": 0.30,
    "google": 0.26,
    "local": 0.50,
}

# Water Usage Effectiveness — off-site for electricity generation (L/kWh)
PROVIDER_WUE_SOURCE: dict[str, float] = {
    "anthropic": 5.11,
    "openai": 4.35,
    "google": 3.91,
    "local": 5.00,
}

# Default carbon price: ~$100/ton = $0.0001/g
DEFAULT_CARBON_PRICE_PER_G_USD = 0.0001

# Default levy rate: 20% of savings go to carbon removal
DEFAULT_SAVINGS_LEVY_RATE = 0.20

# API pricing per 1K tokens (USD) — approximate from provider pricing pages
MODEL_API_PRICING: dict[str, tuple[float, float]] = {
    "gpt-4.1-nano":                (0.00010, 0.00040),
    "gpt-4.1-mini":                (0.00040, 0.00160),
    "claude-haiku-4-5":            (0.00080, 0.00400),
    "gemini-3.1-flash-lite-preview": (0.00005, 0.00020),
    "claude-sonnet-4-6":           (0.00300, 0.01500),
    "gpt-5.2-mini":                (0.00250, 0.01000),
    "gemini-3.1-pro":              (0.00125, 0.00500),
    "gpt-5.2":                     (0.00500, 0.02000),
    "claude-opus-4-6":             (0.01500, 0.07500),
    "o3-mini":                     (0.00110, 0.00440),
    "o3":                          (0.01000, 0.04000),
}


def estimate_co2e(energy_wh: float, provider: str) -> float:
    """Estimate CO2e in grams from energy and provider average grid intensity."""
    ci = PROVIDER_CARBON_INTENSITY.get(provider, PROVIDER_CARBON_INTENSITY["local"])
    return energy_wh * ci / 1000.0


def estimate_water(energy_wh: float, provider: str) -> float:
    """Estimate water consumption in mL (Jegham methodology)."""
    pue = PROVIDER_PUE.get(provider, PROVIDER_PUE["local"])
    wue_site = PROVIDER_WUE_SITE.get(provider, PROVIDER_WUE_SITE["local"])
    wue_source = PROVIDER_WUE_SOURCE.get(provider, PROVIDER_WUE_SOURCE["local"])
    return ((energy_wh / pue) * wue_site + energy_wh * wue_source) * 1000.0


def calculate_levy(co2e_g: float, price_per_g: float = DEFAULT_CARBON_PRICE_PER_G_USD) -> float:
    """Calculate carbon levy in USD."""
    return co2e_g * price_per_g


@dataclass(frozen=True)
class QueryCost:
    model_id: str
    provider: str
    energy_wh: float
    co2e_g: float
    water_ml: float
    levy_usd: float


def estimate_query_cost(model_id: str, tokens_in: int, tokens_out: int) -> QueryCost:
    """Full cost estimate for a single query given model and token counts."""
    model = get_model(model_id)
    if model is None:
        raise ValueError(f"Unknown model: {model_id}")

    total_tokens = tokens_in + tokens_out
    energy_wh = (total_tokens / 1000.0) * model.energy_per_1k_tokens_wh

    co2e_g = estimate_co2e(energy_wh, model.provider)
    water_ml = estimate_water(energy_wh, model.provider)
    levy_usd = calculate_levy(co2e_g)

    return QueryCost(
        model_id=model.id,
        provider=model.provider,
        energy_wh=energy_wh,
        co2e_g=co2e_g,
        water_ml=water_ml,
        levy_usd=levy_usd,
    )


def estimate_api_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    """Estimate API dollar cost for a query. Returns USD."""
    pricing = MODEL_API_PRICING.get(model_id)
    if pricing is None:
        return 0.0
    input_price, output_price = pricing
    return (tokens_in / 1000.0) * input_price + (tokens_out / 1000.0) * output_price


@dataclass(frozen=True)
class RoutingSavings:
    """What the user saves when the router downgrades their model."""
    original_model: str
    routed_model: str
    tokens_in: int
    tokens_out: int
    original_api_cost_usd: float
    routed_api_cost_usd: float
    savings_usd: float
    levy_rate: float
    levy_from_savings_usd: float    # % of savings -> carbon removal
    levy_from_carbon_usd: float     # CO2e-based levy on the actual query
    total_levy_usd: float           # sum of both
    co2e_avoided_g: float           # lighter model = less energy = less carbon


def estimate_routing_savings(
    original_model_id: str,
    routed_model_id: str,
    tokens_in: int,
    tokens_out: int,
    levy_rate: float = DEFAULT_SAVINGS_LEVY_RATE,
) -> RoutingSavings:
    """
    Calculate savings when router downgrades a model, and the levy from those savings.

    Example: User picked Claude Opus ($0.075/query), router chose Haiku ($0.002/query).
    Savings = $0.073. At 20% levy rate, $0.0146 goes to carbon removal.
    """
    original_cost = estimate_api_cost(original_model_id, tokens_in, tokens_out)
    routed_cost = estimate_api_cost(routed_model_id, tokens_in, tokens_out)
    savings = max(original_cost - routed_cost, 0.0)

    # Levy from savings (the main revenue driver)
    levy_from_savings = savings * levy_rate

    # Carbon levy on the actual query (small but transparent)
    routed_query_cost = estimate_query_cost(routed_model_id, tokens_in, tokens_out)
    levy_from_carbon = routed_query_cost.levy_usd

    # CO2e avoided by using a lighter model
    original_query_cost = estimate_query_cost(original_model_id, tokens_in, tokens_out)
    co2e_avoided = original_query_cost.co2e_g - routed_query_cost.co2e_g

    return RoutingSavings(
        original_model=original_model_id,
        routed_model=routed_model_id,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        original_api_cost_usd=original_cost,
        routed_api_cost_usd=routed_cost,
        savings_usd=savings,
        levy_rate=levy_rate,
        levy_from_savings_usd=levy_from_savings,
        levy_from_carbon_usd=levy_from_carbon,
        total_levy_usd=levy_from_savings + levy_from_carbon,
        co2e_avoided_g=max(co2e_avoided, 0.0),
    )
