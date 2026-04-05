import sys
import json
from pathlib import Path

import httpx
from rich.console import Console
from rich.prompt import Prompt
from rich.panel import Panel

console = Console()

CONFIG_DIR = Path.home() / ".greenledger"
CONFIG_FILE = CONFIG_DIR / "config.json"


def validate_key(provider: str, key: str) -> tuple[bool, str]:
    """Ping provider API to verify key. Returns (valid, message)."""
    try:
        with httpx.Client(timeout=5.0) as client:
            if provider == "anthropic":
                resp = client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-haiku-4-5-20251001",
                        "max_tokens": 1,
                        "messages": [{"role": "user", "content": "hi"}],
                    },
                )
                if resp.status_code == 401:
                    return False, "Invalid API key"
                if resp.status_code == 403:
                    return False, "Key lacks permission"
                return True, "Key verified"

            elif provider == "openai":
                resp = client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"},
                )
                if resp.status_code == 401:
                    return False, "Invalid API key"
                return True, "Key verified"

            elif provider == "gemini":
                resp = client.get(
                    "https://generativelanguage.googleapis.com/v1beta/models",
                    params={"key": key},
                )
                if resp.status_code == 400 or resp.status_code == 403:
                    return False, "Invalid API key"
                return True, "Key verified"

            else:
                return True, "Unknown provider — skipped validation"

    except httpx.TimeoutException:
        return True, "Validation timed out — saved anyway"
    except httpx.ConnectError:
        return True, "Could not connect — saved anyway (check your network)"
    except Exception as e:
        return True, f"Validation skipped: {e}"


def run_setup():
    """Interactive setup to generate the config.json file."""
    console.clear()
    console.print(Panel(
        "[bold green]🌱 GreenLedger Setup[/]\nLet's configure your local environment.",
        border_style="green",
    ))

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing config if it's already there
    config = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
        except json.JSONDecodeError:
            pass

    providers = [
        ("ANTHROPIC_API_KEY", "Anthropic", "anthropic"),
        ("OPENAI_API_KEY", "OpenAI", "openai"),
        ("GEMINI_API_KEY", "Gemini", "gemini"),
    ]

    for env_key, display_name, provider_id in providers:
        existing = config.get(env_key, "")
        key = Prompt.ask(
            f"Enter your [cyan]{display_name} API Key[/] (press Enter to skip)",
            default=existing,
        )

        if not key:
            continue

        # Skip validation if key is unchanged from existing config
        if key == existing:
            console.print(f"  [dim]Unchanged — keeping existing {display_name} key[/]")
            continue

        with console.status(f"  Validating {display_name} key..."):
            valid, message = validate_key(provider_id, key)

        if valid:
            config[env_key] = key
            console.print(f"  [green]✓[/] {display_name}: {message}")
        else:
            console.print(f"  [red]✗[/] {display_name}: {message}")
            console.print(f"  [dim]Key not saved. Re-run setup to try again.[/]")

    # Save to JSON
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

    console.print(f"\n[bold bright_green]✓ Configuration saved to {CONFIG_FILE}[/]")

    # Summary
    saved = [d for e, d, _ in providers if config.get(e)]
    if saved:
        console.print(f"  [dim]Active providers: {', '.join(saved)}[/]")
    else:
        console.print("  [yellow]No API keys configured. Run setup again to add keys.[/]")

    console.print("[dim]Starting CLI...[/]\n")


def load_config() -> dict:
    """Read the config.json file."""
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)
