"""
GreenLedger CLI — Claude Code Clone
Full workflow: welcome → model selection → router analysis → inference → receipt → exit summary
"""

import asyncio
import os
import sys
import json
import subprocess
import httpx
import time
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.text import Text
from rich.table import Table
from rich.rule import Rule
from rich.align import Align
from rich import box
from prompt_toolkit import PromptSession
from prompt_toolkit.styles import Style
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory

from tools import ToolExecutor
from renderer import Renderer
from config import load_config, run_setup, CONFIG_FILE, CONFIG_DIR

console = Console()

# ── Config ──────────────────────────────────────────────────────────────────────

API_URL           = "https://api.anthropic.com/v1/messages"
ROUTER_URL   = os.environ.get("ROUTER_URL",   "https://api.kashyaphegde.com/greenledger/v1/analyze")
INFER_URL    = os.environ.get("INFER_URL",    "https://api.kashyaphegde.com/greenledger/v1/infer")
RECEIPTS_URL = os.environ.get("RECEIPTS_URL", "https://api.kashyaphegde.com/greenledger/v1/receipts")

# --- AUTHENTICATION HEADERS ---
# Load the config once at startup to grab the Auth0 token
_local_cfg = load_config()
AUTH_TOKEN = _local_cfg.get("auth_token", "")

# If the user is logged in, attach the Bearer token. Otherwise, send empty headers.
API_HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"} if AUTH_TOKEN else {}

# ── Model registry ───────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ModelInfo:
    id: str
    display: str
    provider: str
    tier: str
    energy_wh: float
    eco_score: float

MODELS = [
    ModelInfo("gpt-4.1-nano",      "GPT-4.1 Nano",      "openai",    "nano",      0.10, 0.91),
    ModelInfo("gpt-4.1-mini",      "GPT-4.1 Mini",      "openai",    "light",     0.15, 0.86),
    ModelInfo("claude-haiku-4-5",  "Claude Haiku 4.5",  "anthropic", "light",     0.20, 0.89),
    ModelInfo("gemini-3.1-flash",  "Gemini 3.1 Flash",  "google",    "light",     0.18, 0.88),
    ModelInfo("claude-sonnet-4-6", "Claude Sonnet 4.6", "anthropic", "standard",  0.24, 0.825),
    ModelInfo("gpt-5.2-mini",      "GPT-5.2 Mini",      "openai",    "standard",  0.30, 0.81),
    ModelInfo("gemini-3.1-pro",    "Gemini 3.1 Pro",    "google",    "standard",  0.28, 0.83),
    ModelInfo("gpt-5.2",           "GPT-5.2",           "openai",    "heavy",     0.55, 0.77),
    ModelInfo("claude-opus-4-6",   "Claude Opus 4.6",   "anthropic", "heavy",     1.00, 0.72),
    ModelInfo("o3-mini",           "o3-mini",           "openai",    "reasoning", 3.00, 0.884),
    ModelInfo("o3",                "o3",                "openai",    "reasoning", 33.0, 0.758),
]
MODEL_INDEX = {m.id: m for m in MODELS}

TIER_COLOR     = {"nano": "bright_green", "light": "green", "standard": "yellow",
                  "heavy": "red", "reasoning": "bright_red"}
PROVIDER_ICON  = {"anthropic": "◆", "openai": "○", "google": "◇"}

ANTHROPIC_API_IDS = {
    "claude-haiku-4-5":  "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6": "claude-sonnet-4-20250514",
    "claude-opus-4-6":   "claude-opus-4-20250514",
}
NON_ANTHROPIC_FALLBACK = {
    "gpt-4.1-nano":     "claude-haiku-4-5",
    "gpt-4.1-mini":     "claude-haiku-4-5",
    "gemini-3.1-flash": "claude-haiku-4-5",
    "gpt-5.2-mini":     "claude-sonnet-4-6",
    "gemini-3.1-pro":   "claude-sonnet-4-6",
    "gpt-5.2":          "claude-opus-4-6",
    "o3-mini":          "claude-opus-4-6",
    "o3":               "claude-opus-4-6",
}

def to_api_model(model_id: str) -> str:
    return ANTHROPIC_API_IDS.get(model_id, model_id)

