import os
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    FIREBASE_SERVICE_ACCOUNT_JSON: str = "firebase-service-account.json"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Initialize Firebase Admin SDK
# Note: You need to provide the service account JSON file
if not firebase_admin._apps:
    if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_JSON):
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback for environments where service account is provided via env vars
        # This is a hackathon-friendly fallback
        firebase_admin.initialize_app()

security = HTTPBearer()

async def get_current_user(token: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    try:
        # Verify the ID token sent from the frontend
        decoded_token = auth.verify_id_token(token.credentials)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
