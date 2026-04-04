"""
GreenLedger CLI Launcher
Opens main.py in a new terminal window, outside of VS Code.

Usage:
    python launch.py
    python launch.py --cwd "C:/path/to/your/project"
"""

import sys
import os
import shutil
import platform
import argparse
import subprocess
from pathlib import Path

SCRIPT = Path(__file__).parent / "main.py"
PYTHON = sys.executable  # Reuse the same venv/interpreter


def launch(cwd: str):
    os_name = platform.system()

    if os_name == "Windows":
        _launch_windows(cwd)
    elif os_name == "Darwin":
        _launch_macos(cwd)
    else:
        _launch_linux(cwd)


def _launch_windows(cwd: str):
    """
    Try Windows Terminal (wt) first, then fall back to a plain cmd window.
    Always opens detached from the parent process.
    """
    cmd_str = f'cd /d "{cwd}" && "{PYTHON}" "{SCRIPT}"'

    # Option 1: Windows Terminal (modern, installed from MS Store)
    if shutil.which("wt"):
        subprocess.Popen(
            ["wt", "cmd.exe", "/k", cmd_str],
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        print("Launched in Windows Terminal.")
        return

    # Option 2: Plain cmd.exe — always available
    subprocess.Popen(
        ["cmd.exe", "/k", cmd_str],
        creationflags=subprocess.CREATE_NEW_CONSOLE,
    )
    print("Launched in cmd.exe.")


def _launch_macos(cwd: str):
    """Open a new Terminal.app window, or iTerm2 if installed."""
    script = str(SCRIPT)
    py = str(PYTHON)

    # iTerm2
    if Path("/Applications/iTerm.app").exists():
        apple_script = f"""
        tell application "iTerm"
            create window with default profile
            tell current session of current window
                write text "cd '{cwd}' && '{py}' '{script}'"
            end tell
        end tell
        """
    else:
        # Terminal.app
        apple_script = f"""
        tell application "Terminal"
            do script "cd '{cwd}' && '{py}' '{script}'"
            activate
        end tell
        """

    subprocess.Popen(["osascript", "-e", apple_script])
    print("Launched in Terminal.")


def _launch_linux(cwd: str):
    """Try common terminal emulators in order of preference."""
    script = str(SCRIPT)
    py = str(PYTHON)
    run_cmd = f"cd '{cwd}' && '{py}' '{script}'; exec bash"

    terminals = [
        # (binary, args_before_command)
        ("gnome-terminal", ["--"]),
        ("konsole", ["-e"]),
        ("xfce4-terminal", ["-e"]),
        ("xterm", ["-e"]),
        ("x-terminal-emulator", ["-e"]),
    ]

    for term, flags in terminals:
        if shutil.which(term):
            if term == "gnome-terminal":
                subprocess.Popen([term, "--"] + ["bash", "-c", run_cmd])
            else:
                subprocess.Popen([term] + flags + ["bash", "-c", run_cmd])
            print(f"Launched in {term}.")
            return

    print("No supported terminal found. Run directly: python main.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Launch GreenLedger CLI in a new terminal window.")
    parser.add_argument(
        "--cwd",
        default=os.getcwd(),
        help="Working directory to open the CLI in (default: current directory)",
    )
    args = parser.parse_args()

    target_cwd = str(Path(args.cwd).resolve())
    print(f"Opening GreenLedger CLI in: {target_cwd}")
    launch(target_cwd)