def resolve_model(name: str) -> str:
    name = name.strip()
    if name in MODEL_INDEX:
        return name
    aliases = {
        "haiku": "claude-haiku-4-5", "sonnet": "claude-sonnet-4-6",
        "opus": "claude-opus-4-6", "claude-haiku": "claude-haiku-4-5",
        "claude-sonnet": "claude-sonnet-4-6", "claude-opus": "claude-opus-4-6",
        "claude-haiku-4-5-20251001": "claude-haiku-4-5",
        "claude-sonnet-4-20250514":  "claude-sonnet-4-6",
        "claude-opus-4-20250514":    "claude-opus-4-6",
    }
    return aliases.get(name.lower(), name)

# ── Session state ────────────────────────────────────────────────────────────────

@dataclass
class SessionStats:
    queries:            int   = 0
    total_co2e_g:       float = 0.0
    total_energy_wh:    float = 0.0
    total_water_ml:     float = 0.0
    total_cost_usd:     float = 0.0
    router_suggestions: int   = 0
    router_accepted:    int   = 0
    start_time:         float = field(default_factory=time.time)

    def add_receipt(self, r: dict):
        self.queries         += 1
        self.total_co2e_g    += r.get("co2e_g",    0.0)
        self.total_energy_wh += r.get("energy_wh", 0.0)
        self.total_water_ml  += r.get("water_ml",  0.0)
        self.total_cost_usd  += r.get("levy_usd",  0.0)

# ── Router probe ─────────────────────────────────────────────────────────────────

_active_router_url: str = ROUTER_URL

async def probe_router() -> Optional[str]:
    candidates = list(dict.fromkeys([
        ROUTER_URL,
        "http://localhost:8000/v1/router/analyze",
        "http://localhost:8000/analyze",
        "http://localhost:8000/v1/analyze",
    ]))
    async with httpx.AsyncClient(timeout=120.0) as client:
        for url in candidates:
            try:
                r = await client.post(
                    url,
                    json={"user_prompt": "ping", "selected_model": "claude-sonnet-4-6"},
                )
                if r.status_code != 404:
                    return url
            except httpx.ConnectError:
                pass
    return None

# ── Router call ──────────────────────────────────────────────────────────────────

async def check_router(user_prompt: str, model_id: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                _active_router_url,
                headers = API_HEADERS,
                json={"user_prompt": user_prompt, "selected_model": model_id},
            )
            resp.raise_for_status()
            return resp.json().get("routing", {})
    except httpx.ConnectError:
        return {}
    except Exception as e:
        console.print(f"[dim yellow]Router: {e}[/]")
        return {}

# ── /v1/infer call ───────────────────────────────────────────────────────────────

async def call_infer(prompt: str, model_id: str, max_tokens: int = 1024) -> Optional[dict]:
    """Call your FastAPI /v1/infer. Returns response dict or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                INFER_URL,
                headers=API_HEADERS,
                json={"prompt": prompt, "model": model_id, "max_tokens": max_tokens},
            )
            if resp.status_code == 401:
                console.print("[dim yellow]No BYOK key for this provider — using direct API[/]")
                return None
            resp.raise_for_status()
            return resp.json()
    except httpx.ConnectError:
        return None
    except Exception as e:
        console.print(f"[dim yellow]/v1/infer: {e} — falling back[/]")
        return None


async def push_receipt(
    receipt: dict,
    model_id: str,
    tokens_in: int,
    tokens_out: int,
    latency_ms: int,
    requested_model: str | None = None,
    prompt_preview: str | None = None,
) -> None:
    """Push a locally-computed receipt to the backend for persistence in Supabase."""
    mi = MODEL_INDEX.get(model_id)
    provider = mi.provider if mi else "anthropic"
    naive_co2e = receipt.get("co2e_g", 0) * 4
    savings_pct = round((1 - receipt.get("co2e_g", 0) / naive_co2e) * 100) if naive_co2e > 0 else 0
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(RECEIPTS_URL, headers=API_HEADERS, json={
                "agent_id": "cli-user",
                "model": model_id,
                "provider": provider,
                "tokens_in": tokens_in if isinstance(tokens_in, int) else 0,
                "tokens_out": tokens_out if isinstance(tokens_out, int) else 0,
                "latency_ms": latency_ms,
                "co2e_g": receipt.get("co2e_g", 0),
                "energy_wh": receipt.get("energy_wh", 0),
                "water_ml": receipt.get("water_ml", 0),
                "levy_usd": receipt.get("levy_usd", 0),
                "naive_co2e_g": naive_co2e,
                "savings_pct": savings_pct,
                "requested_model": requested_model or model_id,
                "prompt_preview": prompt_preview,
            })
    except Exception:
        pass  # Silent — backend unavailable is fine for offline use


# ── Direct Anthropic streaming ───────────────────────────────────────────────────

SYSTEM_PROMPT = """You are GreenLedger's AI coding assistant — a Claude Code clone running in the terminal.

