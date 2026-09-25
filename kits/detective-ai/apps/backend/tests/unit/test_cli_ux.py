"""Unit and integration tests for CLI Gameplay UX Improvement pass."""

from typer.testing import CliRunner

from app.db.database import init_db
from app.lamatic.evidence_knowledge import EvidenceKnowledgeBuilder
from app.scenarios.registry import ScenarioRegistry
from app.schemas.game_state import ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import InvestigationContextBuilder
from app.services.session_service import SessionService
from app.services.suspect_knowledge import SuspectKnowledgeBuilder
from cli.app import app
from cli.formatting import (
    format_investigation_status,
    format_location_tag,
    format_solve_briefing,
    render_ai_response,
)

runner = CliRunner()


def test_scenario_resolution_by_name_and_case_insensitive():
    """Verify ScenarioRegistry resolves exact ID, display name, and case-insensitive."""
    registry = ScenarioRegistry()

    # Exact ID
    assert (
        registry.resolve_scenario_id("the_midnight_archive") == "the_midnight_archive"
    )

    # Exact display name
    assert (
        registry.resolve_scenario_id("The Midnight Archive") == "the_midnight_archive"
    )

    # Case-insensitive ID
    assert (
        registry.resolve_scenario_id("THE_MIDNIGHT_ARCHIVE") == "the_midnight_archive"
    )

    # Case-insensitive display name
    assert (
        registry.resolve_scenario_id("the midnight archive") == "the_midnight_archive"
    )


def test_cli_start_with_display_name(db_session):
    """Verify CLI start command accepts scenario display names."""
    init_db()
    result = runner.invoke(app, ["start", "The Midnight Archive"])
    assert result.exit_code == 0
    assert "GAME SESSION STARTED SUCCESSFULLY" in result.output
    assert "The Midnight Archive Incident" in result.output
    assert "AVAILABLE ACTIONS" in result.output
    assert "Session ID" in result.output


def test_suspect_name_resolution():
    """Verify SuspectKnowledgeBuilder resolves suspect names case-insensitively."""
    builder = SuspectKnowledgeBuilder()

    # Exact ID
    assert (
        builder.resolve_suspect_id("the_midnight_archive", "suspect_02") == "suspect_02"
    )

    # Exact Name
    assert (
        builder.resolve_suspect_id("the_midnight_archive", "Marcus Reed")
        == "suspect_02"
    )

    # Case-insensitive Name
    assert (
        builder.resolve_suspect_id("the_midnight_archive", "marcus reed")
        == "suspect_02"
    )


def test_evidence_name_resolution():
    """Verify EvidenceKnowledgeBuilder resolves evidence names case-insensitively."""
    builder = EvidenceKnowledgeBuilder()

    # Exact ID
    assert (
        builder.resolve_evidence_id("the_midnight_archive", "evidence_02")
        == "evidence_02"
    )

    # Exact Name
    assert (
        builder.resolve_evidence_id("the_midnight_archive", "Security Access Log")
        == "evidence_02"
    )

    # Case-insensitive Name
    assert (
        builder.resolve_evidence_id("the_midnight_archive", "security access log")
        == "evidence_02"
    )


def test_game_engine_location_name_resolution(db_session):
    """Verify GameEngine resolves location name in move actions."""
    service = SessionService()
    state = service.start_game("the_midnight_archive", db=db_session)
    engine = GameEngine()

    # Move using exact name
    action = GameActionDTO(
        action_type=ActionType.MOVE, target_id="Archive Reading Room"
    )
    result = engine.execute_action(state.session_id, action, db=db_session)
    assert result.success is True
    assert result.state.current_location_id == "location_02"

    # Move using case-insensitive name
    action_ci = GameActionDTO(
        action_type=ActionType.MOVE, target_id="server control lab"
    )
    result_ci = engine.execute_action(state.session_id, action_ci, db=db_session)
    assert result_ci.success is True
    assert result_ci.state.current_location_id == "location_03"


