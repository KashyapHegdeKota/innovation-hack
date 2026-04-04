"""Tests for model benchmarks registry (B1)."""
import pytest
from cli.models.registry import MODELS, get_model, get_models_by_tier, ModelInfo


class TestModelRegistry:
    def test_all_models_have_required_fields(self):
        for m in MODELS:
            assert m.id, f"Missing id"
            assert m.display, f"Missing display for {m.id}"
            assert m.provider in ("anthropic", "openai", "google"), f"Bad provider {m.provider}"
            assert m.tier in ("nano", "light", "standard", "heavy", "reasoning"), f"Bad tier {m.tier}"
            assert m.energy_wh > 0, f"energy_wh must be positive for {m.id}"
            assert 0 < m.eco_score <= 1.0, f"eco_score out of range for {m.id}"
            assert m.energy_per_1k_tokens_wh > 0, f"energy_per_1k missing for {m.id}"

    def test_at_least_six_models(self):
        assert len(MODELS) >= 6

    def test_get_model_by_id(self):
        model = get_model("claude-sonnet-4-6")
        assert model is not None
        assert model.provider == "anthropic"
        assert model.tier == "standard"

    def test_get_model_unknown_returns_none(self):
        assert get_model("nonexistent-model") is None

    def test_get_models_by_tier(self):
        lights = get_models_by_tier("light")
        assert len(lights) >= 1
        assert all(m.tier == "light" for m in lights)

    def test_energy_ordering_across_tiers(self):
        """Heavier tiers should consume more energy on average."""
        tier_order = ["nano", "light", "standard", "heavy", "reasoning"]
        avg_energy = {}
        for tier in tier_order:
            models = get_models_by_tier(tier)
            if models:
                avg_energy[tier] = sum(m.energy_wh for m in models) / len(models)
        # Each tier's avg should be >= previous (allow missing tiers)
        prev = 0
        for tier in tier_order:
            if tier in avg_energy:
                assert avg_energy[tier] >= prev, f"{tier} energy should be >= previous"
                prev = avg_energy[tier]
