"""Unit tests for InvestigationTools application interface."""

import pytest

from app.core.exceptions import (
    EvidenceNotDiscoveredError,
    SessionAlreadyCompletedError,
    StageRequirementsNotMetError,
)
from app.db.database import init_db
from app.schemas.game_state import ActionResultDTO, ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import (
    InvestigationContext,
)
from app.services.investigation_tools import InvestigationTools
from app.services.session_service import SessionService


def test_investigation_tools_read_methods(db_session):
    """Verify read tools return expected player-visible information."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()
    tools = InvestigationTools()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # 1. get_investigation_state
    ctx = tools.get_investigation_state(sid, db=db_session)
    assert isinstance(ctx, InvestigationContext)
    assert ctx.session_id == sid

    # 2. get_visible_locations
    locs = tools.get_visible_locations(sid, db=db_session)
    assert isinstance(locs, list)
    assert len(locs) >= 1

    # 3. get_visible_suspects
    suspects = tools.get_visible_suspects(sid, db=db_session)
    assert len(suspects) == 2
    assert "is_culprit" not in suspects[0]

    # 4. get_visible_evidence (initially empty)
    evidence_before = tools.get_visible_evidence(sid, db=db_session)
    assert evidence_before == []

    # Perform inspect action
    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )

    evidence_after = tools.get_visible_evidence(sid, db=db_session)
    assert len(evidence_after) == 1
    assert evidence_after[0]["id"] == "evidence_01"

    # 5. get_investigation_history
    history = tools.get_investigation_history(sid, db=db_session)
    assert len(history) == 2  # START_GAME + INSPECT


def test_investigation_tools_action_delegation(db_session):
    """Verify action tools delegate execution directly to GameEngine."""
    init_db()
    session_service = SessionService()
    tools = InvestigationTools()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # 1. move_to_location
    res_move = tools.move_to_location(sid, "location_01", db=db_session)
    assert isinstance(res_move, ActionResultDTO)
    assert res_move.success is True

    # 2. inspect_location
    res_inspect = tools.inspect_location(sid, db=db_session)
    assert res_inspect.success is True
    assert "evidence_01" in res_inspect.newly_discovered_evidence

    # 3. examine_evidence
    res_examine = tools.examine_evidence(sid, "evidence_01", db=db_session)
    assert res_examine.success is True
    assert res_examine.evidence_detail["name"] == "Vial of Poison"

    # 4. advance_stage (stage 1 requirement met after discovering evidence_01)
    res_advance = tools.advance_stage(sid, db=db_session)
    assert res_advance.success is True
    assert res_advance.state.current_stage_id == "stage_02"

    # 5. interview_suspect
    res_interview = tools.interview_suspect(sid, "suspect_01", db=db_session)
    assert res_interview.success is True
    assert res_interview.interview_result["name"] == "Alice Smith"


def test_investigation_tools_enforce_game_engine_rules(db_session):
    """Verify tools pass through GameEngine validation exceptions."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()
    tools = InvestigationTools()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # 1. Undiscovered evidence examination raises EvidenceNotDiscoveredError
    with pytest.raises(EvidenceNotDiscoveredError):
        tools.examine_evidence(sid, "evidence_01", db=db_session)

    # 2. Premature stage advancement raises StageRequirementsNotMetError
    with pytest.raises(StageRequirementsNotMetError):
        tools.advance_stage(sid, db=db_session)

    # Solve session directly via engine
    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"),
        db=db_session,
    )

    # 3. Actions on completed session raise SessionAlreadyCompletedError
    with pytest.raises(SessionAlreadyCompletedError):
        tools.inspect_location(sid, db=db_session)
