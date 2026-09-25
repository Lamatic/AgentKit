"""Integration test for full the_midnight_archive gameplay and logging validation."""

from pathlib import Path

from sqlalchemy.orm import Session

from app.core.logging import configure_logging
from app.schemas.game_state import ActionType, GameActionDTO, SessionStatus
from app.schemas.solution_evaluation import SolutionSubmission
from app.services.game_engine import GameEngine
from app.services.session_service import SessionService
from app.services.solution_service import SolutionEvaluationService


def test_full_midnight_archive_gameplay_and_logging(
    db_session: Session, tmp_path: Path
):
    """End-to-end the_midnight_archive gameplay and log verification."""
    log_file = tmp_path / "gameplay_test.log"
    configure_logging(log_level="DEBUG", log_file=log_file, console=False)

    session_service = SessionService()
    engine = GameEngine(session_service=session_service)
    solution_service = SolutionEvaluationService(
        session_service=session_service, game_engine=engine
    )

    # 1. Start session
    initial_state = session_service.start_game("the_midnight_archive", db=db_session)
    session_id = initial_state.session_id
    assert initial_state.current_location_id == "location_01"
    assert initial_state.current_stage_id == "stage_01"

    # 2. Inspect initial location (Main Lobby) -> discovers evidence_02, evidence_06
    r_inspect_lobby = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert r_inspect_lobby.success
    assert "evidence_02" in r_inspect_lobby.state.discovered_evidence_ids
    assert "evidence_06" in r_inspect_lobby.state.discovered_evidence_ids

    # 3. Move to Archive Reading Room (location_02)
    r_move_archive = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.MOVE, target_id="location_02"),
        db=db_session,
    )
    assert r_move_archive.success
    assert r_move_archive.state.current_location_id == "location_02"

    # 4. Inspect Archive Reading Room -> discovers evidence_01
    r_inspect_archive = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert r_inspect_archive.success
    assert "evidence_01" in r_inspect_archive.state.discovered_evidence_ids

    # 5. Advance stage -> stage_01 to stage_02
    r_adv_1 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r_adv_1.success
    assert r_adv_1.state.current_stage_id == "stage_02"

    # 6. Stage 02: Interview required suspects (suspect_02, suspect_03)
    r_int_02 = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="suspect_02"),
        db=db_session,
    )
    assert r_int_02.success

    r_int_03 = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.INTERVIEW, target_id="suspect_03"),
        db=db_session,
    )
    assert r_int_03.success

    # 7. Advance stage -> stage_02 to stage_03
    r_adv_2 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r_adv_2.success
    assert r_adv_2.state.current_stage_id == "stage_03"

    # 8. Stage 03: Move to Server Control Lab (location_03)
    r_move_lab = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.MOVE, target_id="location_03"),
        db=db_session,
    )
    assert r_move_lab.success

    # 9. Inspect Server Control Lab -> discovers evidence_03, evidence_04
    r_inspect_lab = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert r_inspect_lab.success
    assert "evidence_03" in r_inspect_lab.state.discovered_evidence_ids
    assert "evidence_04" in r_inspect_lab.state.discovered_evidence_ids

    # 10. Examine evidence
    r_exam_03 = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.EXAMINE_EVIDENCE, target_id="evidence_03"),
        db=db_session,
    )
    assert r_exam_03.success

    # 11. Advance stage -> stage_03 to stage_04
    r_adv_3 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r_adv_3.success
    assert r_adv_3.state.current_stage_id == "stage_04"

    # 12. Stage 04: Move to Systems Engineering Hub (location_04)
    r_move_b3 = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.MOVE, target_id="location_04"),
        db=db_session,
    )
    assert r_move_b3.success

    r_inspect_b3 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert r_inspect_b3.success
    assert "evidence_05" in r_inspect_b3.state.discovered_evidence_ids

    # 13. Interview suspects (suspect_01, suspect_04, suspect_05)
    for sus_id in ("suspect_01", "suspect_04", "suspect_05"):
        r_int = engine.execute_action(
            session_id,
            GameActionDTO(action_type=ActionType.INTERVIEW, target_id=sus_id),
            db=db_session,
        )
        assert r_int.success

    # 14. Advance stage -> stage_04 to stage_05
    r_adv_4 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r_adv_4.success
    assert r_adv_4.state.current_stage_id == "stage_05"

    # 15. Stage 05: Move to Secure Databank Vault (location_06)
    r_move_vault = engine.execute_action(
        session_id,
        GameActionDTO(action_type=ActionType.MOVE, target_id="location_06"),
        db=db_session,
    )
    assert r_move_vault.success

    r_inspect_vault = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    assert r_inspect_vault.success
    assert "evidence_08" in r_inspect_vault.state.discovered_evidence_ids

    # 16. Advance stage -> stage_05 to stage_06
    r_adv_5 = engine.execute_action(
        session_id, GameActionDTO(action_type=ActionType.ADVANCE_STAGE), db=db_session
    )
    assert r_adv_5.success
    assert r_adv_5.state.current_stage_id == "stage_06"

    # 17. Submit final solution
    submission = SolutionSubmission(
        session_id=session_id,
        culprit_id="suspect_05",
        motive="Unauthorized extraction of Project ORION architecture and cover-up.",
        explanation=(
            "Dr. Henry Wu used a modified token to access the archive and exfiltrate "
            "specifications."
        ),
        supporting_evidence_ids=[
            "evidence_02",
            "evidence_03",
            "evidence_05",
            "evidence_06",
            "evidence_08",
        ],
        reasoning=(
            "Network logs and hardware token evidence establish Dr. Wu's "
            "unauthorized access sequence."
        ),
        timeline_explanation=(
            "At 23:47 access was authenticated and video feeds were corrupted."
        ),
    )

    action_result, evaluation = solution_service.evaluate_and_submit(
        submission, db=db_session
    )

    assert action_result.success
    assert evaluation.culprit_correct
    assert action_result.state.status == SessionStatus.SOLVED
    assert evaluation.overall_score >= 80

    # 18. Verify structured log output
    for handler in log_file_handlers():
        handler.flush()

    log_content = log_file.read_text(encoding="utf-8")
    assert f"session_id={session_id}" in log_content
    assert (
        "Starting new game session for scenario_id=the_midnight_archive" in log_content
    )
    assert "Executing action MOVE" in log_content
    assert "Executing action INSPECT" in log_content
    assert "Executing action INTERVIEW" in log_content
    assert "Executing action EXAMINE_EVIDENCE" in log_content
    assert "Executing action ADVANCE_STAGE" in log_content
    assert "Solution submission evaluation started" in log_content
    assert "Solution accepted for session_id=" in log_content


def log_file_handlers():
    import logging

    return logging.getLogger().handlers
