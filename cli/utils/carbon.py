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
