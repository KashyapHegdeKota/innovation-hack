"""
Sustainability Score routes — computed from in-memory store.
"""

from fastapi import APIRouter, Depends
from auth import get_current_user
from store import get_dashboard_summary, get_agent_summaries, get_receipts

router = APIRouter()

# Model metadata for building routing alternatives
_MODEL_META = {
    "gpt-4.1-nano":      {"provider": "openai",     "tier": "nano",      "energy_wh": 0.10, "co2e_g": 0.023},
    "gpt-4.1-mini":      {"provider": "openai",     "tier": "light",     "energy_wh": 0.15, "co2e_g": 0.035},
    "claude-haiku-4-5":  {"provider": "anthropic",  "tier": "light",     "energy_wh": 0.20, "co2e_g": 0.047},
    "gemini-3.1-flash":  {"provider": "google",     "tier": "light",     "energy_wh": 0.18, "co2e_g": 0.042},
    "claude-sonnet-4-6": {"provider": "anthropic",  "tier": "standard",  "energy_wh": 0.24, "co2e_g": 0.056},
    "gpt-5.2-mini":      {"provider": "openai",     "tier": "standard",  "energy_wh": 0.30, "co2e_g": 0.070},
    "gemini-3.1-pro":    {"provider": "google",     "tier": "standard",  "energy_wh": 0.28, "co2e_g": 0.065},
    "gpt-5.2":           {"provider": "openai",     "tier": "heavy",     "energy_wh": 0.55, "co2e_g": 0.128},
    "claude-opus-4-6":   {"provider": "anthropic",  "tier": "heavy",     "energy_wh": 1.00, "co2e_g": 0.233},
    "o3-mini":           {"provider": "openai",     "tier": "reasoning", "energy_wh": 3.00, "co2e_g": 0.699},
    "o3":                {"provider": "openai",     "tier": "reasoning", "energy_wh": 33.0, "co2e_g": 7.689},
}
_ALTERNATIVES_SHOWN = ["gpt-4.1-nano", "claude-haiku-4-5", "gemini-3.1-flash", "claude-sonnet-4-6", "claude-opus-4-6"]


def _receipt_to_routing_decision(r: dict) -> dict:
    final_model = r.get("model") or "claude-haiku-4-5"
    requested_model = r.get("requested_model") or final_model
    savings_pct = int(r.get("comparison", {}).get("savings_pct", 0))

    # Determine assessment
    if requested_model != final_model and savings_pct >= 50:
        assessment = "overkill"
    elif requested_model != final_model and savings_pct > 0:
        assessment = "overkill"
    else:
        assessment = "appropriate"

    selected_meta = _MODEL_META.get(requested_model, {"provider": "anthropic", "tier": "standard", "energy_wh": 0.24, "co2e_g": 0.056})
    final_meta = _MODEL_META.get(final_model, {"provider": "anthropic", "tier": "light", "energy_wh": 0.20, "co2e_g": 0.047})

    alternatives = [
        {"model": m, **_MODEL_META[m]}
        for m in _ALTERNATIVES_SHOWN
        if m in _MODEL_META
    ]

    return {
        "id": r["id"],
        "timestamp": r["timestamp"],
        "prompt_preview": r.get("prompt_preview") or "(no preview)",
        "assessment": assessment,
        "accepted_recommendation": requested_model != final_model,
        "savings_if_switched_pct": savings_pct,
        "user_selected": {
            "model": requested_model,
            "provider": selected_meta["provider"],
            "tier": selected_meta["tier"],
            "energy_wh": selected_meta["energy_wh"],
            "co2e_g": selected_meta["co2e_g"],
        },
        "recommended": {
            "model": final_model,
            "provider": final_meta["provider"],
            "tier": final_meta["tier"],
            "energy_wh": final_meta["energy_wh"],
            "co2e_g": final_meta["co2e_g"],
        },
        "final_model": final_model,
        "alternatives": alternatives,
    }


@router.get("/scores/dashboard")
async def get_dashboard(current_user=Depends(get_current_user)):
    return get_dashboard_summary()


@router.get("/scores/agents")
async def get_agent_scores(current_user=Depends(get_current_user)):
    return get_agent_summaries()


@router.get("/scores/agents/{agent_id}")
async def get_agent_score(agent_id: str, current_user=Depends(get_current_user)):
    summaries = get_agent_summaries()
    agent = next((s for s in summaries if s["agent_id"] == agent_id), None)
    if not agent:
        return {
            "agent_id": agent_id,
            "display_name": agent_id,
            "total_inferences": 0,
            "total_co2e_g": 0,
            "total_energy_wh": 0,
            "wallet_utilization_pct": 0,
            "sustainability_score": 0,
            "trend": "on_track",
        }
    return agent


@router.get("/scores")
async def get_org_score(current_user=Depends(get_current_user)):
    summary = get_dashboard_summary()
    score = summary["sustainability_score"]
    return {
        "current_score": score,
        "previous_score": None,
        "change": None,
        "components": {
            "carbon_efficiency": min(100, score + 5),
            "budget_adherence": min(100, score + 10),
            "offset_coverage": max(0, score - 10),
            "optimization_adoption": score,
            "trend": score,
        },
        "recommendations": [
            {
                "id": "rec_1",
                "title": "Use lighter models for simple queries",
                "description": "Switch greeting and simple Q&A prompts to Haiku or GPT-4.1 Nano to save up to 90% CO2e.",
                "estimated_savings_co2e_g": 12.0,
                "estimated_savings_pct": 15,
                "priority": "high",
            }
        ] if len(get_receipts()) > 0 else [],
    }


@router.get("/router/decisions")
async def get_routing_decisions(current_user=Depends(get_current_user)):
    """Return all receipts as routing decisions for the Green Router page."""
    receipts = get_receipts(limit=200)
    return [_receipt_to_routing_decision(r) for r in receipts]


@router.get("/scores/recommendations")
async def get_recommendations(current_user=Depends(get_current_user)):
    receipts = get_receipts()
    if not receipts:
        return []
    return [
        {
            "id": "rec_1",
            "title": "Use lighter models for simple queries",
            "description": "Switch greeting and simple Q&A prompts to Haiku or GPT-4.1 Nano to save up to 90% CO2e.",
            "estimated_savings_co2e_g": 12.0,
            "estimated_savings_pct": 15,
            "priority": "high",
        }
    ]
