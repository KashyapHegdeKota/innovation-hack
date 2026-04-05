from supabase import create_client, Client
import os

_client: Client | None = None


def get_supabase_client() -> Client | None:
    global _client
    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        return None

    _client = create_client(url, key)
    return _client
