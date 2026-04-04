"""BYOK key storage — encrypt, store, retrieve, delete user API keys."""
from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet


class KeyStore:
    """In-memory BYOK key store with Fernet encryption.

    For production, swap _store with Supabase reads/writes.
    """

    def __init__(self, encryption_key: str) -> None:
        # Derive a valid 32-byte Fernet key from arbitrary string
        raw = hashlib.sha256(encryption_key.encode()).digest()
        self._fernet = Fernet(base64.urlsafe_b64encode(raw))
        # In-memory store: {(user_id, provider): encrypted_key}
        self._store: dict[tuple[str, str], str] = {}

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self._fernet.decrypt(ciphertext.encode()).decode()

    def store_key(self, user_id: str, provider: str, api_key: str) -> None:
        encrypted = self.encrypt(api_key)
        self._store[(user_id, provider)] = encrypted

    def get_key(self, user_id: str, provider: str) -> str | None:
        encrypted = self._store.get((user_id, provider))
        if encrypted is None:
            return None
        return self.decrypt(encrypted)

    def delete_key(self, user_id: str, provider: str) -> None:
        self._store.pop((user_id, provider), None)

    def list_providers(self, user_id: str) -> list[str]:
        return [p for (u, p) in self._store if u == user_id]
