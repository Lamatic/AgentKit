"""Unit and integration tests for Milestone 3 - Game Engine and Session Lifecycle."""

from pathlib import Path

import pytest
from sqlalchemy import select

from app.core.exceptions import (
    EvidenceNotDiscoveredError,
    InvalidLocationError,
    InvalidSolutionError,
    LocationLockedError,
    SessionAlreadyCompletedError,
    SessionNotFoundError,
    StageRequirementsNotMetError,
    SuspectNotAvailableError,
)
from app.models.game_event import GameEvent
from app.models.game_session import GameSession
from app.scenarios.loader import ScenarioLoader
from app.schemas.game_state import (
    ActionType,
    GameActionDTO,
    SessionStatus,
)
from app.services.game_engine import GameEngine
from app.services.session_service import SessionService


@pytest.fixture
def engine_service() -> tuple[GameEngine, SessionService]:
    """Provide initialized GameEngine and SessionService instances."""
    loader = ScenarioLoader(base_dir="scenarios")
    session_service = SessionService(loader=loader)
    engine = GameEngine(loader=loader, session_service=session_service)
    return engine, session_service


def test_start_game_session(db_session, engine_service):
    """Verify session creation lifecycle and initial state representation."""
    _, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    assert state.session_id is not None
    assert state.scenario_id == "test_case"
    assert state.case_id == "case_test_01"
    assert state.status == SessionStatus.IN_PROGRESS
    assert state.current_stage_id == "stage_01"
    assert state.current_stage_order == 1
    assert state.current_location_id == "location_01"
    assert state.discovered_evidence_ids == []
    assert state.interviewed_suspect_ids == []
    assert state.visited_location_ids == ["location_01"]
    assert state.completed_stage_ids == []
    assert state.score == 0

    # Verify DB persistence
    db_obj = db_session.scalar(
        select(GameSession).where(GameSession.id == state.session_id)
    )
    assert db_obj is not None
    assert db_obj.status == "in_progress"


def test_get_nonexistent_session_raises_not_found(db_session, engine_service):
    """Verify requesting an unknown session ID raises SessionNotFoundError."""
    _, session_service = engine_service
    with pytest.raises(SessionNotFoundError):
        session_service.get_session("non_existent_session_99", db=db_session)


def test_move_action(db_session, engine_service):
    """Verify valid location movement, invalid location, and visited tracking."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    # Valid movement to current location (re-entering)
    action = GameActionDTO(action_type=ActionType.MOVE, target_id="location_01")
    result = game_engine.execute_action(state.session_id, action, db=db_session)
    assert result.success is True
    assert result.state.current_location_id == "location_01"
    assert result.state.visited_location_ids == ["location_01"]

    # Movement to invalid location
    invalid_action = GameActionDTO(
        action_type=ActionType.MOVE, target_id="unknown_location_99"
    )
    with pytest.raises(InvalidLocationError):
        game_engine.execute_action(state.session_id, invalid_action, db=db_session)


def test_move_action_locked_location(db_session, engine_service, tmp_path: Path):
    """Verify attempting to move to a locked location raises LocationLockedError."""
    # Create temporary scenario with a locked location
    scenario_dir = tmp_path / "locked_case"
    scenario_dir.mkdir()
    full_data = {
        "scenario_id": "locked_case",
        "name": "Locked Case",
        "description": "Desc",
        "version": "1.0.0",
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True}
        ],
        "locations": [
            {
                "id": "loc1",
                "name": "L1",
                "description": "D",
                "is_initial_unlocked": True,
            },
            {
                "id": "loc2",
                "name": "L2",
                "description": "D",
                "is_initial_unlocked": False,
            },
        ],
        "evidence": [],
        "timeline": [],
        "solution": {"culprit_id": "s1", "solution_summary": "S"},
        "stages": [{"id": "st1", "name": "St1", "description": "D", "order": 1}],
    }
    import json

    (scenario_dir / "scenario.json").write_text(json.dumps(full_data), encoding="utf-8")

    custom_loader = ScenarioLoader(base_dir=tmp_path)
    custom_session_service = SessionService(loader=custom_loader)
    custom_engine = GameEngine(
        loader=custom_loader, session_service=custom_session_service
    )

    state = custom_session_service.start_game("locked_case", db=db_session)
    locked_move = GameActionDTO(action_type=ActionType.MOVE, target_id="loc2")

    with pytest.raises(LocationLockedError):
        custom_engine.execute_action(state.session_id, locked_move, db=db_session)


def test_inspect_action_and_idempotency(db_session, engine_service):
    """Verify evidence discovery, idempotency, and score increment."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    # First inspection discovering evidence_01
    action = GameActionDTO(action_type=ActionType.INSPECT, target_id="location_01")
    result = game_engine.execute_action(state.session_id, action, db=db_session)

    assert result.success is True
    assert result.newly_discovered_evidence == ["evidence_01"]
    assert result.already_known_evidence == []
    assert result.state.discovered_evidence_ids == ["evidence_01"]
    assert result.state.score == 10  # +10 points

    # Repeated inspection (idempotent)
    repeat_result = game_engine.execute_action(state.session_id, action, db=db_session)
    assert repeat_result.success is True
    assert repeat_result.newly_discovered_evidence == []
    assert repeat_result.already_known_evidence == ["evidence_01"]
    assert repeat_result.state.discovered_evidence_ids == ["evidence_01"]
    assert repeat_result.state.score == 10  # Score remains unchanged


