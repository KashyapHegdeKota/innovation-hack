"""Database stub — no external DB needed for hackathon.

All state is in-memory (keystore, session, model registry).
For production: swap with Supabase, PostgreSQL, or any DB client.
"""


def get_supabase_client():
    """Stub — returns None. Legacy endpoints handle this gracefully."""
    return None
