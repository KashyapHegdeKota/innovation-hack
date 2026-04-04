from supabase import create_client, Client
from pydantic_settings import BaseSettings
import os

class DatabaseSettings(BaseSettings):
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    class Config:
        env_file = ".env"

db_settings = DatabaseSettings()

def get_supabase_client() -> Client:
    if not db_settings.SUPABASE_URL or not db_settings.SUPABASE_SERVICE_ROLE_KEY:
        # In a real app, this should raise an error
        # For the hackathon boilerplate, we'll return None and handle it in the routes
        return None
    return create_client(db_settings.SUPABASE_URL, db_settings.SUPABASE_SERVICE_ROLE_KEY)