def test_examine_evidence_action(db_session, engine_service):
    """Verify evidence examination rule: must be discovered prior to examination."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    examine_action = GameActionDTO(
        action_type=ActionType.EXAMINE_EVIDENCE, target_id="evidence_01"
    )

    # Examination fails before discovery
    with pytest.raises(EvidenceNotDiscoveredError):
        game_engine.execute_action(state.session_id, examine_action, db=db_session)

    # Discover evidence
    inspect_action = GameActionDTO(action_type=ActionType.INSPECT)
    game_engine.execute_action(state.session_id, inspect_action, db=db_session)

    # Examination succeeds after discovery
    result = game_engine.execute_action(state.session_id, examine_action, db=db_session)
    assert result.success is True
    assert result.evidence_detail is not None
    assert result.evidence_detail["evidence_id"] == "evidence_01"
    assert result.evidence_detail["name"] == "Vial of Poison"


def test_interview_action(db_session, engine_service):
    """Verify suspect interview action, idempotency, and public output."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    interview_action = GameActionDTO(
        action_type=ActionType.INTERVIEW, target_id="suspect_01"
    )
    result = game_engine.execute_action(
        state.session_id, interview_action, db=db_session
    )

    assert result.success is True
    assert result.state.interviewed_suspect_ids == ["suspect_01"]
    assert result.state.score == 10  # +10 points
    assert result.interview_result is not None
    assert result.interview_result["name"] == "Alice Smith"

    # Verify ground truth protection in interview result
    assert "is_culprit" not in result.interview_result
    assert "motive" not in result.interview_result

    # Invalid suspect interview
    invalid_interview = GameActionDTO(
        action_type=ActionType.INTERVIEW, target_id="ghost_suspect_99"
    )
    with pytest.raises(SuspectNotAvailableError):
        game_engine.execute_action(state.session_id, invalid_interview, db=db_session)


def test_stage_progression_rules(db_session, engine_service):
    """Verify stage progression requirements checking."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    advance_action = GameActionDTO(action_type=ActionType.ADVANCE_STAGE)

    # Cannot advance stage 1 because evidence_01 is required
    with pytest.raises(StageRequirementsNotMetError):
        game_engine.execute_action(state.session_id, advance_action, db=db_session)

    # Discover evidence_01
    game_engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )

    # Now stage 1 requirement is satisfied -> advance to stage 2
    result = game_engine.execute_action(state.session_id, advance_action, db=db_session)
    assert result.success is True
    assert result.state.current_stage_id == "stage_02"
    assert result.state.current_stage_order == 2
    assert result.state.completed_stage_ids == ["stage_01"]


def test_submit_solution_rules(db_session, engine_service):
    """Verify solution submission against ground truth."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    # Incorrect solution submission (suspect_02 is not culprit)
    wrong_submission = GameActionDTO(
        action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_02"
    )
    wrong_result = game_engine.execute_action(
        state.session_id, wrong_submission, db=db_session
    )

    assert wrong_result.success is False
    assert wrong_result.solution_correct is False
    assert wrong_result.state.status == SessionStatus.IN_PROGRESS
    # Ground truth protection: response does not leak true culprit ID
    assert "suspect_01" not in wrong_result.message

    # Correct solution submission (suspect_01 is culprit)
    correct_submission = GameActionDTO(
        action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"
    )
    correct_result = game_engine.execute_action(
        state.session_id, correct_submission, db=db_session
    )

    assert correct_result.success is True
    assert correct_result.solution_correct is True
    assert correct_result.state.status == SessionStatus.SOLVED
    assert correct_result.state.score == 50  # +50 points for solving


