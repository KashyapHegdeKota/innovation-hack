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
from cli.models.registry import MODELS, get_model
from cli.utils.carbon import estimate_query_cost
import json
import httpx 

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
OLLAMA_URL = "http://137.131.24.56:11434/api/chat"

class RoutingRequest(BaseModel):
    user_prompt: str
    selected_model: str
@router.post("/analyze")
async def analyze_and_route(request: RoutingRequest):
    # Eventually, you will pull this context from your Supabase model_benchmarks table
    # (from apps/api/migrations/002_seed_model_benchmarks.sql)
    eco_context = {}
    for m in MODELS:
        eco_context[m.id] = {
            "tier": m.tier,
            "energy_wh": m.energy_wh,
            "eco_score": m.eco_score
        }

    system_prompt = f"""
    You are a strict AI Efficiency Router. Your primary job is to save energy and compute costs by downgrading overkill model selections.
    
    User's Selected Model: {request.selected_model}
    
    Sustainability Context: 
    {json.dumps(eco_context, indent=2)}
    
    ROUTING RULES:
    1. Evaluate the complexity of the user's prompt (low, medium, high).
    2. If the task is simple (like summarization, basic math, or short answers) AND the user selected a high-energy model like "gemini-3-pro", you MUST change the recommendation to a low-energy model like "gemini-3-flash".
    3. You are authorized to override the user's choice to save energy.
    
    Respond ONLY with a valid JSON object. Example format:
    {{"complexity": "low", "recommended_model": "gemini-3-flash", "selected_model":{request.selected_model}}}
    """

    payload = {
        "model": "llama3.1",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.user_prompt}
        ],
        "stream": False,
        "format": "json" # Forces Llama to output valid JSON
    }

    async with httpx.AsyncClient() as client:
        try:
            # Send the request to your VM
            response = await client.post(OLLAMA_URL, json=payload, timeout=90.0)
            response.raise_for_status()
            data = response.json()
            
            # Parse Llama's JSON response
            decision = json.loads(data["message"]["content"])
            return {"status": "success", "routing": decision}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to reach VM router: {repr(e)}")
