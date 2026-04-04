"""
Tool execution engine for GreenLedger CLI.
Handles read_file, write_file, edit_file, bash, list_files, grep_search.
"""

import asyncio
import os
import re
import subprocess
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.text import Text
from rich import box


class ToolExecutor:
    def __init__(self, cwd: str, console: Console):
        self.cwd = cwd
        self.console = console

    def _resolve(self, path: str) -> Path:
        p = Path(path)
        if not p.is_absolute():
            p = Path(self.cwd) / p
        return p.resolve()

    def _print_tool_header(self, name: str, detail: str):
        self.console.print(
            f"  [bold yellow]⟩ {name}[/] [dim]{detail}[/]"
        )

    def _print_tool_result(self, result: str, success: bool = True):
        color = "green" if success else "red"
        icon = "✓" if success else "✗"
        # Show up to 6 lines of output inline
        lines = result.strip().splitlines()
        preview = "\n".join(lines[:6])
        if len(lines) > 6:
            preview += f"\n[dim]... ({len(lines) - 6} more lines)[/]"
        self.console.print(f"  [{color}]{icon}[/] [dim]{preview}[/]")

    async def execute(self, tool_name: str, tool_input: dict) -> str:
        handler = getattr(self, f"_tool_{tool_name}", None)
        if handler is None:
            return f"Error: unknown tool '{tool_name}'"
        try:
            return await handler(tool_input)
        except Exception as e:
            self._print_tool_result(str(e), success=False)
            return f"Error: {e}"

    # ──────────────────────────────────────────────
    # read_file
    # ──────────────────────────────────────────────
    async def _tool_read_file(self, inp: dict) -> str:
        path = inp["path"]
        self._print_tool_header("read_file", path)
        resolved = self._resolve(path)
        if not resolved.exists():
            self._print_tool_result(f"File not found: {path}", success=False)
            return f"Error: file not found: {path}"
        content = resolved.read_text(errors="replace")
        lines = content.splitlines()
        self._print_tool_result(f"{len(lines)} lines read from {path}")
        return content

    # ──────────────────────────────────────────────
    # write_file
    # ──────────────────────────────────────────────
    async def _tool_write_file(self, inp: dict) -> str:
        path = inp["path"]
        content = inp["content"]
        self._print_tool_header("write_file", path)
        resolved = self._resolve(path)
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.write_text(content)
        lines = content.splitlines()
        self._print_tool_result(f"Wrote {len(lines)} lines to {path}")
        return f"Successfully wrote {len(lines)} lines to {path}"

    # ──────────────────────────────────────────────
    # edit_file
    # ──────────────────────────────────────────────
    async def _tool_edit_file(self, inp: dict) -> str:
        path = inp["path"]
        old_str = inp["old_str"]
        new_str = inp["new_str"]
        self._print_tool_header("edit_file", path)
        resolved = self._resolve(path)
        if not resolved.exists():
            self._print_tool_result(f"File not found: {path}", success=False)
            return f"Error: file not found: {path}"

        original = resolved.read_text(errors="replace")
        count = original.count(old_str)
        if count == 0:
            self._print_tool_result("old_str not found in file — no changes made", success=False)
            return "Error: old_str not found in file. No changes made."
        if count > 1:
            self._print_tool_result(
                f"old_str found {count} times — must be unique. No changes made.", success=False
            )
            return f"Error: old_str matches {count} locations. Make it more specific."

        updated = original.replace(old_str, new_str, 1)
        resolved.write_text(updated)

        old_lines = old_str.count("\n") + 1
        new_lines = new_str.count("\n") + 1
        diff_summary = f"−{old_lines} line{'s' if old_lines != 1 else ''} / +{new_lines} line{'s' if new_lines != 1 else ''}"
        self._print_tool_result(f"Edit applied to {path} ({diff_summary})")
        return f"Successfully edited {path}. {diff_summary}"

    # ──────────────────────────────────────────────
    # bash
    # ──────────────────────────────────────────────
    async def _tool_bash(self, inp: dict) -> str:
        command = inp["command"]
        timeout = inp.get("timeout", 30)
        self._print_tool_header("bash", command)

        try:
            result = await asyncio.wait_for(
                asyncio.create_subprocess_shell(
                    command,
                    cwd=self.cwd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={**os.environ, "TERM": "dumb"},
                ),
                timeout=timeout
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=timeout)
            stdout_str = stdout.decode(errors="replace")
            stderr_str = stderr.decode(errors="replace")
            exit_code = result.returncode

            combined = ""
            if stdout_str:
                combined += stdout_str
            if stderr_str:
                combined += f"\nSTDERR:\n{stderr_str}"

            success = exit_code == 0
            summary = f"exit {exit_code}"
            if stdout_str:
                lines = stdout_str.strip().splitlines()
                summary += f" · {len(lines)} line{'s' if len(lines) != 1 else ''} stdout"
            self._print_tool_result(summary, success=success)

            if not combined.strip():
                return f"Command completed with exit code {exit_code} (no output)"
            return combined.strip()

        except asyncio.TimeoutError:
            self._print_tool_result(f"Command timed out after {timeout}s", success=False)
            return f"Error: command timed out after {timeout} seconds"

    # ──────────────────────────────────────────────
    # list_files
    # ──────────────────────────────────────────────
    async def _tool_list_files(self, inp: dict) -> str:
        path = inp.get("path", ".")
        recursive = inp.get("recursive", False)
        self._print_tool_header("list_files", f"{path} (recursive={recursive})")
        resolved = self._resolve(path)

        if not resolved.exists():
            self._print_tool_result(f"Path not found: {path}", success=False)
            return f"Error: path not found: {path}"

        if recursive:
            entries = sorted(resolved.rglob("*"))
        else:
            entries = sorted(resolved.iterdir())

        # Filter out common noise
        ignore = {".git", "__pycache__", "node_modules", ".DS_Store", ".mypy_cache", ".pytest_cache"}
        entries = [e for e in entries if not any(part in ignore for part in e.parts)]

        lines = []
        for e in entries:
            rel = e.relative_to(resolved)
            if e.is_dir():
                lines.append(f"{rel}/")
            else:
                size = e.stat().st_size
                lines.append(f"{rel}  ({_human_size(size)})")

        self._print_tool_result(f"{len(lines)} entries in {path}")
        return "\n".join(lines) if lines else "(empty directory)"

    # ──────────────────────────────────────────────
    # grep_search
    # ──────────────────────────────────────────────
    async def _tool_grep_search(self, inp: dict) -> str:
        pattern = inp["pattern"]
        path = inp.get("path", ".")
        file_glob = inp.get("file_glob", "*")
        self._print_tool_header("grep_search", f'"{pattern}" in {path}/{file_glob}')
        resolved = self._resolve(path)

        try:
            cmd = ["grep", "-rn", "--include", file_glob, pattern, str(resolved)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            output = result.stdout.strip()
            if not output:
                self._print_tool_result("No matches found")
                return "No matches found."
            lines = output.splitlines()
            self._print_tool_result(f"{len(lines)} match{'es' if len(lines) != 1 else ''}")
            return output
        except subprocess.TimeoutExpired:
            self._print_tool_result("Search timed out", success=False)
            return "Error: search timed out"
        except FileNotFoundError:
            # grep not available, fallback to Python
            return self._python_grep(pattern, resolved, file_glob)

    def _python_grep(self, pattern: str, root: Path, glob: str) -> str:
        try:
            rx = re.compile(pattern)
        except re.error as e:
            return f"Error: invalid regex: {e}"
        matches = []
        for f in root.rglob(glob):
            if not f.is_file():
                continue
            try:
                for i, line in enumerate(f.read_text(errors="replace").splitlines(), 1):
                    if rx.search(line):
                        matches.append(f"{f}:{i}:{line}")
            except Exception:
                pass
        if not matches:
            return "No matches found."
        return "\n".join(matches)


def _human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n}{unit}"
        n //= 1024
    return f"{n}TB"