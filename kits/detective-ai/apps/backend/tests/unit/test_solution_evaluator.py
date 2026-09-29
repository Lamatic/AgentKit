"""Unit tests for solution submission, evaluation, and SolutionEvaluator."""

from unittest.mock import MagicMock

import pytest
from typer.testing import CliRunner

from app.core.exceptions import (
    InvalidSolutionError,
    SessionAlreadyCompletedError,
)
from app.db.database import init_db
from app.lamatic.schemas import AgentResponse
from app.lamatic.solution_evaluator import SolutionEvaluator
from app.models.game_event import GameEvent
from app.schemas.game_state import SessionStatus
from app.schemas.solution_evaluation import SolutionEvaluation, SolutionSubmission
from app.services.session_service import SessionService
from app.services.solution_service import SolutionEvaluationService
from cli.app import app
from cli.commands import solve_cmd, start_cmd

runner = CliRunner()


def test_solution_submission_schema_valid():
    """Verify SolutionSubmission Pydantic schema validation."""
    sub = SolutionSubmission(
        session_id="sess_123",
        culprit_id="suspect_01",
        motive="Financial gain and corporate blackmail.",
        explanation="The suspect poisoned the tea during the meeting.",
        supporting_evidence_ids=["evidence_01", "evidence_02"],
        reasoning="Traces of poison matched the glass vial found.",
        timeline_explanation="At 8:30 PM suspect entered the office.",
    )
    assert sub.session_id == "sess_123"
    assert sub.culprit_id == "suspect_01"
    assert len(sub.supporting_evidence_ids) == 2


def test_solution_evaluation_bounds_and_calculation():
    """Verify SolutionEvaluation score computation and bounds enforcement."""
    raw = {
        "evidence_score": 18,
        "motive_score": 14,
        "reasoning_score": 18,
        "timeline_score": 15,
        "strengths": ["Strong evidence link."],
        "weaknesses": ["Minor gap in timeline."],
        "contradictions": [],
        "feedback": "Great detective work.",
    }
    eval_obj = SolutionEvaluation.from_raw_dict(raw, culprit_correct=True)

    # 30 (culprit) + 18 + 14 + 18 + 15 = 95
    assert eval_obj.culprit_correct is True
    assert eval_obj.overall_score == 95
    assert eval_obj.evidence_score == 18
    assert len(eval_obj.strengths) == 1


def test_solution_evaluator_ground_truth_confidentiality(db_session):
    """Verify SolutionEvaluator payload omits ground truth confidential fields."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)

    submission = SolutionSubmission(
        session_id=state.session_id,
        culprit_id="suspect_01",
        motive="Motive test",
        explanation="Explanation test",
        supporting_evidence_ids=["evidence_01"],
        reasoning="Reasoning test",
    )

    json_res = (
        '{"evidence_score": 15, "motive_score": 10, "reasoning_score": 15, '
        '"timeline_score": 10, "feedback": "Good theory."}'
    )
    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content=json_res,
        status="success",
    )

    evaluator = SolutionEvaluator(client=mock_client)
    public_scenario = session_service.loader.load("test_case").to_player_view()

    eval_result = evaluator.evaluate(
        submission=submission,
        player_scenario=public_scenario,
        objective_culprit_correct=True,
    )

    assert eval_result.culprit_correct is True
    mock_client.execute.assert_called_once()
    payload = mock_client.execute.call_args[1]["payload"]

    payload_str = str(payload)
    assert "is_culprit" not in payload_str
    assert "solution_summary" not in payload_str


def test_service_evaluate_and_submit_correct_culprit(db_session):
    """Verify evaluate_and_submit correctly solves case when culprit is correct."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    submission = SolutionSubmission(
        session_id=sid,
        culprit_id="suspect_01",  # Correct culprit in test_case
        motive="Greed",
        explanation="Poisoned tea",
        supporting_evidence_ids=["evidence_01"],
        reasoning="Matched poison vial",
    )

    service = SolutionEvaluationService(session_service=session_service)
    action_result, evaluation = service.evaluate_and_submit(submission, db=db_session)

    assert action_result.success is True
    assert evaluation.culprit_correct is True
    assert action_result.state.status == SessionStatus.SOLVED

    # Check audit GameEvent
    event = (
        db_session.query(GameEvent)
        .filter_by(session_id=sid, event_type="SUBMIT_SOLUTION_EVALUATION")
        .first()
    )
    assert event is not None
    assert event.result_data["objective_culprit_correct"] is True


