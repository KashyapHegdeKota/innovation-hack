"""Simple API key auth for GreenLedger.

For hackathon: lightweight auth using a user-provided API key header.
No Firebase dependency. The CLI sends `Authorization: Bearer <user-id-or-key>`
and the backend trusts it.

For production: replace with proper JWT/OAuth.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated

security = HTTPBearer()


async def get_current_user(
    token: Annotated[HTTPAuthorizationCredentials, Depends(security)],
):
    """Extract user identity from Bearer token.

    For hackathon: the token IS the user ID (e.g. "user-soham").
    For production: verify JWT and extract uid.
    """
    user_id = token.credentials.strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Run 'greenledger setup' to configure.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"uid": user_id}
