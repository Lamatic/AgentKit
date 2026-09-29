"""Unit and integration tests for Milestone 4 - CLI Investigation Interface."""

from typer.testing import CliRunner

from app.db.database import SessionLocal, init_db
from app.schemas.game_state import SessionStatus
from app.services.session_service import SessionService
from cli.app import app
from cli.commands import play_cmd

runner = CliRunner()


def test_cli_scenarios_command():
    """Verify cli scenarios command lists available scenarios."""
    result = runner.invoke(app, ["scenarios"])
    assert result.exit_code == 0
    assert "Available Scenarios" in result.output
    assert "test_case" in result.output


def test_cli_start_command():
    """Verify cli start command initializes a game session."""
    init_db()
    result = runner.invoke(app, ["start", "test_case"])
    assert result.exit_code == 0
    assert (
        "GAME SESSION STARTED SUCCESSFULLY" in result.output
        or "Game Session Started Successfully" in result.output
    )
    assert "Session ID" in result.output
    assert "test_case" in result.output


def _create_test_session_id() -> str:
    """Helper to start a session via CLI runner and extract session ID."""
    result = runner.invoke(app, ["start", "test_case"])
    assert result.exit_code == 0
    # Extract session ID from output line "Session ID : <id>"
    for line in result.output.splitlines():
        if "Session ID" in line:
            return line.split(":", 1)[1].strip()
    raise RuntimeError("Could not find Session ID in start output")


def test_cli_state_command():
    """Verify cli state command displays player-facing state for a valid session."""
    sid = _create_test_session_id()

    result = runner.invoke(app, ["state", sid])
    assert result.exit_code == 0
    assert (
        "INVESTIGATION STATUS" in result.output
        or "INVESTIGATION GAME STATE" in result.output
    )
    assert "IN PROGRESS" in result.output or "IN_PROGRESS" in result.output


def test_cli_state_nonexistent_session():
    """Verify cli state command handles non-existent session with friendly error."""
    result = runner.invoke(app, ["state", "non_existent_session_id_999"])
    assert result.exit_code == 1
    assert "[Error]" in result.output
    assert "non_existent_session_id_999" in result.output


def test_cli_action_commands():
    """Verify cli action command delegates actions correctly."""
    sid = _create_test_session_id()

    # 1. Inspect
    r_inspect = runner.invoke(app, ["action", sid, "inspect"])
    assert r_inspect.exit_code == 0
    assert "INSPECT" in r_inspect.output
    assert "evidence_01" in r_inspect.output

    # 2. Examine evidence
    r_examine = runner.invoke(app, ["action", sid, "examine", "evidence_01"])
    assert r_examine.exit_code == 0
    assert "EXAMINE_EVIDENCE" in r_examine.output
    assert "Vial of Poison" in r_examine.output

    # 3. Advance stage
    r_advance = runner.invoke(app, ["action", sid, "advance"])
    assert r_advance.exit_code == 0
    assert "ADVANCE_STAGE" in r_advance.output

    # 4. Interview suspect
    r_interview = runner.invoke(app, ["action", sid, "interview", "suspect_01"])
    assert r_interview.exit_code == 0
    assert "INTERVIEW" in r_interview.output
    assert "Alice Smith" in r_interview.output

    # 5. Solve case
    r_solve = runner.invoke(app, ["action", sid, "solve", "suspect_01"])
    assert r_solve.exit_code == 0
    assert "SUBMIT_SOLUTION" in r_solve.output
    assert "CORRECT" in r_solve.output


def test_cli_history_command():
    """Verify cli history command displays audit log events."""
    sid = _create_test_session_id()

    runner.invoke(app, ["action", sid, "inspect"])
    result = runner.invoke(app, ["history", sid])

    assert result.exit_code == 0
    assert "INVESTIGATION AUDIT HISTORY" in result.output
    assert "START_GAME" in result.output
    assert "INSPECT" in result.output


def test_cli_interactive_play():
    """Test interactive play_cmd REPL with simulated sequence of inputs."""
    sid = _create_test_session_id()

    # Simulated line inputs for REPL
    simulated_inputs = iter(
        [
            "help",
            "inspect",
            "examine evidence_01",
            "advance",
            "interview suspect_01",
            "interview suspect_02",
            "solve suspect_01",
            "Financial gain",
            "Poisoned tea",
            "evidence_01",
            "Matches vial residue",
            "",
            "y",
            "state",
            "history",
            "quit",
        ]
    )

    def mock_input(prompt: str) -> str:
        return next(simulated_inputs)

    # Execute interactive play mode with mocked input generator
    play_cmd(sid, input_fn=mock_input)

    # Verify session state became SOLVED
    db = SessionLocal()
    try:
        service = SessionService()
        final_session = service.get_session(sid, db=db)
        assert final_session.status == SessionStatus.SOLVED.value
    finally:
        db.close()


def test_cli_ground_truth_confidentiality():
    """Verify CLI output does not expose ground truth solutions or secret flags."""
    result = runner.invoke(app, ["start", "test_case"])
    output = result.output

    assert "is_culprit" not in output
    assert "motive" not in output
    assert "culprit_id" not in output
    assert "Alice Smith poisoned John Doe" not in output