def test_service_evaluate_and_submit_incorrect_culprit(db_session):
    """Verify evaluate_and_submit fails case when accused culprit is wrong."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    submission = SolutionSubmission(
        session_id=sid,
        culprit_id="suspect_02",  # Wrong culprit
        motive="Unknown",
        explanation="Wrong theory",
        supporting_evidence_ids=["evidence_01"],
        reasoning="Flawed logic",
    )

    service = SolutionEvaluationService(session_service=session_service)
    action_result, evaluation = service.evaluate_and_submit(submission, db=db_session)

    assert action_result.success is False
    assert evaluation.culprit_correct is False
    assert action_result.state.status == SessionStatus.FAILED


def test_service_invalid_culprit_rejected(db_session):
    """Verify evaluate_and_submit raises InvalidSolutionError for unknown suspect ID."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    submission = SolutionSubmission(
        session_id=sid,
        culprit_id="unknown_suspect_99",
        motive="Motive",
        explanation="Explanation",
        reasoning="Reasoning",
    )

    service = SolutionEvaluationService(session_service=session_service)
    with pytest.raises(InvalidSolutionError):
        service.evaluate_and_submit(submission, db=db_session)


def test_service_invalid_evidence_rejected(db_session):
    """Verify evaluate_and_submit rejects invalid evidence ID."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    submission = SolutionSubmission(
        session_id=sid,
        culprit_id="suspect_01",
        motive="Motive",
        explanation="Explanation",
        supporting_evidence_ids=["unknown_evidence_99"],
        reasoning="Reasoning",
    )

    service = SolutionEvaluationService(session_service=session_service)
    with pytest.raises(InvalidSolutionError):
        service.evaluate_and_submit(submission, db=db_session)


def test_service_completed_session_rejected(db_session):
    """Verify submitting solution on already completed session is rejected."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    service = SolutionEvaluationService(session_service=session_service)
    submission = SolutionSubmission(
        session_id=sid,
        culprit_id="suspect_01",
        motive="Motive",
        explanation="Explanation",
        supporting_evidence_ids=["evidence_01"],
        reasoning="Reasoning",
    )

    # First submission completes session
    service.evaluate_and_submit(submission, db=db_session)

    # Second submission on completed session
    with pytest.raises(SessionAlreadyCompletedError):
        service.evaluate_and_submit(submission, db=db_session)


def test_cli_solve_command(monkeypatch, db_session):
    """Verify CLI solve_cmd interactive flow."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    inputs = iter(
        [
            "suspect_01",  # culprit
            "Greed",  # motive
            "Poisoned tea",  # explanation
            "evidence_01",  # evidence
            "Vial matched",  # reasoning
            "8 PM entered",  # timeline
            "y",  # confirm
        ]
    )

    solve_cmd(sid, input_fn=lambda prompt: next(inputs), db=db_session)

    session_obj = session_service.get_session(sid, db=db_session)
    assert session_obj.status == SessionStatus.SOLVED.value


def test_cli_solve_app_runner(monkeypatch):
    """Verify Typer CLI solve command runner."""
    init_db()
    sid = start_cmd("test_case")

    inputs = iter(
        [
            "suspect_01",
            "Greed",
            "Poisoned tea",
            "evidence_01",
            "Vial matched",
            "",
            "y",
        ]
    )

    def mock_input(prompt):
        return next(inputs)

    monkeypatch.setattr("builtins.input", mock_input)

    result = runner.invoke(
        app,
        ["solve", sid],
        input="\n".join(
            [
                "suspect_01",
                "Greed",
                "Poisoned tea",
                "evidence_01",
                "Vial matched",
                "",
                "y",
            ]
        ),
    )

    assert result.exit_code == 0
    assert "CASE RESOLUTION EVALUATION" in result.output
    assert "CORRECT" in result.output
