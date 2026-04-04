import sys
import json
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt
from rich.panel import Panel

console = Console()

CONFIG_DIR = Path.home() / ".greenledger"
CONFIG_FILE = CONFIG_DIR / "config.json"

def run_setup():
    """Interactive setup to generate the config.json file."""
    console.clear()
    console.print(Panel("[bold green]🌱 GreenLedger Setup[/]\nLet's configure your local environment.", border_style="green"))
    
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load existing config if it's already there
    config = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
        except json.JSONDecodeError:
            pass

    # Ask for keys (hides the input for security using password=True if you want, but standard is fine for local dev)
    anthropic = Prompt.ask("Enter your [cyan]Anthropic API Key[/] (press Enter to skip)", default=config.get("ANTHROPIC_API_KEY", ""))
    openai = Prompt.ask("Enter your [cyan]OpenAI API Key[/] (press Enter to skip)", default=config.get("OPENAI_API_KEY", ""))
    gemini = Prompt.ask("Enter your [cyan]Gemini API Key[/] (press Enter to skip)", default=config.get("GEMINI_API_KEY", ""))

    if anthropic: config["ANTHROPIC_API_KEY"] = anthropic
    if openai: config["OPENAI_API_KEY"] = openai
    if gemini: config["GEMINI_API_KEY"] = gemini

    # Save to JSON
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)
        
    console.print(f"\n[bold bright_green]✓ Configuration saved to {CONFIG_FILE}[/]")
    console.print("[dim]Starting CLI...[/]\n")

def load_config() -> dict:
    """Read the config.json file."""
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)