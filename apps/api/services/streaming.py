"""Streaming inference support — async generators for token-by-token output (B9)."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import AsyncGenerator

from cli.models.registry import get_model


class StreamingNotSupported(Exception):
    pass


@dataclass
class StreamChunk:
    text: str
    done: bool
    tokens_in: int | None = None
    tokens_out: int | None = None
    latency_ms: int | None = None


async def _stream_anthropic(
    model_id: str, prompt: str, max_tokens: int, api_key: str
):
    """Return an async context manager that yields Anthropic stream events."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    return client.messages.stream(
        model=model_id,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )


async def _stream_openai(
    model_id: str, prompt: str, max_tokens: int, api_key: str
):
    """Return an OpenAI streaming response."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    return await client.chat.completions.create(
        model=model_id,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
        stream_options={"include_usage": True},
    )


async def stream_inference(
    model_id: str,
    prompt: str,
    max_tokens: int,
    api_key: str,
) -> AsyncGenerator[StreamChunk, None]:
    """Stream inference results as chunks. Final chunk has done=True with token counts."""
    model = get_model(model_id)
    if model is None:
        raise StreamingNotSupported(f"Unknown model: {model_id}")

    start = time.monotonic()

    if model.provider == "anthropic":
        stream_ctx = await _stream_anthropic(model_id, prompt, max_tokens, api_key)
        async with stream_ctx as stream:
            async for event in stream:
                if hasattr(event, "type") and event.type == "content_block_delta":
                    yield StreamChunk(text=event.delta.text, done=False)

            final_msg = await stream.get_final_message()
            latency_ms = int((time.monotonic() - start) * 1000)
            yield StreamChunk(
                text="",
                done=True,
                tokens_in=final_msg.usage.input_tokens,
                tokens_out=final_msg.usage.output_tokens,
                latency_ms=latency_ms,
            )

    elif model.provider == "openai":
        response = await _stream_openai(model_id, prompt, max_tokens, api_key)
        collected_tokens = 0
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                collected_tokens += 1
                yield StreamChunk(text=text, done=False)

        latency_ms = int((time.monotonic() - start) * 1000)
        # OpenAI streaming doesn't give final usage in stream mode easily,
        # so we estimate from collected chunks
        yield StreamChunk(
            text="",
            done=True,
            tokens_in=None,  # not available in stream mode
            tokens_out=collected_tokens,
            latency_ms=latency_ms,
        )

    else:
        raise StreamingNotSupported(
            f"Streaming not supported for provider: {model.provider}"
        )
