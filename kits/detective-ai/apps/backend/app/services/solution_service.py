"""Application service for orchestrating case solution submission and evaluation."""

import logging
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import (
    InvalidSolutionError,
    SessionAlreadyCompletedError,
)
from app.lamatic.exceptions import LamaticError
from app.lamatic.solution_evaluator import SolutionEvaluator
from app.models.game_event import GameEvent
from app.scenarios.loader import ScenarioLoader
from app.schemas.game_state import (
    ActionResultDTO,
    ActionType,
    GameActionDTO,
    SessionStatus,
)
from app.schemas.solution_evaluation import SolutionEvaluation, SolutionSubmission
from app.services.game_engine import GameEngine
from app.services.investigation_context import InvestigationContextBuilder
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


class SolutionEvaluationService:
    """Service orchestrating solution validation and evaluation."""

    def __init__(
        self,
        session_service: SessionService | None = None,
        game_engine: GameEngine | None = None,
        loader: ScenarioLoader | None = None,
        evaluator: SolutionEvaluator | None = None,
        ctx_builder: InvestigationContextBuilder | None = None,
    ) -> None:
        self.session_service = session_service or SessionService()
        self.game_engine = game_engine or GameEngine(
            session_service=self.session_service
        )
        self.loader = loader or ScenarioLoader()
        self.evaluator = evaluator or SolutionEvaluator()
        self.ctx_builder = ctx_builder or InvestigationContextBuilder(
            session_service=self.session_service, loader=self.loader
        )

    def evaluate_and_submit(
        self,
        submission: SolutionSubmission,
        db: Session,
    ) -> tuple[ActionResultDTO, SolutionEvaluation]:
        """Validate submission, run AI evaluation, and persist audit event."""
        logger.info(
            "Solution submission evaluation started for session_id=%s "
            "accused_culprit=%s evidence_count=%d",
            submission.session_id,
            submission.culprit_id,
            len(submission.supporting_evidence_ids),
        )

        # 1. Validate active session existence and completion status
        session_obj = self.session_service.get_session(submission.session_id, db=db)
        if session_obj.status in (
            SessionStatus.SOLVED.value,
            SessionStatus.FAILED.value,
        ):
            logger.warning(
                "Solution submission rejected: session %s is already completed (%s)",
                submission.session_id,
                session_obj.status,
            )
            raise SessionAlreadyCompletedError(
                f"Cannot submit solution: session '{submission.session_id}' "
                "is already completed."
            )

        state_dto = self.session_service.to_game_state_dto(session_obj)
        scenario_def = self.loader.load(state_dto.scenario_id)

        # 2. Objective validation: Check culprit existence
        suspect = next(
            (s for s in scenario_def.suspects if s.id == submission.culprit_id), None
        )
        if not suspect:
            logger.warning(
                "Solution submission failed: accused suspect %s does not exist "
                "in scenario",
                submission.culprit_id,
            )
            raise InvalidSolutionError(
                f"Suspect '{submission.culprit_id}' does not exist in scenario."
            )

        # 3. Objective validation: Check evidence existence
        for ev_id in submission.supporting_evidence_ids:
            ev_found = next((e for e in scenario_def.evidence if e.id == ev_id), None)
            if not ev_found:
                logger.warning(
                    "Solution submission failed: supporting evidence %s does not "
                    "exist in scenario",
                    ev_id,
                )
                raise InvalidSolutionError(
                    f"Evidence '{ev_id}' does not exist in scenario."
                )

        # 4. Objective culprit correctness determination
        objective_culprit_correct = (
            submission.culprit_id == scenario_def.solution.culprit_id
        )

        # 5. Subjective AI Evaluation via SolutionEvaluator (with fallback)
        public_scenario = scenario_def.to_player_view()
        try:
            inv_context = self.ctx_builder.build_context(submission.session_id, db=db)
            evaluation = self.evaluator.evaluate(
                submission=submission,
                player_scenario=public_scenario,
                objective_culprit_correct=objective_culprit_correct,
                context=inv_context,
            )
        except (LamaticError, Exception) as err:
            logger.warning(
                "AI solution evaluation unavailable (%s), using deterministic "
                "fallback for session_id=%s",
                err,
                submission.session_id,
            )
            # Graceful offline fallback evaluation if Lamatic is unavailable
            evaluation = self._build_fallback_evaluation(
                submission=submission,
                objective_culprit_correct=objective_culprit_correct,
            )

        # 6. Execute GameEngine SUBMIT_SOLUTION action
        action_dto = GameActionDTO(
            action_type=ActionType.SUBMIT_SOLUTION, target_id=submission.culprit_id
        )
        action_result = self.game_engine.execute_action(
            submission.session_id, action_dto, db=db
        )

        # 7. Apply overall score and finalize session status
        db.refresh(session_obj)
        session_obj.score += evaluation.overall_score
        if not objective_culprit_correct:
            session_obj.status = SessionStatus.FAILED.value

        db.commit()
        db.refresh(session_obj)

        logger.info(
            "Solution submission finalized for session_id=%s objective_correct=%s "
            "evaluation_score=%d final_session_status=%s total_score=%d",
            submission.session_id,
            objective_culprit_correct,
            evaluation.overall_score,
            session_obj.status,
            session_obj.score,
        )

        # 8. Record audit GameEvent
        updated_state = self.session_service.to_game_state_dto(session_obj)
        action_result.state = updated_state
        action_result.success = objective_culprit_correct
        if objective_culprit_correct:
            action_result.message = (
                f"Solution accepted! Score {evaluation.overall_score}/100."
            )
        else:
            action_result.message = (
                f"Solution incorrect! Accused culprit '{suspect.name}' is wrong. "
                f"Session FAILED with score {evaluation.overall_score}/100."
            )

        audit_event = GameEvent(
            id=str(uuid.uuid4()),
            session_id=submission.session_id,
            event_type="SUBMIT_SOLUTION_EVALUATION",
            target_type="solution",
            target_id=submission.culprit_id,
            result_data={
                "submission": submission.model_dump(),
                "evaluation": evaluation.model_dump(),
                "objective_culprit_correct": objective_culprit_correct,
            },
        )
        db.add(audit_event)
        db.commit()

        return action_result, evaluation

    @staticmethod
    def _build_fallback_evaluation(
        submission: SolutionSubmission,
        objective_culprit_correct: bool,
    ) -> SolutionEvaluation:
        """Construct deterministic fallback evaluation when AI evaluator is offline."""
        ev_score = 15 if submission.supporting_evidence_ids else 5
        mot_score = 10 if submission.motive else 0
        reas_score = 15 if submission.reasoning else 5
        time_score = 10 if submission.timeline_explanation else 0
        culprit_score = 30 if objective_culprit_correct else 0

        overall = culprit_score + ev_score + mot_score + reas_score + time_score

        strengths: list[str] = []
        weaknesses: list[str] = []

        if objective_culprit_correct:
            strengths.append("Correctly identified the primary culprit.")
        else:
            weaknesses.append("Identified suspect does not match the actual culprit.")

        if submission.supporting_evidence_ids:
            strengths.append("Provided supporting evidence items.")
        else:
            weaknesses.append("No supporting evidence items cited.")

        if submission.motive:
            strengths.append("Provided motive explanation.")

        correct_str = "correct" if objective_culprit_correct else "incorrect"
        return SolutionEvaluation(
            culprit_correct=objective_culprit_correct,
            evidence_score=ev_score,
            motive_score=mot_score,
            reasoning_score=reas_score,
            timeline_score=time_score,
            overall_score=overall,
            strengths=strengths,
            weaknesses=weaknesses,
            contradictions=[],
            feedback=(
                "Solution evaluation completed using deterministic rules. "
                f"Culprit identification was {correct_str}."
            ),
        )
