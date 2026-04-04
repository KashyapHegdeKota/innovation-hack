from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from .auth import get_current_user
from .database import get_supabase_client

app = FastAPI(
    title="GreenLedger API",
    description="Carbon-aware infrastructure layer for the agentic AI economy",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Register route modules
# Each teammate adds their routes in their own file under routes/
# ---------------------------------------------------------------------------

# Person A: org & agent management
from .routes import orgs  # noqa: E402
app.include_router(orgs.router, prefix="/v1", tags=["Organizations"])

# Person A: green router + inference
from .routes import infer  # noqa: E402
app.include_router(infer.router, prefix="/v1", tags=["Inference & Routing"])

# Person B: carbon wallets
from .routes import wallets  # noqa: E402
app.include_router(wallets.router, prefix="/v1", tags=["Carbon Wallets"])

# Person B: payments with carbon levy
from .routes import pay  # noqa: E402
app.include_router(pay.router, prefix="/v1", tags=["Payments"])

# Person C: receipts
from .routes import receipts  # noqa: E402
app.include_router(receipts.router, prefix="/v1", tags=["Receipts"])

# Person C: sustainability scores
from .routes import scores  # noqa: E402
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
