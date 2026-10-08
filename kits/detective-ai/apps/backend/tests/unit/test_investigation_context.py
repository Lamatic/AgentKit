"""Unit tests for InvestigationContext and InvestigationContextBuilder."""

import pytest

from app.core.exceptions import SessionNotFoundError
from app.db.database import init_db
from app.schemas.game_state import ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import (
    InvestigationContext,
    InvestigationContextBuilder,
)
from app.services.session_service import SessionService


def test_build_investigation_context(db_session):
    """Verify InvestigationContextBuilder constructs complete player-safe context."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()
    builder = InvestigationContextBuilder(session_service=session_service)

    # 1. Start game session
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # 2. Perform actions to discover evidence and interview suspect
    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="suspect_01"),
        db=db_session,
    )

    # 3. Build InvestigationContext
    ctx = builder.build_context(sid, db=db_session)

    assert isinstance(ctx, InvestigationContext)
    assert ctx.session_id == sid
    assert ctx.scenario_id == "test_case"
    assert ctx.case_id == "case_test_01"
    assert ctx.case_title == "The Test Case"
    assert ctx.current_stage_id == "stage_01"
    assert ctx.current_stage_order == 1
    assert ctx.current_location_id == "location_01"
    assert len(ctx.available_locations) >= 1
    assert "location_01" in ctx.visited_locations
    assert len(ctx.discovered_evidence) == 1
    assert ctx.discovered_evidence[0]["id"] == "evidence_01"
    assert len(ctx.interviewed_suspects) == 1
    assert ctx.interviewed_suspects[0]["id"] == "suspect_01"
    assert len(ctx.public_suspects) == 2
    assert ctx.score == 20
    assert ctx.session_status == "in_progress"
    assert len(ctx.investigation_history) == 3  # START_GAME + INSPECT + INTERVIEW


def test_investigation_context_confidentiality_isolation(db_session):
    """Verify InvestigationContext strictly excludes ground truth and hidden data."""
    init_db()
    session_service = SessionService()
    builder = InvestigationContextBuilder(session_service=session_service)
    state = session_service.start_game("test_case", db=db_session)

    ctx = builder.build_context(state.session_id, db=db_session)
    dumped = ctx.model_dump()
    dumped_str = str(dumped)

    # Assert ground truth solution fields are strictly absent
    assert "culprit_id" not in dumped_str
    assert "is_culprit" not in dumped_str
    assert "motive" not in dumped_str
    assert "solution_summary" not in dumped_str
    assert "secret_timeline" not in dumped_str
    assert "Alice Smith poisoned John Doe" not in dumped_str

    # Verify public suspects list excludes culprit flag and motive
    for suspect in ctx.public_suspects:
        assert "is_culprit" not in suspect
        assert "motive" not in suspect

    for suspect in ctx.interviewed_suspects:
        assert "is_culprit" not in suspect
        assert "motive" not in suspect


def test_investigation_context_invalid_session_raises_not_found(db_session):
    """Verify building context for nonexistent session raises SessionNotFoundError."""
    init_db()
    builder = InvestigationContextBuilder()

    with pytest.raises(SessionNotFoundError):
        builder.build_context("unknown_session_id_999", db=db_session)