You have access to the following tools:
- read_file: Read a file from disk
- write_file: Write/overwrite a file on disk
- edit_file: Apply a targeted find-and-replace patch to a file
- bash: Execute a shell command and return stdout/stderr
- list_files: List files in a directory
- grep_search: Search for a pattern across files

Working directory: {cwd}

Guidelines:
- Always read files before editing them
- Show your reasoning briefly before using tools
- After edits, confirm what changed
- Be concise — this is a terminal, not a chat app
- Use bash to run tests or validate changes
- Prefer targeted edits over full rewrites
"""

TOOLS = [
    {"name": "read_file",
     "description": "Read the contents of a file at the given path.",
     "input_schema": {"type": "object",
                      "properties": {"path": {"type": "string"}},
                      "required": ["path"]}},
    {"name": "write_file",
     "description": "Write content to a file.",
     "input_schema": {"type": "object",
                      "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
                      "required": ["path", "content"]}},
    {"name": "edit_file",
     "description": "Apply a find-and-replace edit. old_str must match exactly.",
     "input_schema": {"type": "object",
                      "properties": {"path": {"type": "string"},
                                     "old_str": {"type": "string"},
                                     "new_str": {"type": "string"}},
                      "required": ["path", "old_str", "new_str"]}},
    {"name": "bash",
     "description": "Run a shell command. Returns stdout and stderr.",
     "input_schema": {"type": "object",
                      "properties": {"command": {"type": "string"},
                                     "timeout": {"type": "integer", "default": 30}},
                      "required": ["command"]}},
    {"name": "list_files",
     "description": "List files in a directory.",
     "input_schema": {"type": "object",
                      "properties": {"path": {"type": "string", "default": "."},
                                     "recursive": {"type": "boolean", "default": False}}}},
    {"name": "grep_search",
     "description": "Search for a regex pattern across files.",
     "input_schema": {"type": "object",
                      "properties": {"pattern": {"type": "string"},
                                     "path": {"type": "string", "default": "."},
                                     "file_glob": {"type": "string", "default": "*"}},
                      "required": ["pattern"]}},
]


async def stream_anthropic(messages: list, cwd: str, model_id: str) -> tuple[str, list]:
    """Direct Anthropic streaming with tool loop. Returns (text, tool_calls)."""
    renderer = Renderer(console)
    executor = ToolExecutor(cwd, console)
    tool_calls_made: list = []

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": to_api_model(model_id),
        "max_tokens": 8096,
        "system": SYSTEM_PROMPT.format(cwd=cwd),
        "tools": TOOLS,
        "messages": messages,
        "stream": True,
    }
    final_text = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        while True:
            current_text = ""
            tool_uses: list = []
            stop_reason = None
            current_block = None
            current_tool_input_str = ""

            async with client.stream("POST", API_URL, headers=headers, json=payload) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    console.print(f"[bold red]API Error {resp.status_code}:[/] {body.decode()}")
                    return "", []

                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:]
                    if raw == "[DONE]":
                        break
                    try:
                        event = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    etype = event.get("type", "")

                    if etype == "content_block_start":
                        current_block = event["content_block"]
                        current_tool_input_str = ""
                        if current_block["type"] == "tool_use":
                            tool_uses.append({
                                "id": current_block["id"],
                                "name": current_block["name"],
                                "input": {},
                            })

                    elif etype == "content_block_delta":
                        delta = event["delta"]
                        if delta["type"] == "text_delta":
                            chunk = delta["text"]
                            current_text += chunk
                            renderer.stream_text(chunk)
                        elif delta["type"] == "input_json_delta":
                            current_tool_input_str += delta["partial_json"]

                    elif etype == "content_block_stop":
                        if current_block and current_block.get("type") == "tool_use":
                            try:
                                parsed = json.loads(current_tool_input_str) if current_tool_input_str else {}
                            except json.JSONDecodeError:
                                parsed = {}
                            tool_uses[-1]["input"] = parsed

                    elif etype == "message_delta":
                        stop_reason = event["delta"].get("stop_reason")

            renderer.flush_text()
            final_text += current_text

            if stop_reason == "end_turn" or not tool_uses:
                break

            tool_results = []
            for tool in tool_uses:
                tool_calls_made.append(tool)
                result = await executor.execute(tool["name"], tool["input"])
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool["id"],
                    "content": result,
                })

            assistant_content = []
            if current_text:
                assistant_content.append({"type": "text", "text": current_text})
            for tool in tool_uses:
                assistant_content.append({
                    "type": "tool_use",
                    "id": tool["id"],
                    "name": tool["name"],
                    "input": tool["input"],
                })

            payload["messages"] = payload["messages"] + [
                {"role": "assistant", "content": assistant_content},
                {"role": "user", "content": tool_results},
            ]

    return final_text, tool_calls_made

async def stream_openai(messages: list, cwd: str, model_id: str) -> tuple[str, list]:
    """Direct OpenAI streaming fallback."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        console.print("[bold red]Error:[/] OPENAI_API_KEY not set. Run 'python main.py setup'.")
        return "", []

    renderer = Renderer(console)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    # Convert Anthropic-style messages to OpenAI format (they're compatible for basic text)
    oai_messages = [{"role": "system", "content": SYSTEM_PROMPT.format(cwd=cwd)}] + messages
    payload = {
        "model": model_id,  # e.g. "gpt-4.1-nano" — OpenAI accepts these directly
        "messages": oai_messages,
        "max_tokens": 8096,
        "stream": True,
    }
    final_text = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", "https://api.openai.com/v1/chat/completions",
                                  headers=headers, json=payload) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                console.print(f"[bold red]OpenAI Error {resp.status_code}:[/] {body.decode()}")
                return "", []

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                if raw == "[DONE]":
                    break
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                delta = event.get("choices", [{}])[0].get("delta", {})
                chunk = delta.get("content", "")
                if chunk:
                    final_text += chunk
                    renderer.stream_text(chunk)

    renderer.flush_text()
    return final_text, []