def test_stage_advance_readiness_check(db_session):
    """Verify check_stage_advancement_ready without leaking secret criteria."""
    service = SessionService()
    state = service.start_game("the_midnight_archive", db=db_session)
    engine = GameEngine()

    # Initially in progress (stage requirements not satisfied)
    is_ready, next_stage = engine.check_stage_advancement_ready(
        state.session_id, db=db_session
    )
    assert is_ready is False
    assert next_stage is None

    # Satisfy stage 1 requirements (inspect loc_01, loc_02, examine evidence_02)
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.MOVE, target_id="location_02"),
        db=db_session,
    )
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.EXAMINE_EVIDENCE, target_id="evidence_02"),
        db=db_session,
    )

    # Now stage advancement is ready!
    is_ready, next_stage = engine.check_stage_advancement_ready(
        state.session_id, db=db_session
    )
    assert is_ready is True
    assert next_stage is not None
    assert "Stage 2" in next_stage


def test_investigation_context_location_tags_and_status(db_session):
    """Verify context and status formatting include location tags."""
    service = SessionService()
    state = service.start_game("the_midnight_archive", db=db_session)
    engine = GameEngine()

    # Discover evidence at location_01
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )

    ctx_builder = InvestigationContextBuilder(session_service=service)
    context = ctx_builder.build_context(state.session_id, db=db_session)

    # Check evidence location tag
    assert len(context.discovered_evidence) > 0
    ev = context.discovered_evidence[0]
    assert ev.get("location_name") is not None
    assert (
        format_location_tag(ev["location_name"]) == f"[LOCATION: {ev['location_name']}]"
    )

    # Check format_investigation_status
    status_str = format_investigation_status(context, show_actions=True)
    assert "INVESTIGATION STATUS" in status_str
    assert "AVAILABLE ACTIONS" in status_str
    assert "[MOVE]" in status_str
    assert "[INSPECT]" in status_str
    assert "[INTERROGATE]" in status_str
    assert "[EXAMINE]" in status_str
    assert "[ADVANCE]" in status_str
    assert "[SOLVE]" in status_str


def test_solve_briefing_and_name_resolution(monkeypatch, db_session):
    """Verify solve briefing formatting and name resolution in solve submission."""
    service = SessionService()
    state = service.start_game("the_midnight_archive", db=db_session)
    engine = GameEngine()

    # Discover evidence and interview suspect
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )
    engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="Marcus Reed"),
        db=db_session,
    )

    ctx_builder = InvestigationContextBuilder(session_service=service)
    context = ctx_builder.build_context(state.session_id, db=db_session)

    briefing = format_solve_briefing(context)
    assert "FINAL CASE RESOLUTION BRIEFING" in briefing
    assert "DISCOVERED EVIDENCE" in briefing
    assert "INTERVIEWED SUSPECTS" in briefing
    assert "VISITED LOCATIONS" in briefing
    assert "INVESTIGATION HISTORY SUMMARY" in briefing


def test_rich_ai_markdown_rendering(capsys):
    """Verify render_ai_response prints rich markdown cleanly without truncation."""
    md_content = """### Forensic Findings
- **Access Time**: `23:47:12`
- **Anomaly**: Unauthorized root credential override
> Conclusion: The device was physically tampered with.
"""
    render_ai_response(
        title="FORENSIC REPORT",
        content=md_content,
        meta={"Evidence": "Security Access Log"},
    )
    captured = capsys.readouterr()
    assert "FORENSIC REPORT" in captured.out
    assert "Forensic Findings" in captured.out
    assert "Unauthorized root credential override" in captured.out


def test_status_and_briefing_confidentiality(db_session):
    """Verify status and briefing screens strictly exclude ground truth."""
    init_db()
    service = SessionService()
    state = service.start_game("the_midnight_archive", db=db_session)

    ctx_builder = InvestigationContextBuilder(session_service=service)
    context = ctx_builder.build_context(state.session_id, db=db_session)

    status_str = format_investigation_status(context, show_actions=True)
    briefing_str = format_solve_briefing(context)

    # Assert ground truth elements are strictly absent
    for secret in [
        "is_culprit",
        "culprit_id",
        "motive",
        "solution_summary",
        "secret_timeline",
    ]:
        assert secret not in status_str
        assert secret not in briefing_str

    # In stage 1, future evidence (Security Access Log) is undiscovered
    assert "Security Access Log" not in status_str
    assert "Security Access Log" not in briefing_str

    # In stage 1, future suspects are not available/shown in actions
    assert "Marcus Reed" not in status_str

    # Verify that solve briefing does not show suspects since none are interviewed
    assert "Marcus Reed" not in briefing_str
