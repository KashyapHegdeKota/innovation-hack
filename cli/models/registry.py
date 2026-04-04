"""Model benchmarks registry — energy, eco-efficiency, and tier data for all supported models."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelInfo:
    id: str
    display: str
    provider: str       # "anthropic" | "openai" | "google"
    tier: str           # "nano" | "light" | "standard" | "heavy" | "reasoning"
    energy_wh: float    # average Wh per typical query (~1k in, 500 out)
    eco_score: float    # 0-1, higher = better perf per unit carbon (Jegham DEA)
    energy_per_1k_tokens_wh: float  # Wh per 1000 tokens


MODELS: list[ModelInfo] = [
    # --- Nano ---
    ModelInfo(
        id="gpt-4.1-nano",
        display="GPT-4.1 nano",
        provider="openai",
        tier="nano",
        energy_wh=0.10,
        eco_score=0.91,
        energy_per_1k_tokens_wh=0.067,
    ),
    # --- Light ---
    ModelInfo(
        id="gpt-4.1-mini",
        display="GPT-4.1 mini",
        provider="openai",
        tier="light",
        energy_wh=0.15,
        eco_score=0.86,
        energy_per_1k_tokens_wh=0.10,
    ),
    ModelInfo(
        id="claude-haiku-4-5",
        display="Claude Haiku 4.5",
        provider="anthropic",
        tier="light",
        energy_wh=0.20,
        eco_score=0.89,
        energy_per_1k_tokens_wh=0.13,
    ),
    ModelInfo(
        id="gemini-3.1-flash-lite-preview",
        display="Gemini 3.1 Flash",
        provider="google",
        tier="light",
        energy_wh=0.18,
        eco_score=0.88,
        energy_per_1k_tokens_wh=0.12,
    ),
    # --- Standard ---
    ModelInfo(
        id="claude-sonnet-4-6",
        display="Claude Sonnet 4.6",
        provider="anthropic",
        tier="standard",
        energy_wh=0.24,
        eco_score=0.825,
        energy_per_1k_tokens_wh=0.16,
    ),
    ModelInfo(
        id="gpt-5.2-mini",
        display="GPT-5.2 mini",
        provider="openai",
        tier="standard",
        energy_wh=0.30,
        eco_score=0.81,
        energy_per_1k_tokens_wh=0.20,
    ),
    ModelInfo(
        id="gemini-3.1-pro",
        display="Gemini 3.1 Pro",
        provider="google",
        tier="standard",
        energy_wh=0.28,
        eco_score=0.83,
        energy_per_1k_tokens_wh=0.19,
    ),
    # --- Heavy ---
    ModelInfo(
        id="gpt-5.2",
        display="GPT-5.2",
        provider="openai",
        tier="heavy",
        energy_wh=0.55,
        eco_score=0.77,
        energy_per_1k_tokens_wh=0.37,
    ),
    ModelInfo(
        id="claude-opus-4-6",
        display="Claude Opus 4.6",
        provider="anthropic",
        tier="heavy",
        energy_wh=1.0,
        eco_score=0.72,
        energy_per_1k_tokens_wh=0.67,
    ),
    # --- Reasoning ---
    ModelInfo(
        id="o3-mini",
        display="o3-mini",
        provider="openai",
        tier="reasoning",
        energy_wh=3.0,
        eco_score=0.884,
        energy_per_1k_tokens_wh=2.0,
    ),
    ModelInfo(
        id="o3",
        display="o3",
        provider="openai",
        tier="reasoning",
        energy_wh=33.0,
        eco_score=0.758,
        energy_per_1k_tokens_wh=22.0,
    ),
]

_MODEL_INDEX: dict[str, ModelInfo] = {m.id: m for m in MODELS}


def get_model(model_id: str) -> ModelInfo | None:
    return _MODEL_INDEX.get(model_id)


def get_models_by_tier(tier: str) -> list[ModelInfo]:
    return [m for m in MODELS if m.tier == tier]
