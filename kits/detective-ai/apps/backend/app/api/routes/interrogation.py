"""FastAPI router for AI-driven multi-turn suspect interrogations."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db,
    get_game_engine,
    get_session_service,
    get_suspect_conversation_manager,
    get_suspect_knowledge_builder,
)
from app.api.schemas.interrogation import InterrogateRequest, InterrogateResponse
from app.core.exceptions import SessionAlreadyCompletedError
from app.schemas.game_state import ActionType, GameActionDTO, SessionStatus
from app.services.game_engine import GameEngine
from app.services.session_service import SessionService
from app.services.suspect_conversation import SuspectConversationManager
from app.services.suspect_knowledge import SuspectKnowledgeBuilder

router = APIRouter(prefix="/sessions", tags=["Interrogation"])


@router.post(
    "/{session_id}/suspects/{suspect_id}/interrogate",
    response_model=InterrogateResponse,
)
def interrogate_suspect(
    session_id: str,
    suspect_id: str,
    request: InterrogateRequest,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    game_engine: GameEngine = Depends(get_game_engine),
    knowledge_builder: SuspectKnowledgeBuilder = Depends(get_suspect_knowledge_builder),
    conversation_manager: SuspectConversationManager = Depends(
        get_suspect_conversation_manager
    ),
) -> InterrogateResponse:
    """Interrogate a suspect via SuspectAgent and update interview state."""
    session_obj = session_service.get_session(session_id, db=db)
    if session_obj.status in (
        SessionStatus.SOLVED.value,
        SessionStatus.FAILED.value,
    ):
        raise SessionAlreadyCompletedError(
            f"Cannot interrogate suspects: session '{session_id}' is already completed."
        )

    state_dto = session_service.to_game_state_dto(session_obj)
    canonical_suspect_id = knowledge_builder.resolve_suspect_id(
        state_dto.scenario_id, suspect_id
    )

    # 1. Update GameEngine deterministic interview status
    interview_action = GameActionDTO(
        action_type=ActionType.INTERVIEW, target_id=canonical_suspect_id
    )
    game_engine.execute_action(session_id, interview_action, db=db)

    # 2. Build player-safe suspect knowledge
    knowledge = knowledge_builder.build_knowledge(
        state_dto.scenario_id, canonical_suspect_id
    )

    # 3. Process dialogue turn through SuspectConversationManager
    agent_response = conversation_manager.ask_suspect(
        session_id=session_id,
        knowledge=knowledge,
        user_message=request.message,
        db=db,
    )

    return InterrogateResponse(
        suspect_id=knowledge.suspect_id,
        suspect_name=knowledge.name,
        response=agent_response.content,
        status=agent_response.status,
    )
