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
from ..store import add_receipt, deduct_wallet
from cli.models.registry import MODELS, get_model
from cli.utils.carbon import estimate_query_cost, estimate_routing_savings, estimate_api_cost
import json
import uuid
import httpx
from datetime import datetime, timezone
from collections import defaultdict

router = APIRouter()

# Global keystore instance — initialized at startup with ENCRYPTION_KEY env var
import os
_keystore = KeyStore(os.environ.get("ENCRYPTION_KEY", "default-dev-key-change-in-prod!!"))

# In-memory levy ledger — accumulates savings across queries (demo mode)
_levy_ledger: dict[str, list[dict]] = defaultdict(list)


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
    # Savings fields (populated when router downgrades model)
    original_model: str | None = None
    original_api_cost_usd: float = 0.0
    routed_api_cost_usd: float = 0.0
    savings_usd: float = 0.0
    levy_from_savings_usd: float = 0.0
    co2e_avoided_g: float = 0.0


class LevySummaryResponse(BaseModel):
    total_queries: int
    total_savings_usd: float
    total_levy_usd: float
    total_co2e_avoided_g: float
    levy_breakdown: list[dict]


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

    # 5. Calculate savings if router downgraded the model
    original_model_id = body.model   # what the user asked for
    routed_model_id = result.model   # what actually ran (may differ after routing)

    savings_data = estimate_routing_savings(
        original_model_id=original_model_id,
        routed_model_id=routed_model_id,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
    )

    receipt = ReceiptData(
        co2e_g=cost.co2e_g,
        energy_wh=cost.energy_wh,
        water_ml=cost.water_ml,
        levy_usd=savings_data.total_levy_usd,
        original_model=original_model_id if original_model_id != routed_model_id else None,
        original_api_cost_usd=savings_data.original_api_cost_usd,
        routed_api_cost_usd=savings_data.routed_api_cost_usd,
        savings_usd=savings_data.savings_usd,
        levy_from_savings_usd=savings_data.levy_from_savings_usd,
        co2e_avoided_g=savings_data.co2e_avoided_g,
    )

    # 6. Persist to in-memory store
    receipt_id = str(uuid.uuid4())
    agent_id = user_id
    naive_co2e = cost.co2e_g * 4  # naive = heavy model estimate
    savings_pct = round((1 - cost.co2e_g / naive_co2e) * 100) if naive_co2e > 0 else 0

    add_receipt({
        "id": receipt_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "model": result.model,
        "provider": result.provider,
        "tokens_in": result.tokens_in,
        "tokens_out": result.tokens_out,
        "latency_ms": result.latency_ms,
        "environmental_cost": {
            "co2e_g": cost.co2e_g,
            "energy_wh": cost.energy_wh,
            "water_ml": cost.water_ml,
        },
        "offset": {
            "levy_usd": savings_data.total_levy_usd,
            "destination": "stripe_climate_frontier",
            "status": "confirmed",
        },
        "comparison": {
            "naive_co2e_g": naive_co2e,
            "savings_pct": savings_pct,
        },
        "savings": {
            "original_model": original_model_id,
            "original_api_cost_usd": savings_data.original_api_cost_usd,
            "routed_api_cost_usd": savings_data.routed_api_cost_usd,
            "savings_usd": savings_data.savings_usd,
            "levy_from_savings_usd": savings_data.levy_from_savings_usd,
            "co2e_avoided_g": savings_data.co2e_avoided_g,
        },
    })
    deduct_wallet(agent_id, cost.co2e_g, receipt_id)

    # 7. Record to levy ledger
    _levy_ledger[user_id].append({
        "model": routed_model_id,
        "original_model": original_model_id,
        "savings_usd": savings_data.savings_usd,
        "levy_usd": savings_data.total_levy_usd,
        "co2e_avoided_g": savings_data.co2e_avoided_g,
    })

    return InferResponseBody(
        text=result.text,
        model=result.model,
        provider=result.provider,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
        latency_ms=result.latency_ms,
        receipt=receipt,
    )


@router.get("/levy-summary", response_model=LevySummaryResponse)
async def levy_summary(current_user=Depends(get_current_user)):
    """Return accumulated levy data for the current user's session."""
    user_id = current_user["uid"]
    entries = _levy_ledger.get(user_id, [])

    return LevySummaryResponse(
        total_queries=len(entries),
        total_savings_usd=sum(e["savings_usd"] for e in entries),
        total_levy_usd=sum(e["levy_usd"] for e in entries),
        total_co2e_avoided_g=sum(e["co2e_avoided_g"] for e in entries),
        levy_breakdown=entries,
    )
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")

class RoutingRequest(BaseModel):
    user_prompt: str
    selected_model: str
@router.post("/analyze")
async def analyze_and_route(request: RoutingRequest):
    prompt_length = len(request.user_prompt.split())

    if prompt_length < 10 and request.selected_model in ["claude-opus-4-6", "o3", "gpt-5.2", "gemini-3.1-pro"]:
        # If the prompt is very short and the user selected a heavy model, we can route to a lighter one
        return {
            "status": "success", 
            "routing": {"complexity": "low", "recommended_model": "claude-haiku-4-5"}
        }
    
    simple_keywords = ["hello", "hi", "ping", "summarize", "translate"]
    if any(request.user_prompt.lower().startswith(kw) for kw in simple_keywords):
        return {
             "status": "success", 
             "routing": {"complexity": "low", "recommended_model": "gemini-3.1-flash"}
        }
    # Eventually, you will pull this context from your Supabase model_benchmarks table
    # (from apps/api/migrations/002_seed_model_benchmarks.sql)
    eco_context = {}
    for m in MODELS:
        eco_context[m.id] = {
            "tier": m.tier,
            "energy_wh": m.energy_wh,
            "eco_score": m.eco_score
        }

    # Pass a list of valid IDs so Llama knows EXACTLY what to type
    valid_model_ids = list(eco_context.keys())

    system_prompt = f"""
    You are a strict AI Efficiency Router. Your primary job is to save energy and compute costs by downgrading overkill model selections.
    
    User's Prompt: "{request.user_prompt}"
    User's Selected Model: "{request.selected_model}"
    
    Sustainability Context (Available Models & Energy Costs): 
    {json.dumps(eco_context, indent=2)}
    
    ROUTING RULES:
    1. Evaluate the complexity of the user's prompt (low, medium, high).
    2. If the task is simple (like summarization, basic math, or "Hello") AND the user selected a standard or heavy model, YOU MUST select a greener alternative from the context (e.g., a "nano" or "light" tier model).
    3. The recommended_model MUST be one of these exact IDs: {valid_model_ids}
    
    Respond ONLY with a valid JSON object. Example format:
    {{
      "complexity": "low", 
      "reasoning": "The user just said hello, which requires zero complex reasoning.",
      "recommended_model": "model_id_from_context"
    }}
    """

    payload = {
        "model": "llama3.2",  # Use a small, efficient model for routing decisions
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