async def stream_gemini(messages: list, cwd: str, model_id: str) -> tuple[str, list]:
    """Direct Gemini streaming fallback."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        console.print("[bold red]Error:[/] GEMINI_API_KEY not set. Run 'python main.py setup'.")
        return "", []

    renderer = Renderer(console)

    # Convert to Gemini's `contents` format
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    # Prepend system instruction as a user/model exchange (Gemini's way)
    system_turn = [
        {"role": "user",  "parts": [{"text": SYSTEM_PROMPT.format(cwd=cwd)}]},
        {"role": "model", "parts": [{"text": "Understood."}]},
    ]

    payload = {
        "contents": system_turn + contents,
        "generationConfig": {"maxOutputTokens": 8096},
    }
    # For now, strip our internal prefix and let the API validate.
    GEMINI_MODEL_MAP = {
        "gemini-3.1-flash": "gemini-3.1-flash-lite-preview",
        "gemini-3.1-pro":   "gemini-3.1-pro-preview",
    }
    gemini_model = GEMINI_MODEL_MAP.get(model_id, model_id)
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{gemini_model}:streamGenerateContent?alt=sse&key={api_key}"
    )
    final_text = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, json=payload) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                console.print(f"[bold red]Gemini Error {resp.status_code}:[/] {body.decode()}")
                return "", []

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                chunk = (
                    event.get("candidates", [{}])[0]
                         .get("content", {})
                         .get("parts", [{}])[0]
                         .get("text", "")
                )
                if chunk:
                    final_text += chunk
                    renderer.stream_text(chunk)

    renderer.flush_text()
    return final_text, []


def get_stream_fn(model_id: str):
    """Return the right streaming function for a model's provider."""
    info = MODEL_INDEX.get(model_id)
    if info is None:
        return stream_anthropic  # best-effort fallback
    return {
        "anthropic": stream_anthropic,
        "openai":    stream_openai,
        "google":    stream_gemini,
    }.get(info.provider, stream_anthropic)
