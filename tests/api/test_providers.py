"""Tests for AI provider wrappers (B2)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from apps.api.services.providers import (
    execute_inference,
    InferenceResult,
    ProviderError,
)


class TestInferenceResult:
    def test_result_has_required_fields(self):
        r = InferenceResult(
            text="Hello!",
            model="claude-haiku-4-5",
            provider="anthropic",
            tokens_in=5,
            tokens_out=10,
            latency_ms=320,
        )
        assert r.text == "Hello!"
        assert r.tokens_in == 5
        assert r.tokens_out == 10
        assert r.latency_ms == 320


class TestAnthropicProvider:
    async def test_execute_anthropic_model(self):
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Hi there!")]
        mock_response.usage = MagicMock(input_tokens=5, output_tokens=8)

        with patch("apps.api.services.providers._call_anthropic", new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            result = await execute_inference(
                model_id="claude-haiku-4-5",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            )
            assert result.text == "Hi there!"
            assert result.provider == "anthropic"
            assert result.tokens_in == 5
            assert result.tokens_out == 8

    async def test_execute_unknown_model_raises(self):
        with pytest.raises(ProviderError, match="Unknown model"):
            await execute_inference(
                model_id="nonexistent-model",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            )


class TestOpenAIProvider:
    async def test_execute_openai_model(self):
        mock_choice = MagicMock()
        mock_choice.message.content = "Hey!"
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_response.usage = MagicMock(prompt_tokens=5, completion_tokens=6)

        with patch("apps.api.services.providers._call_openai", new_callable=AsyncMock) as mock:
            mock.return_value = mock_response
            result = await execute_inference(
                model_id="gpt-5.2-mini",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            )
            assert result.text == "Hey!"
            assert result.provider == "openai"
            assert result.tokens_in == 5
            assert result.tokens_out == 6


class TestProviderErrors:
    async def test_api_error_wrapped_as_provider_error(self):
        with patch("apps.api.services.providers._call_anthropic", new_callable=AsyncMock) as mock:
            mock.side_effect = Exception("API rate limited")
            with pytest.raises(ProviderError, match="API rate limited"):
                await execute_inference(
                    model_id="claude-haiku-4-5",
                    prompt="Hello",
                    max_tokens=100,
                    api_key="sk-test",
                )
