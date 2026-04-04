"""Tests for POST /v1/infer endpoint (B6)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from apps.api.services.providers import InferenceResult


@pytest.fixture
def client():
    from apps.api.main import app
    from apps.api.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": "test-user"}
    yield TestClient(app)
    app.dependency_overrides.clear()


MOCK_INFERENCE = InferenceResult(
    text="Hello! How can I help?",
    model="claude-haiku-4-5",
    provider="anthropic",
    tokens_in=5,
    tokens_out=12,
    latency_ms=310,
)


class TestInferEndpoint:
    def test_infer_returns_response_and_receipt(self, client):
        with patch("apps.api.routes.infer.execute_inference", new_callable=AsyncMock) as mock_exec, \
             patch("apps.api.routes.infer.get_user_key", return_value="sk-test"):
            mock_exec.return_value = MOCK_INFERENCE
            resp = client.post("/v1/infer", json={
                "prompt": "Hi",
                "model": "claude-haiku-4-5",
                "max_tokens": 100,
            })
            assert resp.status_code == 200
            data = resp.json()
            assert data["text"] == "Hello! How can I help?"
            assert data["model"] == "claude-haiku-4-5"
            assert data["provider"] == "anthropic"
            assert data["tokens_in"] == 5
            assert data["tokens_out"] == 12
            # Receipt fields
            assert "receipt" in data
            assert data["receipt"]["co2e_g"] > 0
            assert data["receipt"]["energy_wh"] > 0
            assert data["receipt"]["water_ml"] > 0
            assert data["receipt"]["levy_usd"] > 0

    def test_infer_requires_prompt(self, client):
        resp = client.post("/v1/infer", json={"model": "claude-haiku-4-5"})
        assert resp.status_code == 422

    def test_infer_requires_model(self, client):
        resp = client.post("/v1/infer", json={"prompt": "Hi"})
        assert resp.status_code == 422

    def test_infer_unknown_model_returns_400(self, client):
        with patch("apps.api.routes.infer.get_user_key", return_value="sk-test"):
            resp = client.post("/v1/infer", json={
                "prompt": "Hi",
                "model": "nonexistent-model",
                "max_tokens": 100,
            })
            assert resp.status_code == 400

    def test_infer_missing_key_returns_401(self, client):
        with patch("apps.api.routes.infer.get_user_key", return_value=None):
            resp = client.post("/v1/infer", json={
                "prompt": "Hi",
                "model": "claude-haiku-4-5",
                "max_tokens": 100,
            })
            assert resp.status_code == 401
