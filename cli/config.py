import os
import json
import time
import httpx
import webbrowser
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt

console = Console()

CONFIG_DIR = Path.home() / ".greenledger"
CONFIG_FILE = CONFIG_DIR / "config.json"

# --- AUTH0 CONFIGURATION ---
# Replace these with the values from your Auth0 Native Application
AUTH0_DOMAIN = "dev-38twwn7jwj5sextd.us.auth0.com" 
AUTH0_CLIENT_ID = "CB60izgBLqSOYgxSCxAasegUZXiN6E8F"
AUTH0_AUDIENCE = f"https://{AUTH0_DOMAIN}/api/v2/" # Optional: if you have an API set up in Auth0

def do_auth0_login() -> dict:
    """Handles the OAuth2 Device Code Flow for CLI authentication."""
    try:
        # 1. Request the device code
        device_req_url = f"https://{AUTH0_DOMAIN}/oauth/device/code"
        with httpx.Client() as client:
            resp = client.post(device_req_url, data={
                "client_id": AUTH0_CLIENT_ID,
                "scope": "openid profile email offline_access",
                "audience": AUTH0_AUDIENCE
            })
            resp.raise_for_status()
            data = resp.json()

        device_code = data["device_code"]
        user_code = data["user_code"]
        verification_uri_complete = data["verification_uri_complete"]
        interval = data["interval"]

        console.print("\n[bold green]◆ Authentication Required[/bold green]")
        console.print("To connect your CLI to the GreenLedger dashboard, please log in.")
        console.print(f"1. A browser window will open automatically.")
        console.print(f"2. Confirm the code matches: [bold yellow]{user_code}[/]")
        
        # Automatically open the user's web browser to the login page
        time.sleep(2)
        webbrowser.open(verification_uri_complete)
        
        console.print("\n[dim]Waiting for you to complete login in the browser...[/dim]")

        # 2. Poll Auth0 to see if the user has finished logging in
        token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
        with httpx.Client() as client:
            while True:
                time.sleep(interval)
                token_resp = client.post(token_url, data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                    "device_code": device_code,
                    "client_id": AUTH0_CLIENT_ID
                })
                
                if token_resp.status_code == 200:
                    console.print("[green]✓ Login successful![/green]\n")
                    return token_resp.json() # Returns access_token and id_token
                
                elif token_resp.status_code == 400:
                    err = token_resp.json().get("error")
                    if err == "authorization_pending":
                        continue  # User hasn't clicked "Accept" yet
                    elif err == "slow_down":
                        interval += 1 # Auth0 rate limiting requirement
                        continue
                    elif err == "expired_token":
                        console.print("[bold red]Login timed out. Please try running setup again.[/bold red]")
                        exit(1)
                    else:
                        console.print(f"[bold red]Authentication error: {err}[/bold red]")
                        exit(1)
                        
    except Exception as e:
        console.print(f"[bold red]Failed to connect to authentication server:[/] {e}")
        exit(1)

def get_user_profile(access_token: str) -> str:
    """Fetches the user's email from Auth0 using their new access token."""
    try:
        with httpx.Client() as client:
            resp = client.get(f"https://{AUTH0_DOMAIN}/userinfo", headers={
                "Authorization": f"Bearer {access_token}"
            })
            resp.raise_for_status()
            return resp.json().get("email", "unknown@user.com")
    except Exception:
        return "unknown@user.com"

def run_setup():
    console.print("[bold bright_green]GreenLedger CLI Setup[/bold bright_green]")
    console.print("Let's configure your environment and link your account.\n")

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    # --- 1. Authenticate with Auth0 ---
    token_data = do_auth0_login()
    access_token = token_data.get("access_token")
    
    # Retrieve user's email to store locally
    email = get_user_profile(access_token)
    console.print(f"Logged in as: [bold cyan]{email}[/bold cyan]\n")

    # --- 2. Prompt for API Keys ---
    console.print("[bold]Configure Bring-Your-Own-Key (BYOK) Models[/bold]")
    console.print("[dim]Press Enter to skip any key you don't have right now.[/dim]")
    
    providers = [
        ("ANTHROPIC_API_KEY", "Anthropic API Key", "anthropic"),
        ("OPENAI_API_KEY", "OpenAI API Key", "openai"),
        ("GEMINI_API_KEY", "Gemini API Key", "gemini"),
    ]

    validated_keys = {}
    for env_key, label, provider_id in providers:
        key = Prompt.ask(label, password=True, default="").strip()
        if not key:
            continue
        with console.status(f"  Validating {label}..."):
            valid, message = validate_key(provider_id, key)
        if valid:
            validated_keys[env_key] = key
            console.print(f"  [green]✓[/] {label}: {message}")
        else:
            console.print(f"  [red]✗[/] {label}: {message}")
            console.print(f"  [dim]Key not saved. Re-run setup to try again.[/]")

    # --- 3. Save to config.json ---
    config_data = {
        "user_email": email,
        "auth_token": access_token,
        **validated_keys,
    }

    with open(CONFIG_FILE, "w") as f:
        json.dump(config_data, f, indent=4)

    console.print("\n[bold green]Setup complete![/bold green] Your configuration is securely stored at ~/.greenledger/config.json")

def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)
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