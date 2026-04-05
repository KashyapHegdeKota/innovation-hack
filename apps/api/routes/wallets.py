"""
Carbon Wallet routes — reads from in-memory store.
"""

from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user
from ..store import get_wallet, _wallets

router = APIRouter()


@router.post("/wallets")
async def create_wallet(body: dict, current_user=Depends(get_current_user)):
    agent_id = body.get("agent_id", current_user["uid"])
    wallet = get_wallet(agent_id)
    if "monthly_budget_co2e_g" in body:
        wallet["monthly_budget_co2e_g"] = body["monthly_budget_co2e_g"]
    if "on_exceeded" in body:
        wallet["on_exceeded"] = body["on_exceeded"]
    return wallet


@router.get("/wallets/{agent_id}")
async def get_wallet_status(agent_id: str, current_user=Depends(get_current_user)):
    wallet = get_wallet(agent_id)
    utilization = (wallet["current_spend_co2e_g"] / wallet["monthly_budget_co2e_g"]) * 100
    return {
        **wallet,
        "remaining_co2e_g": wallet["monthly_budget_co2e_g"] - wallet["current_spend_co2e_g"],
        "utilization_pct": round(utilization, 1),
    }


@router.patch("/wallets/{agent_id}")
async def update_wallet(agent_id: str, body: dict, current_user=Depends(get_current_user)):
    wallet = get_wallet(agent_id)
    if "monthly_budget_co2e_g" in body:
        wallet["monthly_budget_co2e_g"] = body["monthly_budget_co2e_g"]
    if "on_exceeded" in body:
        wallet["on_exceeded"] = body["on_exceeded"]
    return wallet


@router.get("/wallets/{agent_id}/history")
async def wallet_history(agent_id: str, current_user=Depends(get_current_user)):
    wallet = get_wallet(agent_id)
    return wallet.get("transactions", [])


@router.post("/wallets/{agent_id}/offset")
async def purchase_offset(agent_id: str, current_user=Depends(get_current_user)):
    wallet = get_wallet(agent_id)
    return {"status": "offset_purchased", "agent_id": agent_id, "wallet": wallet}
