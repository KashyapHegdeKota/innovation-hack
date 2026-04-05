"""
Persistent store for GreenLedger — backed by Supabase.
Falls back to in-memory if Supabase is not configured.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from .database import get_supabase_client

# ---------------------------------------------------------------------------
# In-memory fallback (used only if Supabase is not configured)
# ---------------------------------------------------------------------------
_receipts: list[dict[str, Any]] = []
_wallets: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Receipts
# ---------------------------------------------------------------------------

def add_receipt(receipt: dict[str, Any]) -> None:
    db = get_supabase_client()
    if db:
        db.table("receipts").insert({
            "id": receipt["id"],
            "timestamp": receipt["timestamp"],
            "agent_id": receipt["agent_id"],
            "model": receipt.get("model"),
            "provider": receipt.get("provider"),
            "tokens_in": receipt.get("tokens_in"),
            "tokens_out": receipt.get("tokens_out"),
            "latency_ms": receipt.get("latency_ms"),
            "co2e_g": receipt["environmental_cost"]["co2e_g"],
            "energy_wh": receipt["environmental_cost"]["energy_wh"],
            "water_ml": receipt["environmental_cost"].get("water_ml", 0),
            "levy_usd": receipt["offset"]["levy_usd"],
            "levy_destination": receipt["offset"].get("destination", "stripe_climate_frontier"),
            "levy_status": receipt["offset"].get("status", "confirmed"),
            "naive_co2e_g": receipt.get("comparison", {}).get("naive_co2e_g", 0),
            "savings_pct": receipt.get("comparison", {}).get("savings_pct", 0),
            "requested_model": receipt.get("requested_model"),
            "prompt_preview": receipt.get("prompt_preview"),
        }).execute()
    else:
        _receipts.append(receipt)


def get_receipts(
    agent_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    db = get_supabase_client()
    if db:
        q = db.table("receipts").select("*").order("timestamp", desc=True).limit(limit).offset(offset)
        if agent_id:
            q = q.eq("agent_id", agent_id)
        rows = q.execute().data or []
        return [_row_to_receipt(r) for r in rows]
    else:
        results = _receipts if not agent_id else [r for r in _receipts if r.get("agent_id") == agent_id]
        return sorted(results, key=lambda r: r["timestamp"], reverse=True)[offset: offset + limit]


def get_receipt_by_id(receipt_id: str) -> dict[str, Any] | None:
    db = get_supabase_client()
    if db:
        rows = db.table("receipts").select("*").eq("id", receipt_id).limit(1).execute().data
        return _row_to_receipt(rows[0]) if rows else None
    return next((r for r in _receipts if r["id"] == receipt_id), None)


def _row_to_receipt(r: dict) -> dict:
    """Convert a flat Supabase row back to the nested receipt format the frontend expects."""
    return {
        "id": r["id"],
        "timestamp": r["timestamp"],
        "agent_id": r["agent_id"],
        "model": r.get("model"),
        "provider": r.get("provider"),
        "tokens_in": r.get("tokens_in"),
        "tokens_out": r.get("tokens_out"),
        "latency_ms": r.get("latency_ms"),
        "environmental_cost": {
            "co2e_g": float(r.get("co2e_g", 0)),
            "energy_wh": float(r.get("energy_wh", 0)),
            "water_ml": float(r.get("water_ml", 0)),
        },
        "offset": {
            "levy_usd": float(r.get("levy_usd", 0)),
            "destination": r.get("levy_destination", "stripe_climate_frontier"),
            "status": r.get("levy_status", "confirmed"),
        },
        "comparison": {
            "naive_co2e_g": float(r.get("naive_co2e_g", 0)),
            "savings_pct": int(r.get("savings_pct", 0)),
        },
        "requested_model": r.get("requested_model"),
        "prompt_preview": r.get("prompt_preview"),
    }


# ---------------------------------------------------------------------------
# Wallets
# ---------------------------------------------------------------------------

_DEFAULT_BUDGET_G = 10_000.0


def get_wallet(agent_id: str) -> dict[str, Any]:
    db = get_supabase_client()
    if db:
        rows = db.table("carbon_wallets").select("*").eq("agent_id", agent_id).limit(1).execute().data
        if rows:
            return _row_to_wallet(rows[0])
        # Auto-create
        now = datetime.now(timezone.utc)
        row = {
            "id": str(uuid.uuid4()),
            "agent_id": agent_id,
            "monthly_budget_co2e_g": _DEFAULT_BUDGET_G,
            "current_spend_co2e_g": 0.0,
            "on_exceeded": "downgrade_model",
            "period_start": now.replace(day=1).isoformat(),
            "period_end": now.replace(day=28).isoformat(),
            "trend": "on_track",
        }
        db.table("carbon_wallets").insert(row).execute()
        return _row_to_wallet(row)
    else:
        if agent_id not in _wallets:
            now = datetime.now(timezone.utc)
            _wallets[agent_id] = {
                "id": str(uuid.uuid4()),
                "agent_id": agent_id,
                "monthly_budget_co2e_g": _DEFAULT_BUDGET_G,
                "current_spend_co2e_g": 0.0,
                "on_exceeded": "downgrade_model",
                "period_start": now.replace(day=1).isoformat(),
                "period_end": now.replace(day=28).isoformat(),
                "trend": "on_track",
                "transactions": [],
            }
        return _wallets[agent_id]


def deduct_wallet(agent_id: str, co2e_g: float, receipt_id: str) -> None:
    db = get_supabase_client()
    if db:
        wallet = get_wallet(agent_id)
        new_spend = float(wallet["current_spend_co2e_g"]) + co2e_g
        budget = float(wallet["monthly_budget_co2e_g"])
        pct = new_spend / budget
        trend = "exceeded" if pct >= 1 else "at_risk" if pct >= 0.8 else "on_track"

        db.table("carbon_wallets").update({
            "current_spend_co2e_g": new_spend,
            "trend": trend,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("agent_id", agent_id).execute()

        db.table("wallet_transactions").insert({
            "id": str(uuid.uuid4()),
            "agent_id": agent_id,
            "receipt_id": receipt_id,
            "co2e_g": co2e_g,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }).execute()
    else:
        wallet = get_wallet(agent_id)
        wallet["current_spend_co2e_g"] += co2e_g
        pct = wallet["current_spend_co2e_g"] / wallet["monthly_budget_co2e_g"]
        wallet["trend"] = "exceeded" if pct >= 1 else "at_risk" if pct >= 0.8 else "on_track"
        wallet.setdefault("transactions", []).append({
            "receipt_id": receipt_id, "co2e_g": co2e_g,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })


def _row_to_wallet(r: dict) -> dict:
    return {
        "id": r["id"],
        "agent_id": r["agent_id"],
        "monthly_budget_co2e_g": float(r.get("monthly_budget_co2e_g", _DEFAULT_BUDGET_G)),
        "current_spend_co2e_g": float(r.get("current_spend_co2e_g", 0)),
        "on_exceeded": r.get("on_exceeded", "downgrade_model"),
        "period_start": str(r.get("period_start", "")),
        "period_end": str(r.get("period_end", "")),
        "trend": r.get("trend", "on_track"),
    }


# ---------------------------------------------------------------------------
# Dashboard & agent summaries — computed from Supabase
# ---------------------------------------------------------------------------

def get_dashboard_summary() -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    receipts = get_receipts(limit=10_000)

    total_co2e = sum(r["environmental_cost"]["co2e_g"] for r in receipts)
    total_energy = sum(r["environmental_cost"]["energy_wh"] for r in receipts)
    total_water = sum(r["environmental_cost"].get("water_ml", 0) for r in receipts)
    total_levy = sum(r["offset"]["levy_usd"] for r in receipts)
    savings_list = [r["comparison"]["savings_pct"] for r in receipts if r.get("comparison")]
    avg_savings = sum(savings_list) / len(savings_list) if savings_list else 0
    agents = set(r["agent_id"] for r in receipts if r.get("agent_id"))

    return {
        "org_id": "org_demo",
        "total_inferences": len(receipts),
        "total_co2e_g": round(total_co2e, 4),
        "total_energy_wh": round(total_energy, 4),
        "total_water_ml": round(total_water, 4),
        "total_levy_usd": round(total_levy, 6),
        "total_carbon_removed_g": round(total_levy * 400, 2),
        "avg_savings_vs_naive_pct": round(avg_savings, 1),
        "sustainability_score": min(100, max(0, int(50 + avg_savings * 0.5))),
        "active_agents": len(agents),
        "period_start": now.replace(day=1).strftime("%Y-%m-%d"),
        "period_end": now.strftime("%Y-%m-%d"),
    }


def get_agent_summaries() -> list[dict[str, Any]]:
    from collections import defaultdict
    receipts = get_receipts(limit=10_000)
    by_agent: dict[str, list] = defaultdict(list)
    for r in receipts:
        if r.get("agent_id"):
            by_agent[r["agent_id"]].append(r)

    summaries = []
    for agent_id, agent_receipts in by_agent.items():
        total_co2e = sum(r["environmental_cost"]["co2e_g"] for r in agent_receipts)
        total_energy = sum(r["environmental_cost"]["energy_wh"] for r in agent_receipts)
        wallet = get_wallet(agent_id)
        utilization = (wallet["current_spend_co2e_g"] / wallet["monthly_budget_co2e_g"]) * 100
        savings_list = [r["comparison"]["savings_pct"] for r in agent_receipts if r.get("comparison")]
        avg_savings = sum(savings_list) / len(savings_list) if savings_list else 0
        score = min(100, max(0, int(50 + avg_savings * 0.5)))
        summaries.append({
            "agent_id": agent_id,
            "display_name": agent_id,
            "total_inferences": len(agent_receipts),
            "total_co2e_g": round(total_co2e, 4),
            "total_energy_wh": round(total_energy, 4),
            "wallet_utilization_pct": round(utilization, 1),
            "sustainability_score": score,
            "trend": wallet["trend"],
        })
    return sorted(summaries, key=lambda s: s["sustainability_score"], reverse=True)
