"""
Organization & Agent management routes.
Owner: Person A

Endpoints:
  POST   /v1/orgs                 — create org
  GET    /v1/orgs/me              — get current org
  POST   /v1/orgs/api-keys        — generate API key
  POST   /v1/agents               — register agent
  GET    /v1/agents               — list agents
  GET    /v1/agents/{agent_id}    — get agent
"""

from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user
from ..database import get_supabase_client
from ..models.schemas import (
    OrgCreate, OrgResponse,
    ApiKeyCreate, ApiKeyResponse, ApiKeyCreated,
    AgentCreate, AgentResponse,
)

router = APIRouter()


@router.post("/orgs", response_model=OrgResponse)
async def create_org(body: OrgCreate, current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/orgs/me", response_model=OrgResponse)
async def get_my_org(current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")


@router.post("/orgs/api-keys", response_model=ApiKeyCreated)
async def create_api_key(body: ApiKeyCreate, current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")


@router.post("/agents", response_model=AgentResponse)
async def register_agent(body: AgentCreate, current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/agents")
async def list_agents(current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, current_user=Depends(get_current_user)):
    # TODO: Person A implements
    raise HTTPException(501, "Not implemented yet")