# ── UI Components ────────────────────────────────────────────────────────────────

def energy_bar(energy_wh: float, max_wh: float = 33.0, width: int = 10) -> str:
    ratio  = min(energy_wh / max_wh, 1.0)
    filled = round(ratio * width)
    color  = (
        "bright_green" if ratio < 0.05 else
        "green"        if ratio < 0.15 else
        "yellow"       if ratio < 0.40 else
        "red"
    )
    return f"[{color}]{'█' * filled}{'░' * (width - filled)}[/]"


def render_welcome(cwd: str, branch: str, router_url: Optional[str]):
    console.clear()
    console.print()
    console.print(Align.center(
        "[bold bright_green]"
        "  ██████╗ ██████╗ ███████╗███████╗███╗   ██╗\n"
        " ██╔════╝ ██╔══██╗██╔════╝██╔════╝████╗  ██║\n"
        " ██║  ███╗██████╔╝█████╗  █████╗  ██╔██╗ ██║\n"
        " ██║   ██║██╔══██╗██╔══╝  ██╔══╝  ██║╚██╗██║\n"
        " ╚██████╔╝██║  ██║███████╗███████╗██║ ╚████║\n"
        "  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝[/]\n"
        "[dim green]  L E D G E R   ·   A I   C L I[/]"
    ))
    console.print()

    meta = Table(box=None, show_header=False, padding=(0, 2))
    meta.add_column(style="dim", justify="right")
    meta.add_column()
    meta.add_row("cwd",    f"[green]{cwd}[/]")
    meta.add_row("branch", f"[magenta]⎇  {branch}[/]")
    meta.add_row("router",
                 f"[bright_green]✓ {router_url}[/]" if router_url
                 else "[red]✗ unreachable (routing disabled)[/]")
    meta.add_row("tools",  "[dim]read · write · edit · bash · ls · grep[/]")
    meta.add_row("cmds",   "[dim]/model  /stats  /exit  clear  cd <path>[/]")
    console.print(Align.center(meta))
    console.print()
    console.print(Rule("[dim]select a model to begin[/]", style="dim green"))
    console.print()


def render_model_menu():
    table = Table(
        box=box.SIMPLE,
        show_header=True,
        header_style="bold dim",
        border_style="dim green",
        padding=(0, 1),
    )
    table.add_column("#",        width=3,  style="dim")
    table.add_column("Model",    width=22)
    table.add_column("Provider", width=10, style="dim")
    table.add_column("Tier",     width=10)
    table.add_column("Energy",   width=18)
    table.add_column("Eco",      width=6,  justify="right")

    for i, m in enumerate(MODELS, 1):
        tier_col   = f"[{TIER_COLOR[m.tier]}]{m.tier}[/]"
        icon       = PROVIDER_ICON.get(m.provider, "·")
        energy_col = energy_bar(m.energy_wh) + f" [dim]{m.energy_wh:.2f}Wh[/]"
        eco_col    = f"[green]{m.eco_score:.3f}[/]"
        table.add_row(str(i), f"{icon} {m.display}", m.provider, tier_col, energy_col, eco_col)

    console.print(table)


def render_receipt(receipt: dict, model_id: str, latency_ms: int, tok_in: int | str = "—", tok_out: int | str = "—"):
    info = MODEL_INDEX.get(model_id)

    grid = Table(box=None, show_header=False, padding=(0, 2))
    grid.add_column(style="dim", justify="right")
    grid.add_column()

    co2e   = receipt.get("co2e_g",    0.0)
    energy = receipt.get("energy_wh", 0.0)
    water  = receipt.get("water_ml",  0.0)
    levy   = receipt.get("levy_usd",  0.0)

    grid.add_row("model",       f"[cyan]{info.display if info else model_id}[/]")
    grid.add_row("latency",     f"[white]{latency_ms}ms[/]")
    grid.add_row("tokens",      f"[dim]{tok_in} in  /  {tok_out} out[/]") # <-- Uses the new arguments
    grid.add_row("CO₂e",        f"[yellow]{co2e:.5f} g[/]")
    grid.add_row("energy",      f"[yellow]{energy:.5f} Wh[/]")
    grid.add_row("water",       f"[blue]{water:.3f} mL[/]")
    grid.add_row("carbon levy", f"[dim]${levy:.6f} USD[/]")

    console.print()
    console.print(Panel(
        grid,
        title="[dim green]🌿 environmental receipt[/]",
        border_style="dim green",
        padding=(0, 2),
    ))

