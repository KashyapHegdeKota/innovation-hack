"""
Sustainability Score routes.
Owner: Person C

Endpoints:
  GET /v1/scores                           — org-level score + trend
  GET /v1/scores/agents                    — all agent scores
  GET /v1/scores/agents/{agent_id}         — single agent score detail
  GET /v1/scores/recommendations           — optimization suggestions
  GET /v1/scores/dashboard                 — aggregated dashboard summary
"""

from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user
from ..models.schemas import (
    SustainabilityScore, ScoreSummary, Recommendation,
    DashboardSummary, AgentSummary,
)

router = APIRouter()


@router.get("/scores", response_model=ScoreSummary)
async def get_org_score(current_user=Depends(get_current_user)):
    # TODO: Person C implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/scores/agents")
async def get_agent_scores(current_user=Depends(get_current_user)):
    # TODO: Person C implements
    # Return list of AgentSummary with scores
    raise HTTPException(501, "Not implemented yet")


@router.get("/scores/agents/{agent_id}", response_model=ScoreSummary)
async def get_agent_score(agent_id: str, current_user=Depends(get_current_user)):
    # TODO: Person C implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/scores/recommendations")
async def get_recommendations(current_user=Depends(get_current_user)):
    # TODO: Person C implements
    # Return list of Recommendation
    raise HTTPException(501, "Not implemented yet")


@router.get("/scores/dashboard", response_model=DashboardSummary)
async def get_dashboard_summary(current_user=Depends(get_current_user)):
    # TODO: Person C implements
    # Aggregate from receipts table:
    # total inferences, total CO2e, total energy, total levy, etc.
    raise HTTPException(501, "Not implemented yet")
