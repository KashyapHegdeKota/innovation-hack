"""
Streaming renderer for GreenLedger CLI.
Buffers streamed tokens and renders markdown/code blocks in real time.
"""

import re
from rich.console import Console
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.text import Text


class Renderer:
    """
    Buffers streamed text and renders it as it arrives.
    Detects code fences and renders them with syntax highlighting.
    Renders plain text as markdown at the end.
    """

    def __init__(self, console: Console):
        self.console = console
        self._buffer = ""
        self._in_code_block = False
        self._code_lang = ""
        self._code_lines: list[str] = []
        self._pending_text = ""

    def stream_text(self, chunk: str):
        """Called with each streamed text chunk from the API."""
        self._buffer += chunk
        self._pending_text += chunk

        # Process complete lines to detect code fences
        while "\n" in self._pending_text:
            line, self._pending_text = self._pending_text.split("\n", 1)
            self._process_line(line)

    def _process_line(self, line: str):
        if line.startswith("```"):
            if not self._in_code_block:
                # Entering code block
                self._in_code_block = True
                self._code_lang = line[3:].strip() or "text"
                self._code_lines = []
            else:
                # Exiting code block — render it
                self._in_code_block = False
                code = "\n".join(self._code_lines)
                lang = self._code_lang or "text"
                self.console.print(
                    Syntax(
                        code,
                        lang,
                        theme="monokai",
                        line_numbers=len(self._code_lines) > 10,
                        background_color="default",
                        word_wrap=True,
                    )
                )
                self._code_lines = []
                self._code_lang = ""
        elif self._in_code_block:
            self._code_lines.append(line)
        else:
            # Plain text line — print immediately for streaming feel
            self._render_text_line(line)

    def _render_text_line(self, line: str):
        """Render a single line of markdown-ish text inline."""
        if not line.strip():
            self.console.print()
            return

        # Simple inline formatting
        text = Text()
        parts = re.split(r"(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)", line)
        for part in parts:
            if part.startswith("`") and part.endswith("`"):
                text.append(part[1:-1], style="bold green on default")
            elif (part.startswith("**") and part.endswith("**")) or \
                 (part.startswith("__") and part.endswith("__")):
                text.append(part[2:-2], style="bold")
            else:
                text.append(part)

        # Detect headers
        stripped = line.lstrip()
        if stripped.startswith("### "):
            self.console.print(f"[bold cyan]{stripped[4:]}[/]")
        elif stripped.startswith("## "):
            self.console.print(f"[bold white]{stripped[3:]}[/]")
        elif stripped.startswith("# "):
            self.console.print(f"[bold white underline]{stripped[2:]}[/]")
        elif stripped.startswith("- ") or stripped.startswith("* "):
            self.console.print(f"  [dim]·[/] {stripped[2:]}")
        elif re.match(r"^\d+\. ", stripped):
            self.console.print(f"  {stripped}")
        else:
            self.console.print(text)

    def flush_text(self):
        """Call after streaming ends to render any remaining buffered text."""
        if self._pending_text.strip():
            self._process_line(self._pending_text)
            self._pending_text = ""

        # If we're still in a code block when streaming ends, render it
        if self._in_code_block and self._code_lines:
            code = "\n".join(self._code_lines)
            self.console.print(
                Syntax(
                    code,
                    self._code_lang or "text",
                    theme="monokai",
                    background_color="default",
                    word_wrap=True,
                )
            )
            self._in_code_block = False
            self._code_lines = []