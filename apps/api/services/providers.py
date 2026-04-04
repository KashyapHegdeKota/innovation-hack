"""Unified AI provider wrappers — BYOK key based inference (B2)."""
from __future__ import annotations

import time
from dataclasses import dataclass

from cli.models.registry import get_model


class ProviderError(Exception):
    pass


@dataclass(frozen=True)
class InferenceResult:
    text: str
    model: str
    provider: str
    tokens_in: int
    tokens_out: int
    latency_ms: int


async def _call_anthropic(model_id: str, prompt: str, max_tokens: int, api_key: str):
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    return await client.messages.create(
        model=model_id,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )


async def _call_openai(model_id: str, prompt: str, max_tokens: int, api_key: str):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    return await client.chat.completions.create(
        model=model_id,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )


async def _call_google(model_id: str, prompt: str, max_tokens: int, api_key: str):
    from google import genai
    client = genai.Client(api_key=api_key)
    response = await client.aio.models.generate_content(
        model=model_id,
        contents=prompt,
        config={"max_output_tokens": max_tokens},
    )
    return response


async def execute_inference(
    model_id: str,
    prompt: str,
    max_tokens: int,
    api_key: str,
) -> InferenceResult:
    model = get_model(model_id)
    if model is None:
        raise ProviderError(f"Unknown model: {model_id}")

    start = time.monotonic()
    try:
        if model.provider == "anthropic":
            resp = await _call_anthropic(model_id, prompt, max_tokens, api_key)
            text = resp.content[0].text
            tokens_in = resp.usage.input_tokens
            tokens_out = resp.usage.output_tokens
        elif model.provider == "openai":
            resp = await _call_openai(model_id, prompt, max_tokens, api_key)
            text = resp.choices[0].message.content
            tokens_in = resp.usage.prompt_tokens
            tokens_out = resp.usage.completion_tokens
        elif model.provider == "google":
            resp = await _call_google(model_id, prompt, max_tokens, api_key)
            text = resp.text
            tokens_in = resp.usage_metadata.prompt_token_count
            tokens_out = resp.usage_metadata.candidates_token_count
        else:
            raise ProviderError(f"Unsupported provider: {model.provider}")
    except ProviderError:
        raise
    except Exception as e:
        raise ProviderError(str(e)) from e

    latency_ms = int((time.monotonic() - start) * 1000)

    return InferenceResult(
        text=text,
        model=model_id,
        provider=model.provider,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
    )