def test_submit_solution_invalid_suspect(db_session, engine_service):
    """Verify submitting an unknown suspect ID raises InvalidSolutionError."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    invalid_submission = GameActionDTO(
        action_type=ActionType.SUBMIT_SOLUTION, target_id="unknown_suspect_99"
    )
    with pytest.raises(InvalidSolutionError):
        game_engine.execute_action(state.session_id, invalid_submission, db=db_session)


def test_completed_session_rejects_actions(db_session, engine_service):
    """Verify that a SOLVED session rejects further actions."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    # Solve the session
    game_engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"),
        db=db_session,
    )

    # Attempting any action on SOLVED session raises SessionAlreadyCompletedError
    with pytest.raises(SessionAlreadyCompletedError):
        game_engine.execute_action(
            state.session_id,
            GameActionDTO(action_type=ActionType.MOVE, target_id="location_01"),
            db=db_session,
        )


def test_game_events_logged(db_session, engine_service):
    """Verify that GameEvent audit records are logged in the database for actions."""
    game_engine, session_service = engine_service
    state = session_service.start_game("test_case", db=db_session)

    # Perform inspect action
    game_engine.execute_action(
        state.session_id,
        GameActionDTO(action_type=ActionType.INSPECT),
        db=db_session,
    )

    # Query logged GameEvents
    events = db_session.scalars(
        select(GameEvent).where(GameEvent.session_id == state.session_id)
    ).all()
    # 1 START_GAME event + 1 INSPECT event
    assert len(events) >= 2
    event_types = [e.event_type for e in events]
    assert "START_GAME" in event_types
    assert "INSPECT" in event_types


def test_complete_investigation_lifecycle(db_session, engine_service):
    """Integration test simulating a complete investigation using fixture."""
    game_engine, session_service = engine_service

    # 1. Start session
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id
    assert state.status == SessionStatus.IN_PROGRESS
    assert state.current_stage_id == "stage_01"

    # 2. Inspect starting location to discover evidence_01
    r1 = game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert "evidence_01" in r1.state.discovered_evidence_ids

    # 3. Examine evidence_01
    r2 = game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.EXAMINE_EVIDENCE, target_id="evidence_01"),
        db=db_session,
    )
    assert r2.evidence_detail["name"] == "Vial of Poison"

    # 4. Advance stage 1 -> stage 2 (stage 1 requirement evidence_01 is met)
    r3 = game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r3.state.current_stage_id == "stage_02"

    # 5. Interview suspects
    r4 = game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="suspect_01"),
        db=db_session,
    )
    assert "suspect_01" in r4.state.interviewed_suspect_ids

    r5 = game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="suspect_02"),
        db=db_session,
    )
    assert "suspect_02" in r5.state.interviewed_suspect_ids

    # 6. Submit solution identifying culprit suspect_01
    r6 = game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"),
        db=db_session,
    )
    assert r6.success is True
    assert r6.state.status == SessionStatus.SOLVED

    # 7. Verify audit log contains all lifecycle events
    events = db_session.scalars(
        select(GameEvent).where(GameEvent.session_id == sid)
    ).all()
    event_types = [e.event_type for e in events]
    assert event_types == [
        "START_GAME",
        "INSPECT",
        "EXAMINE_EVIDENCE",
        "ADVANCE_STAGE",
        "INTERVIEW",
        "INTERVIEW",
        "SUBMIT_SOLUTION",
    ]

    # 8. Post-solution action attempt fails
    with pytest.raises(SessionAlreadyCompletedError):
        game_engine.execute_action(
            sid,
            GameActionDTO(action_type=ActionType.INSPECT),
            db=db_session,
        )
