from supabase import create_client, Client
from pydantic_settings import BaseSettings
import os

class DatabaseSettings(BaseSettings):
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase_client():
    """Stub — returns None. Legacy endpoints handle this gracefully."""
    return None
