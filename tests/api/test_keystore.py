"""Tests for BYOK key storage (B4)."""
import pytest
from apps.api.services.keystore import KeyStore


class TestKeyStore:
    def setup_method(self):
        # Use in-memory store for tests (no Supabase dependency)
        self.ks = KeyStore(encryption_key="test-key-must-be-32-bytes-long!!")

    def test_encrypt_decrypt_roundtrip(self):
        original = "sk-ant-api03-realkey123"
        encrypted = self.ks.encrypt(original)
        assert encrypted != original
        assert self.ks.decrypt(encrypted) == original

    def test_store_and_retrieve_key(self):
        self.ks.store_key(user_id="user1", provider="anthropic", api_key="sk-test-123")
        result = self.ks.get_key(user_id="user1", provider="anthropic")
        assert result == "sk-test-123"

    def test_get_missing_key_returns_none(self):
        assert self.ks.get_key(user_id="user1", provider="openai") is None

    def test_list_providers_for_user(self):
        self.ks.store_key("user1", "anthropic", "key1")
        self.ks.store_key("user1", "openai", "key2")
        providers = self.ks.list_providers("user1")
        assert set(providers) == {"anthropic", "openai"}

    def test_delete_key(self):
        self.ks.store_key("user1", "anthropic", "key1")
        self.ks.delete_key("user1", "anthropic")
        assert self.ks.get_key("user1", "anthropic") is None

    def test_overwrite_key(self):
        self.ks.store_key("user1", "anthropic", "old-key")
        self.ks.store_key("user1", "anthropic", "new-key")
        assert self.ks.get_key("user1", "anthropic") == "new-key"
