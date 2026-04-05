"""
Payment routes with carbon levy.
Owner: Person B

Endpoints:
  POST /v1/pay — execute agent payment with auto carbon levy
"""

from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from models.schemas import PayRequest, PayResponse

router = APIRouter()


@router.post("/pay", response_model=PayResponse)
async def pay(body: PayRequest, current_user=Depends(get_current_user)):
    # TODO: Person B implements
    # 1. Calculate carbon cost of the inference chain that led to this payment
    # 2. Calculate levy: carbon_cost_g * carbon_price_per_gram
    # 3. Execute payment via configured protocol (stripe_mpp / x402 / ap2)
    # 4. Route levy to Stripe Climate or configured destination
    # 5. Generate receipt (call Person C's receipt service)
    # 6. Return PayResponse
    raise HTTPException(501, "Not implemented yet")
