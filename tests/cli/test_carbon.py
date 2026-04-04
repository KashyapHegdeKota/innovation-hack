"""Tests for carbon estimation utilities (B3)."""
import pytest
from cli.utils.carbon import (
    estimate_co2e,
    estimate_water,
    calculate_levy,
    estimate_query_cost,
    PROVIDER_CARBON_INTENSITY,
    PROVIDER_PUE,
)


class TestCarbonEstimation:
    def test_co2e_positive_for_positive_energy(self):
        co2 = estimate_co2e(energy_wh=0.24, provider="anthropic")
        assert co2 > 0

    def test_co2e_zero_for_zero_energy(self):
        assert estimate_co2e(energy_wh=0.0, provider="anthropic") == 0.0

    def test_co2e_scales_with_energy(self):
        low = estimate_co2e(energy_wh=0.1, provider="anthropic")
        high = estimate_co2e(energy_wh=1.0, provider="anthropic")
        assert high > low

    def test_co2e_varies_by_provider(self):
        """Google (lower avg CI) should produce less CO2 than anthropic for same energy."""
        anth = estimate_co2e(energy_wh=1.0, provider="anthropic")
        goog = estimate_co2e(energy_wh=1.0, provider="google")
        assert goog < anth

    def test_water_positive(self):
        water = estimate_water(energy_wh=0.24, provider="anthropic")
        assert water > 0

    def test_levy_calculation(self):
        levy = calculate_levy(co2e_g=1.0)
        assert levy > 0
        # ~$100/ton = $0.0001/g
        assert abs(levy - 0.0001) < 0.00005

    def test_estimate_query_cost_returns_all_fields(self):
        cost = estimate_query_cost(
            model_id="claude-sonnet-4-6",
            tokens_in=100,
            tokens_out=200,
        )
        assert cost.co2e_g > 0
        assert cost.energy_wh > 0
        assert cost.water_ml > 0
        assert cost.levy_usd > 0
        assert cost.model_id == "claude-sonnet-4-6"
        assert cost.provider == "anthropic"

    def test_heavier_model_costs_more(self):
        light = estimate_query_cost("claude-haiku-4-5", 100, 200)
        heavy = estimate_query_cost("claude-opus-4-6", 100, 200)
        assert heavy.co2e_g > light.co2e_g
        assert heavy.energy_wh > light.energy_wh

    def test_provider_constants_exist(self):
        for p in ("anthropic", "openai", "google"):
            assert p in PROVIDER_CARBON_INTENSITY
            assert p in PROVIDER_PUE