def render_exit_summary(stats: SessionStats):
    elapsed = time.time() - stats.start_time
    mins    = int(elapsed // 60)
    secs    = int(elapsed % 60)
    pct     = (round(stats.router_accepted / stats.router_suggestions * 100)
               if stats.router_suggestions else 0)

    grid = Table(box=None, show_header=False, padding=(0, 2))
    grid.add_column(style="dim", justify="right")
    grid.add_column()
    grid.add_row("session time",        f"[white]{mins}m {secs}s[/]")
    grid.add_row("total queries",       f"[white]{stats.queries}[/]")
    grid.add_row("total CO₂e",          f"[yellow]{stats.total_co2e_g:.5f} g[/]")
    grid.add_row("total energy",        f"[yellow]{stats.total_energy_wh:.5f} Wh[/]")
    grid.add_row("total water",         f"[blue]{stats.total_water_ml:.3f} mL[/]")
    grid.add_row("carbon levy",         f"[dim]${stats.total_cost_usd:.6f} USD[/]")
    grid.add_row("router suggestions",  f"[white]{stats.router_suggestions}[/]")
    grid.add_row("suggestions accepted",
                 f"[green]{stats.router_accepted}[/][dim]  ({pct}% acceptance rate)[/]")

    console.print()
    console.print(Panel(
        grid,
        title="[bold green]◆ session summary[/]",
        border_style="green",
        padding=(1, 2),
    ))
    console.print()

# ── Prompt helper ────────────────────────────────────────────────────────────────

def build_style() -> Style:
    return Style.from_dict({"prompt": "ansibrightgreen bold"})


def get_git_branch(cwd: str) -> str:
    try:
        r = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=cwd, capture_output=True, text=True, timeout=2,
        )
        return r.stdout.strip() or "main"
    except Exception:
        return "main"

# ── Model selection ──────────────────────────────────────────────────────────────

async def prompt_model_select(session: PromptSession, current_id: str) -> str:
    render_model_menu()
    info = MODEL_INDEX.get(current_id)
    current_display = info.display if info else current_id

    try:
        raw = await session.prompt_async(
            f"  Select [1-{len(MODELS)}] or press Enter to keep [{current_display}]: ",
            style=Style.from_dict({"prompt": "ansicyan bold"}),
        )
        raw = raw.strip()
    except (KeyboardInterrupt, EOFError):
        return current_id

    if not raw:
        return current_id

    if raw.isdigit():
        idx = int(raw)
        if 1 <= idx <= len(MODELS):
            chosen = MODELS[idx - 1]
            console.print(f"  [dim green]✓ {chosen.display} selected[/]\n")
            return chosen.id
        console.print(f"  [red]Invalid number — keeping {current_display}[/]\n")
        return current_id

    resolved = resolve_model(raw)
    if resolved in MODEL_INDEX:
        console.print(f"  [dim green]✓ {MODEL_INDEX[resolved].display} selected[/]\n")
        return resolved

    console.print(f"  [red]Unknown '{raw}' — keeping {current_display}[/]\n")
    return current_id

# ── Router interception ──────────────────────────────────────────────────────────

