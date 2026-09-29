"""FastAPI router for deterministic investigation action execution."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_game_engine
from app.api.schemas.action import ActionExecutionRequest
from app.core.exceptions import InvalidActionError
from app.schemas.game_state import ActionResultDTO, ActionType, GameActionDTO
from app.services.game_engine import GameEngine

router = APIRouter(prefix="/sessions", tags=["Actions"])

_ACTION_MAPPING: dict[str, ActionType] = {
    "move": ActionType.MOVE,
    "inspect": ActionType.INSPECT,
    "interview": ActionType.INTERVIEW,
    "examine_evidence": ActionType.EXAMINE_EVIDENCE,
    "examine": ActionType.EXAMINE_EVIDENCE,
    "advance": ActionType.ADVANCE_STAGE,
    "advance_stage": ActionType.ADVANCE_STAGE,
    "submit_solution": ActionType.SUBMIT_SOLUTION,
    "solve": ActionType.SUBMIT_SOLUTION,
}


@router.post("/{session_id}/actions", response_model=ActionResultDTO)
def execute_action(
    session_id: str,
    request: ActionExecutionRequest,
    db: Session = Depends(get_db),
    game_engine: GameEngine = Depends(get_game_engine),
) -> ActionResultDTO:
    """Execute a deterministic investigation action through GameEngine."""
    normalized_action = request.action.strip().lower()
    action_type = _ACTION_MAPPING.get(normalized_action)
    if not action_type:
        raise InvalidActionError(
            f"Unsupported action '{request.action}'. Supported actions: "
            "move, inspect, interview, examine_evidence, advance."
        )

    action_dto = GameActionDTO(
        action_type=action_type,
        target_id=request.target_id,
        details=request.details,
    )
    return game_engine.execute_action(session_id, action_dto, db=db)
