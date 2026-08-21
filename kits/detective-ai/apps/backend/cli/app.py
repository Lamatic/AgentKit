import os
from typing import Annotated

import typer

from app.core.logging import configure_logging
from cli.commands import (
    action_cmd,
    ask_cmd,
    examine_cmd,
    history_cmd,
    interrogate_cmd,
    play_cmd,
    scenarios_cmd,
    solve_cmd,
    start_cmd,
    state_cmd,
)

# Configure logging with console=False by default for clean CLI gameplay output.
# Logs are preserved in logs/detective_ai.log.
configure_logging(console=False)

app = typer.Typer(
    name="detective",
    help="DetectiveAI - Deterministic Interactive Investigation CLI",
    add_completion=False,
)


@app.callback()
def main(
    verbose: Annotated[
        bool,
        typer.Option(
            "--verbose",
            "-v",
            help="Enable verbose internal application logging to console",
        ),
    ] = False,
) -> None:
    """DetectiveAI CLI - AI-Powered Interactive Investigation Engine."""
    if verbose or os.getenv("CLI_VERBOSE", "").lower() in ("1", "true"):
        configure_logging(console=True)


@app.command("scenarios")
def list_scenarios() -> None:
    """Discover and list all available investigation scenarios."""
    scenarios_cmd()


@app.command("start")
def start_game(
    scenario_id: Annotated[
        str,
        typer.Argument(
            help="Scenario ID or name (e.g. test_case, 'The Midnight Archive')"
        ),
    ],
) -> None:
    """Start a new game session for a scenario by ID or name."""
    start_cmd(scenario_id)


@app.command("state")
def view_state(
    session_id: Annotated[str, typer.Argument(help="Session ID of the investigation")],
) -> None:
    """View current player-facing game state for an active session."""
    state_cmd(session_id)


@app.command("action")
def execute_action(
    session_id: Annotated[str, typer.Argument(help="Session ID of the investigation")],
    action: Annotated[
        str,
        typer.Argument(
            help="Action to execute (move, inspect, interview, examine, advance, solve)"
        ),
    ],
    target_id: Annotated[
        str | None,
        typer.Argument(
            help="Optional target entity ID (location ID, suspect ID, evidence ID)"
        ),
    ] = None,
) -> None:
    """Execute a single investigation action on a game session."""
    action_cmd(session_id, action, target_id)


@app.command("history")
def view_history(
    session_id: Annotated[str, typer.Argument(help="Session ID of the investigation")],
) -> None:
    """View chronological audit history of game events for a session."""
    history_cmd(session_id)


@app.command("play")
def play_interactive(
    session_id: Annotated[str, typer.Argument(help="Session ID of the investigation")],
) -> None:
    """Enter interactive investigation shell mode."""
    play_cmd(session_id)


@app.command("ask")
def ask_agent(
    message: Annotated[
        str, typer.Argument(help="Message or question to send to the Lamatic agent")
    ],
    session_id: Annotated[
        str | None,
        typer.Option(
            "--session-id",
            "-s",
            help="Optional active session ID for investigation context",
        ),
    ] = None,
) -> None:
    """Send a question or message to the Lamatic agent with optional session context."""
    ask_cmd(message, session_id=session_id)


@app.command("interrogate")
def interrogate_suspect(
    session_id: Annotated[
        str, typer.Argument(help="Session ID of the active investigation")
    ],
    suspect_id: Annotated[str, typer.Argument(help="ID of the suspect to interrogate")],
) -> None:
    """Start interactive AI interrogation subshell with a suspect."""
    interrogate_cmd(session_id, suspect_id)


@app.command("examine")
def examine_evidence_ai(
    session_id: Annotated[
        str, typer.Argument(help="Session ID of the active investigation")
    ],
    evidence_id: Annotated[
        str, typer.Argument(help="ID of the evidence item to examine")
    ],
) -> None:
    """Perform GameEngine examination and AI forensic analysis on an evidence item."""
    examine_cmd(session_id, evidence_id)


@app.command("solve")
def solve_case(
    session_id: Annotated[
        str, typer.Argument(help="Session ID of the active investigation")
    ],
) -> None:
    """Submit final case solution theory and receive evaluation."""
    solve_cmd(session_id)


if __name__ == "__main__":
    app()
