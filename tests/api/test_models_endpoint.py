"""Tests for GET /v1/models comparison endpoint (B8)."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from apps.api.main import app
    from apps.api.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": "test-user"}
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestModelsEndpoint:
    def test_list_all_models(self, client):
        resp = client.get("/v1/models")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 6

    def test_model_has_required_fields(self, client):
        resp = client.get("/v1/models")
        model = resp.json()[0]
        for field in ("id", "display", "provider", "tier", "energy_wh", "eco_score"):
            assert field in model, f"Missing field: {field}"

    def test_filter_by_tier(self, client):
        resp = client.get("/v1/models", params={"tier": "light"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(m["tier"] == "light" for m in data)

    def test_filter_by_provider(self, client):
        resp = client.get("/v1/models", params={"provider": "anthropic"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(m["provider"] == "anthropic" for m in data)

    def test_sorted_by_eco_score_descending(self, client):
        resp = client.get("/v1/models", params={"tier": "light"})
        data = resp.json()
        scores = [m["eco_score"] for m in data]
        assert scores == sorted(scores, reverse=True)

    def test_invalid_tier_returns_empty(self, client):
        resp = client.get("/v1/models", params={"tier": "nonexistent"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_compare_same_tier(self, client):
        """Models within same tier should be comparable by eco_score."""
        resp = client.get("/v1/models", params={"tier": "standard"})
        data = resp.json()
        assert len(data) >= 2
        # Best eco model should be first
        assert data[0]["eco_score"] >= data[1]["eco_score"]
