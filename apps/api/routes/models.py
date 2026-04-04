"""Model comparison endpoint (B8).
Owner: Dev B

Endpoints:
  GET /v1/models — list models with optional tier/provider filters, sorted by eco_score
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from cli.models.registry import MODELS

router = APIRouter()


class ModelResponse(BaseModel):
    id: str
    display: str
    provider: str
    tier: str
    energy_wh: float
    eco_score: float
    energy_per_1k_tokens_wh: float


@router.get("/models", response_model=list[ModelResponse])
def list_models(
    tier: str | None = Query(None, description="Filter by tier"),
    provider: str | None = Query(None, description="Filter by provider"),
):
    """List all supported models, optionally filtered and sorted by eco_score (best first)."""
    result = MODELS

    if tier is not None:
        result = [m for m in result if m.tier == tier]

    if provider is not None:
        result = [m for m in result if m.provider == provider]

    # Sort by eco_score descending (greenest first)
    result = sorted(result, key=lambda m: m.eco_score, reverse=True)

    return [
        ModelResponse(
            id=m.id,
            display=m.display,
            provider=m.provider,
            tier=m.tier,
            energy_wh=m.energy_wh,
            eco_score=m.eco_score,
            energy_per_1k_tokens_wh=m.energy_per_1k_tokens_wh,
        )
        for m in result
    ]
