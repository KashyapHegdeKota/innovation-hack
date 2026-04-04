"""
Green Router & Inference routes.
Owner: Person A

Endpoints:
  POST /v1/route  — get routing recommendation (no execution)
  POST /v1/infer  — route + execute inference + generate receipt
"""

from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user
from ..models.schemas import (
    RouteRequest, RouteResponse,
    InferRequest, InferResponse,
)

router = APIRouter()


@router.post("/route", response_model=RouteResponse)
async def get_route(body: RouteRequest, current_user=Depends(get_current_user)):
    """
    Returns the optimal model + region for the given quality/carbon preferences.
    Does NOT execute inference — use /infer for that.
    """
    # TODO: Person A implements
    # 1. Resolve quality tier → candidate models from model_benchmarks
    # 2. For each candidate, check all available_regions
    # 3. Fetch grid carbon intensity for each region (from cache)
    # 4. Score: eco_efficiency * carbon_weight + cost * cost_weight
    # 5. Return best option
    raise HTTPException(501, "Not implemented yet")


@router.post("/infer", response_model=InferResponse)
async def infer(body: InferRequest, current_user=Depends(get_current_user)):
    """
    Full pipeline: route → wallet check → execute → receipt → wallet deduct → return.
    """
    # TODO: Person A implements (calls Person B's wallet, Person C's receipt)
    # 1. Call /route logic to select model+region
    # 2. If agent_id: check carbon wallet (Person B's service)
    # 3. Execute inference via ai_providers integration
    # 4. Generate receipt (Person C's service)
    # 5. Deduct wallet (Person B's service)
    # 6. Return InferResponse with result + receipt + wallet status
    raise HTTPException(501, "Not implemented yet")
