"""
Receipt routes — reads from in-memory store populated by /v1/infer.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from ..auth import get_current_user
from ..store import get_receipts, get_receipt_by_id, add_receipt, deduct_wallet
import json
import uuid
from datetime import datetime, timezone

router = APIRouter()


class CliReceiptBody(BaseModel):
    agent_id: str
    model: str
    provider: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    co2e_g: float
    energy_wh: float
    water_ml: float
    levy_usd: float
    naive_co2e_g: float = 0.0
    savings_pct: int = 0
    requested_model: str | None = None
    prompt_preview: str | None = None


@router.post("/receipts")
async def push_receipt(body: CliReceiptBody):
    """Accept a receipt pushed directly from the CLI after direct-API inference."""
    receipt_id = str(uuid.uuid4())
    add_receipt({
        "id": receipt_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": body.agent_id,
        "model": body.model,
        "provider": body.provider,
        "tokens_in": body.tokens_in,
        "tokens_out": body.tokens_out,
        "latency_ms": body.latency_ms,
        "environmental_cost": {
            "co2e_g": body.co2e_g,
            "energy_wh": body.energy_wh,
            "water_ml": body.water_ml,
        },
        "offset": {
            "levy_usd": body.levy_usd,
            "destination": "stripe_climate_frontier",
            "status": "confirmed",
        },
        "comparison": {
            "naive_co2e_g": body.naive_co2e_g,
            "savings_pct": body.savings_pct,
        },
        "requested_model": body.requested_model,
        "prompt_preview": body.prompt_preview,
    })
    deduct_wallet(body.agent_id, body.co2e_g, receipt_id)
    return {"receipt_id": receipt_id, "status": "ok"}


@router.get("/receipts/export")
async def export_receipts(
    format: str = "json",
    agent_id: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    receipts = get_receipts(agent_id=agent_id, limit=1000)
    if format == "csv":
        lines = ["id,timestamp,agent_id,model,provider,co2e_g,energy_wh,water_ml,levy_usd,savings_pct"]
        for r in receipts:
            ec = r["environmental_cost"]
            offset = r["offset"]
            comp = r.get("comparison") or {}
            lines.append(
                f"{r['id']},{r['timestamp']},{r.get('agent_id','')},{r.get('model','')},{r.get('provider','')},"
                f"{ec['co2e_g']},{ec['energy_wh']},{ec.get('water_ml',0)},"
                f"{offset['levy_usd']},{comp.get('savings_pct',0)}"
            )
        return JSONResponse(content="\n".join(lines), media_type="text/csv")
    return receipts


@router.get("/receipts/{receipt_id}")
async def get_receipt(receipt_id: str, current_user=Depends(get_current_user)):
    r = get_receipt_by_id(receipt_id)
    if not r:
        from fastapi import HTTPException
        raise HTTPException(404, "Receipt not found")
    return r


@router.get("/receipts")
async def list_receipts(
    agent_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user=Depends(get_current_user),
):
    return get_receipts(agent_id=agent_id, limit=limit, offset=offset)
