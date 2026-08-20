"""FastAPI router for final case solution submission and AI evaluation."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_solution_evaluation_service
from app.api.schemas.solution import (
    SolutionEvaluationBreakdown,
    SolveRequest,
    SolveResponse,
)
from app.schemas.solution_evaluation import SolutionSubmission
from app.services.solution_service import SolutionEvaluationService

router = APIRouter(prefix="/sessions", tags=["Solutions"])


@router.post("/{session_id}/solve", response_model=SolveResponse)
def submit_solution(
    session_id: str,
    request: SolveRequest,
    db: Session = Depends(get_db),
    solution_service: SolutionEvaluationService = Depends(
        get_solution_evaluation_service
    ),
) -> SolveResponse:
    session_obj = solution_service.session_service.get_session(session_id, db=db)
    state_dto = solution_service.session_service.to_game_state_dto(session_obj)

    from app.lamatic.evidence_knowledge import EvidenceKnowledgeBuilder
    from app.services.suspect_knowledge import SuspectKnowledgeBuilder

    suspect_builder = SuspectKnowledgeBuilder(loader=solution_service.loader)
    try:
        canonical_culprit_id = suspect_builder.resolve_suspect_id(
            state_dto.scenario_id, request.culprit_id
        )
    except Exception:
        canonical_culprit_id = request.culprit_id

    evidence_builder = EvidenceKnowledgeBuilder(loader=solution_service.loader)
    canonical_evidence_ids = []
    for ev in request.evidence_ids:
        try:
            canonical_evidence_ids.append(
                evidence_builder.resolve_evidence_id(state_dto.scenario_id, ev)
            )
        except Exception:
            canonical_evidence_ids.append(ev)

    explanation_summary = request.explanation or (
        f"Culprit {request.culprit_id} committed the crime because "
        f"{request.motive}. Reasoning: {request.reasoning}"
    )
    submission = SolutionSubmission(
        session_id=session_id,
        culprit_id=canonical_culprit_id,
        motive=request.motive,
        explanation=explanation_summary,
        supporting_evidence_ids=canonical_evidence_ids,
        reasoning=request.reasoning,
        timeline_explanation=request.timeline,
    )

    action_result, evaluation = solution_service.evaluate_and_submit(
        submission=submission, db=db
    )

    breakdown = SolutionEvaluationBreakdown(
        culprit_identification=30 if evaluation.culprit_correct else 0,
        evidence_relevance=evaluation.evidence_score,
        motive_reasoning=evaluation.motive_score,
        reasoning_quality=evaluation.reasoning_score,
        timeline_reasoning=evaluation.timeline_score,
    )

    feedback_text = evaluation.feedback

    db.refresh(session_obj)
    return SolveResponse(
        status=session_obj.status,
        score=session_obj.score,
        evaluation=breakdown,
        feedback=feedback_text,
    )