async def maybe_reroute(
    user_prompt: str,
    selected_id: str,
    session: PromptSession,
    stats: SessionStats,
) -> str:
    with console.status("[dim]Analyzing task complexity...[/]", spinner="dots"):
        routing = await check_router(user_prompt, selected_id)

    if not routing:
        return selected_id

    recommended_raw = routing.get("recommended_model", "").strip()
    complexity      = routing.get("complexity", "unknown")
    reason          = routing.get("reason", "")

    if not recommended_raw:
        return selected_id

    recommended      = resolve_model(recommended_raw)
    sel_info         = MODEL_INDEX.get(selected_id)
    rec_info         = MODEL_INDEX.get(recommended)
    sel_wh           = sel_info.energy_wh if sel_info else 0
    rec_wh           = rec_info.energy_wh if rec_info else sel_wh
    is_downgrade     = recommended != selected_id and rec_wh < sel_wh

    if not is_downgrade:
        tier_str = (f"[{TIER_COLOR.get(sel_info.tier, 'white')}]{sel_info.tier}[/]"
                    if sel_info else "")
        console.print(
            f"  [dim green]✓[/] [dim]{sel_info.display if sel_info else selected_id} "
            f"({tier_str}[dim]) is appropriate for this task ({complexity})[/]"
        )
        return selected_id

    stats.router_suggestions += 1

    pct         = round((1 - rec_wh / sel_wh) * 100) if sel_wh > 0 else 0
    savings_str = f"~{pct}% less energy  ({rec_wh:.2f} Wh vs {sel_wh:.2f} Wh per query)"
    sel_display = sel_info.display if sel_info else selected_id
    rec_display = rec_info.display if rec_info else recommended
    sel_tier    = (f"[{TIER_COLOR.get(sel_info.tier,'white')}]{sel_info.tier}[/]"
                   if sel_info else "")
    rec_tier    = (f"[{TIER_COLOR.get(rec_info.tier,'white')}]{rec_info.tier}[/]"
                   if rec_info else "")

    fallback     = None
    fallback_note = ""
    if fallback and fallback in MODEL_INDEX:
        fb = MODEL_INDEX[fallback]
        fallback_note = (
            f"\n  [dim]Note: {rec_display} isn't callable here — "
            f"will use [cyan]{fb.display}[/cyan] (nearest Anthropic equiv)[/dim]"
        )

    console.print()
    console.print(Panel(
        f"[bold yellow]⚠  Overkill Detected[/bold yellow]\n\n"
        f"  Complexity   : [white]{complexity}[/]\n"
        f"  Your choice  : [red]{sel_display}[/]  {sel_tier}\n"
        f"  Recommended  : [green]{rec_display}[/]  {rec_tier}\n"
        f"  Energy saved : [bright_green]{savings_str}[/]"
        + (f"\n  Reason       : [dim]{reason}[/]" if reason else "")
        + fallback_note,
        border_style="yellow",
        padding=(0, 2),
    ))

    try:
        answer = await session.prompt_async(
            f"  Switch to {rec_display} to save {pct}% carbon? [Y/n] ",
            style=Style.from_dict({"prompt": "ansiyellow bold"}),
        )
        answer = answer.strip().lower()
    except (KeyboardInterrupt, EOFError):
        answer = "n"

    if answer in ("", "y", "yes"):
        stats.router_accepted += 1
        final      = fallback if fallback else recommended
        final_info = MODEL_INDEX.get(final)
        console.print(
            f"  [green]✓ Switched to {final_info.display if final_info else final}[/]\n"
        )
        return final

    console.print(f"  [dim]Keeping {sel_display}.[/]\n")
    return selected_id

# ── Main REPL ────────────────────────────────────────────────────────────────────

