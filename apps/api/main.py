from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from dotenv import load_dotenv
import os
import sys

# Ensure apps/api and the repo root are on sys.path so all imports resolve
_api_dir  = os.path.dirname(os.path.abspath(__file__))
_repo_root = os.path.dirname(os.path.dirname(_api_dir))
for _p in [_api_dir, _repo_root]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Load .env from the api directory so Supabase creds are available
_env_path = os.path.join(_api_dir, ".env")
load_dotenv(_env_path)

from auth import get_current_user
from database import get_supabase_client

app = FastAPI(
    title="GreenLedger API",
    description="Carbon-aware infrastructure layer for the agentic AI economy",
    version="0.1.0",
)

# Configure CORS — reads from env so production domains work without code changes
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip().rstrip("/") for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Register route modules
# Each teammate adds their routes in their own file under routes/
# ---------------------------------------------------------------------------

# Person A: org & agent management
from routes import orgs  # noqa: E402
app.include_router(orgs.router, prefix="/v1", tags=["Organizations"])

# Person A: green router + inference
from routes import infer  # noqa: E402
app.include_router(infer.router, prefix="/v1", tags=["Inference & Routing"])

# Dev B: model comparison
from routes import models  # noqa: E402
app.include_router(models.router, prefix="/v1", tags=["Models"])

# Person B: carbon wallets
from routes import wallets  # noqa: E402
app.include_router(wallets.router, prefix="/v1", tags=["Carbon Wallets"])

# Person B: payments with carbon levy
from routes import pay  # noqa: E402
app.include_router(pay.router, prefix="/v1", tags=["Payments"])

# Person C: receipts
from routes import receipts  # noqa: E402
app.include_router(receipts.router, prefix="/v1", tags=["Receipts"])

# Person C: sustainability scores
from routes import scores  # noqa: E402
app.include_router(scores.router, prefix="/v1", tags=["Scores"])


# ---------------------------------------------------------------------------
# Health check (existing)
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "greenledger", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Legacy endpoints (keep for backward compat during migration)
# ---------------------------------------------------------------------------

@app.get("/api/data")
async def get_user_data(current_user: Dict = Depends(get_current_user)):
    uid = current_user["uid"]
    supabase = get_supabase_client()

    if not supabase:
        return [
            {"id": 1, "title": "Hackathon Idea 1", "author_id": uid},
            {"id": 2, "title": "Mock Data (Configure Supabase for real persistence)", "author_id": uid}
        ]

    try:
        response = supabase.table("hacks").select("*").eq("author_id", uid).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/data")
async def create_user_data(data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    uid = current_user["uid"]
    supabase = get_supabase_client()

    if not supabase:
        return {"message": "Mock creation successful", "data": data, "uid": uid}

    data["author_id"] = uid

    try:
        response = supabase.table("hacks").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
