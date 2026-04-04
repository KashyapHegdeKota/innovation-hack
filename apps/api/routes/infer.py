"""Green Router & Inference routes.
Owner: Dev B

Endpoints:
  POST /v1/infer  — execute inference + generate receipt
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..services.providers import execute_inference, ProviderError
from ..services.keystore import KeyStore
from cli.models.registry import get_model
from cli.utils.carbon import estimate_query_cost

router = APIRouter()

# Global keystore instance — initialized at startup with ENCRYPTION_KEY env var
import os
_keystore = KeyStore(os.environ.get("ENCRYPTION_KEY", "default-dev-key-change-in-prod!!"))


def get_user_key(user_id: str, provider: str) -> str | None:
    """Retrieve decrypted BYOK key for user+provider."""
    return _keystore.get_key(user_id, provider)


class InferRequestBody(BaseModel):
    prompt: str
    model: str
    max_tokens: int = 1024


class ReceiptData(BaseModel):
    co2e_g: float
    energy_wh: float
    water_ml: float
    levy_usd: float


class InferResponseBody(BaseModel):
    text: str
    model: str
    provider: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    receipt: ReceiptData


@router.post("/infer", response_model=InferResponseBody)
async def infer(body: InferRequestBody, current_user=Depends(get_current_user)):
    """Full pipeline: validate model → get BYOK key → execute → receipt → return."""

    # 1. Validate model exists
    model_info = get_model(body.model)
    if model_info is None:
        raise HTTPException(400, f"Unknown model: {body.model}")

    # 2. Get user's BYOK key for the provider
    user_id = current_user["uid"]
    api_key = get_user_key(user_id, model_info.provider)
    if api_key is None:
        raise HTTPException(
            401,
            f"No API key configured for provider '{model_info.provider}'. "
            f"Run 'greenledger setup' to add your {model_info.provider} key.",
        )

    # 3. Execute inference
    try:
        result = await execute_inference(
            model_id=body.model,
            prompt=body.prompt,
            max_tokens=body.max_tokens,
            api_key=api_key,
        )
    except ProviderError as e:
        raise HTTPException(502, f"Provider error: {e}")

    # 4. Generate receipt from actual token counts
    cost = estimate_query_cost(body.model, result.tokens_in, result.tokens_out)

    receipt = ReceiptData(
        co2e_g=cost.co2e_g,
        energy_wh=cost.energy_wh,
        water_ml=cost.water_ml,
        levy_usd=cost.levy_usd,
    )

    return InferResponseBody(
        text=result.text,
        model=result.model,
        provider=result.provider,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
        latency_ms=result.latency_ms,
        receipt=receipt,
    )
