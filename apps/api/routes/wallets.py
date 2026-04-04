"""
Carbon Wallet routes.
Owner: Person B

Endpoints:
  POST   /v1/wallets               — create wallet for agent
  GET    /v1/wallets/{agent_id}    — get wallet status
  PATCH  /v1/wallets/{agent_id}    — update budget/policy
  GET    /v1/wallets/{agent_id}/history — transaction history
  POST   /v1/wallets/{agent_id}/offset  — manually purchase offset
"""

from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user
from ..models.schemas import (
    WalletCreate, WalletUpdate, WalletStatus,
    WalletTransactionRecord, PaginatedResponse,
)

router = APIRouter()


@router.post("/wallets", response_model=WalletStatus)
async def create_wallet(body: WalletCreate, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    # 1. Look up org from current_user
    # 2. Create carbon_wallets row with period_start=now, period_end=end of month
    # 3. Return WalletStatus
    raise HTTPException(501, "Not implemented yet")


@router.get("/wallets/{agent_id}", response_model=WalletStatus)
async def get_wallet(agent_id: str, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    raise HTTPException(501, "Not implemented yet")


@router.patch("/wallets/{agent_id}", response_model=WalletStatus)
async def update_wallet(agent_id: str, body: WalletUpdate, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/wallets/{agent_id}/history")
async def wallet_history(agent_id: str, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    # Return list of WalletTransactionRecord
    raise HTTPException(501, "Not implemented yet")


@router.post("/wallets/{agent_id}/offset")
async def purchase_offset(agent_id: str, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    # 1. Calculate outstanding carbon debt
    # 2. Purchase offset via Stripe Climate
    # 3. Credit wallet
    raise HTTPException(501, "Not implemented yet")
