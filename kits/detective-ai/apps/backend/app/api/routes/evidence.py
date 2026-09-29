"""FastAPI router for deterministic evidence examination and AI forensic analysis."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db,
    get_evidence_agent,
    get_evidence_knowledge_builder,
    get_game_engine,
    get_investigation_context_builder,
    get_session_service,
)
from app.api.schemas.evidence import (
    AIAnalysisResponse,
    EvidenceExamineResponse,
)
from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.evidence_knowledge import EvidenceKnowledgeBuilder
from app.lamatic.exceptions import LamaticError
from app.schemas.game_state import ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import InvestigationContextBuilder
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["Evidence"])


@router.post(
    "/{session_id}/evidence/{evidence_id}/examine",
    response_model=EvidenceExamineResponse,
)
def examine_evidence(
    session_id: str,
    evidence_id: str,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    game_engine: GameEngine = Depends(get_game_engine),
    ek_builder: EvidenceKnowledgeBuilder = Depends(get_evidence_knowledge_builder),
    ctx_builder: InvestigationContextBuilder = Depends(
        get_investigation_context_builder
    ),
    evidence_agent: EvidenceAgent = Depends(get_evidence_agent),
) -> EvidenceExamineResponse:
    """Examine evidence via GameEngine and invoke AI forensic analysis."""
    session_obj = session_service.get_session(session_id, db=db)
    state_dto = session_service.to_game_state_dto(session_obj)

    # 1. Resolve canonical evidence ID from name or ID
    canonical_id = ek_builder.resolve_evidence_id(state_dto.scenario_id, evidence_id)

    # 2. GameEngine executes deterministic examination
    action_dto = GameActionDTO(
        action_type=ActionType.EXAMINE_EVIDENCE, target_id=canonical_id
    )
    action_result = game_engine.execute_action(session_id, action_dto, db=db)

    # 3. Build player-safe knowledge and context
    knowledge = ek_builder.build_knowledge(state_dto.scenario_id, canonical_id)
    context = ctx_builder.build_context(session_id, db=db)

    # 4. Invoke AI EvidenceAgent (handle Lamatic degradation gracefully)
    try:
        agent_response = evidence_agent.ask(knowledge=knowledge, context=context)
        analysis = AIAnalysisResponse(
            content=agent_response.content,
            status=agent_response.status,
            error=None,
        )
    except LamaticError as err:
        logger.warning(
            "AI forensic analysis unavailable for evidence_id=%s session_id=%s: %s",
            canonical_id,
            session_id,
            err,
        )
        analysis = AIAnalysisResponse(
            content=None,
            status="unavailable",
            error=f"AI forensic interpretation unavailable: {err}",
        )

    evidence_dict = action_result.evidence_detail or {
        "evidence_id": knowledge.evidence_id,
        "name": knowledge.name,
        "description": knowledge.description,
        "evidence_type": knowledge.evidence_type,
        "location_id": knowledge.location_id,
        "location_name": knowledge.location_name,
    }

    return EvidenceExamineResponse(
        evidence=evidence_dict,
        action_result=action_result,
        analysis=analysis,
    )
