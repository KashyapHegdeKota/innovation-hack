from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from .auth import get_current_user
from .database import get_supabase_client

app = FastAPI(title="Hackathon API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/api/data")
async def get_user_data(current_user: Dict = Depends(get_current_user)):
    """
    Protected endpoint that returns data specific to the authenticated user.
    """
    uid = current_user["uid"]
    supabase = get_supabase_client()
    
    if not supabase:
        # Fallback for hackathon demo if Supabase is not yet configured
        return [
            {"id": 1, "title": "Hackathon Idea 1", "author_id": uid},
            {"id": 2, "title": "Mock Data (Configure Supabase for real persistence)", "author_id": uid}
        ]
    
    try:
        # Perform CRUD filtered by firebase_uid to ensure data isolation
        response = supabase.table("hacks").select("*").eq("author_id", uid).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/data")
async def create_user_data(data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """
    Protected endpoint to create user-specific data.
    """
    uid = current_user["uid"]
    supabase = get_supabase_client()
    
    if not supabase:
        return {"message": "Mock creation successful", "data": data, "uid": uid}

    # Explicitly attach the user's UID for security
    data["author_id"] = uid
    
    try:
        response = supabase.table("hacks").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