async def main():
    if not ANTHROPIC_API_KEY:
        console.print("[bold red]Error:[/] ANTHROPIC_API_KEY is not set.")
        sys.exit(1)

    cwd    = str(Path.cwd())
    branch = get_git_branch(cwd)
    stats  = SessionStats()

    # Probe router
    global _active_router_url
    with console.status("[dim]Connecting to router...[/]", spinner="dots"):
        discovered = await probe_router()
    if discovered:
        _active_router_url = discovered

    # Phase 1 — Welcome
    render_welcome(cwd, branch, discovered)

    history_path = Path.home() / ".greenledger_history"
    session = PromptSession(
        history=FileHistory(str(history_path)),
        auto_suggest=AutoSuggestFromHistory(),
        style=build_style(),
        multiline=False,
    )

    # Phase 2 — Initial model selection
    model_id = await prompt_model_select(session, "claude-sonnet-4-6")
    messages: list[dict] = []

    while True:
        try:
            branch     = get_git_branch(cwd)
            info       = MODEL_INDEX.get(model_id)
            short      = info.display.split()[-1].lower() if info else model_id
            prompt_str = f"\n[{branch}|{short}] ❯ "

            user_input = await session.prompt_async(prompt_str, style=build_style())
            user_input = user_input.strip()
            if not user_input:
                continue

            # ── Commands ───────────────────────────────────────────────────
            if user_input.lower() in ("/exit", "exit", "quit", "q"):
                break

            if user_input.lower() == "clear":
                render_welcome(cwd, branch, discovered)
                messages = []
                continue

            if user_input.lower() == "/model":
                model_id = await prompt_model_select(session, model_id)
                continue

            if user_input.lower() == "/stats":
                render_exit_summary(stats)
                continue

            if user_input.lower().startswith("cd "):
                target = Path(cwd) / user_input[3:].strip()
                if target.is_dir():
                    cwd = str(target.resolve())
                    console.print(f"[dim]→ {cwd}[/]")
                else:
                    console.print(f"[red]Not found:[/] {target}")
                continue

            # ── Phase 3 — Router interception ──────────────────────────────
            console.print()
            final_model = await maybe_reroute(user_input, model_id, session, stats)

            # ── Phase 4 — Inference ────────────────────────────────────────
            # ── Phase 4 — Inference ────────────────────────────────────────
            messages.append({"role": "user", "content": user_input})
            console.print()
            t0 = time.time()

            infer_result = await call_infer(user_input, final_model)

            if infer_result:
                # /v1/infer succeeded
                console.print(Panel(
                    infer_result.get("text", ""),
                    border_style="green",
                    padding=(0, 1),
                ))
                latency_ms = infer_result.get("latency_ms", round((time.time() - t0) * 1000))
                receipt    = infer_result.get("receipt", {})
                
                # Extract tokens from the ROOT of the response
                tok_in     = infer_result.get("tokens_in", "—")
                tok_out    = infer_result.get("tokens_out", "—")
                
                messages.append({"role": "assistant", "content": infer_result.get("text", "")})
            else:
                # Direct Anthropic streaming fallback
                stream_fn = get_stream_fn(final_model)
                final_text, _ = await stream_fn(messages, cwd, final_model)
                latency_ms    = round((time.time() - t0) * 1000)
                
                # Estimate tokens for the fallback since we don't get exact API stats via stream
                tok_in = len(user_input) // 4
                tok_out = len(final_text) // 4
                
                mi  = MODEL_INDEX.get(final_model)
                ewh = mi.energy_wh if mi else 0.24
                receipt = {
                    "co2e_g":    ewh * 0.233,
                    "energy_wh": ewh,
                    "water_ml":  ewh * 1.8,
                    "levy_usd":  ewh * 0.00012,
                }
                messages.append({"role": "assistant", "content": "[response streamed above]"})
                # Push receipt to backend for Supabase persistence
                asyncio.create_task(push_receipt(
                    receipt, final_model, tok_in, tok_out, latency_ms,
                    requested_model=model_id,
                    prompt_preview=user_input[:80],
                ))

            # ── Phase 4b — Environmental receipt ───────────────────────────
            # Pass the tokens into the render function!
            render_receipt(receipt, final_model, latency_ms, tok_in, tok_out)
            stats.add_receipt(receipt)
        except KeyboardInterrupt:
            console.print("\n[dim]Use '/exit' or 'exit' to quit.[/]")
            continue
        except EOFError:
            break
        except Exception as e:
            console.print(f"[bold red]Error:[/] {e}")
            import traceback
            traceback.print_exc()

    # ── Phase 5 — Exit summary ─────────────────────────────────────────────
    render_exit_summary(stats)
    console.print("[dim green]  Thanks for computing sustainably. 🌱[/]\n")


if __name__ == "__main__":
    # 1. Manual Setup Trigger (e.g., `python main.py setup`)
    if len(sys.argv) > 1 and sys.argv[1].lower() == "setup":
        run_setup()
        sys.exit(0)
        
    # 2. Auto-Setup Trigger (If config.json doesn't exist yet)
    if not CONFIG_FILE.exists():
        run_setup()

    # 3. Load the keys into memory for the session
    local_config = load_config()
    
    # Override environment variables so your app uses the JSON keys
    if local_config.get("ANTHROPIC_API_KEY"):
        os.environ["ANTHROPIC_API_KEY"] = local_config["ANTHROPIC_API_KEY"]
        # Update the global variable if your code relies on it
        ANTHROPIC_API_KEY = local_config["ANTHROPIC_API_KEY"] 
        
    if local_config.get("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = local_config["OPENAI_API_KEY"]
        
    if local_config.get("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = local_config["GEMINI_API_KEY"]

    # 4. Start the main REPL loop
    asyncio.run(main())