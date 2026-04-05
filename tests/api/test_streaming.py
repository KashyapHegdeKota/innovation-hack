"""Tests for streaming inference support (B9)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from apps.api.services.streaming import (
    stream_inference,
    StreamChunk,
    StreamingNotSupported,
)


class TestStreamChunk:
    def test_chunk_has_required_fields(self):
        chunk = StreamChunk(text="Hello", done=False)
        assert chunk.text == "Hello"
        assert chunk.done is False

    def test_final_chunk(self):
        chunk = StreamChunk(
            text="",
            done=True,
            tokens_in=5,
            tokens_out=10,
            latency_ms=320,
        )
        assert chunk.done is True
        assert chunk.tokens_in == 5
        assert chunk.tokens_out == 10


class TestStreamAnthropicProvider:
    async def test_stream_anthropic_yields_chunks(self):
        # Build mock events
        event1 = MagicMock(type="content_block_delta")
        event1.delta.text = "Hi"
        event2 = MagicMock(type="content_block_delta")
        event2.delta.text = " there"
        event3 = MagicMock(type="message_stop")

        mock_message = MagicMock()
        mock_message.usage.input_tokens = 5
        mock_message.usage.output_tokens = 8

        # Build async context manager mock
        class MockStream:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return False

            async def __aiter__(self):
                for e in [event1, event2, event3]:
                    yield e

            async def get_final_message(self):
                return mock_message

        async def mock_stream_fn(*args, **kwargs):
            return MockStream()

        with patch(
            "apps.api.services.streaming._stream_anthropic",
            side_effect=mock_stream_fn,
        ):
            chunks = []
            async for chunk in stream_inference(
                model_id="claude-haiku-4-5",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            ):
                chunks.append(chunk)

            text_chunks = [c for c in chunks if not c.done]
            final = [c for c in chunks if c.done]
            assert len(text_chunks) == 2
            assert text_chunks[0].text == "Hi"
            assert text_chunks[1].text == " there"
            assert len(final) == 1
            assert final[0].tokens_in == 5
            assert final[0].tokens_out == 8
            assert final[0].latency_ms is not None


class TestStreamOpenAIProvider:
    async def test_stream_openai_yields_chunks(self):
        chunk1 = MagicMock()
        chunk1.choices = [MagicMock()]
        chunk1.choices[0].delta.content = "Hey"

        chunk2 = MagicMock()
        chunk2.choices = [MagicMock()]
        chunk2.choices[0].delta.content = " you"

        chunk3 = MagicMock()
        chunk3.choices = [MagicMock()]
        chunk3.choices[0].delta.content = None

        async def mock_openai_response():
            for c in [chunk1, chunk2, chunk3]:
                yield c

        async def mock_stream_fn(*args, **kwargs):
            return mock_openai_response()

        with patch(
            "apps.api.services.streaming._stream_openai",
            side_effect=mock_stream_fn,
        ):
            chunks = []
            async for chunk in stream_inference(
                model_id="gpt-5.2-mini",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            ):
                chunks.append(chunk)

            text_chunks = [c for c in chunks if not c.done]
            final = [c for c in chunks if c.done]
            assert len(text_chunks) == 2
            assert text_chunks[0].text == "Hey"
            assert text_chunks[1].text == " you"
            assert len(final) == 1
            assert final[0].tokens_out == 2


class TestStreamUnsupportedModel:
    async def test_unknown_model_raises(self):
        with pytest.raises(StreamingNotSupported):
            async for _ in stream_inference(
                model_id="nonexistent-model",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            ):
                pass

    async def test_google_streaming_not_supported(self):
        with pytest.raises(StreamingNotSupported, match="not supported"):
            async for _ in stream_inference(
                model_id="gemini-3.1-flash-lite-preview",
                prompt="Hello",
                max_tokens=100,
                api_key="sk-test",
            ):
                pass
