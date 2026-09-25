"""FastAPI router for session management, context retrieval, and history."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db,
    get_investigation_context_builder,
    get_player_state_builder,
    get_scenario_registry,
    get_session_service,
)
from app.api.schemas.session import (
    ActionItem,
    AvailabilityFlag,
    AvailableActionsResponse,
    CreateSessionRequest,
    GameEventResponse,
    PlayerInvestigationState,
    SessionCreatedResponse,
    SessionLocationResponse,
    SessionStageResponse,
)
from app.models.game_event import GameEvent
from app.scenarios.registry import ScenarioRegistry
from app.schemas.game_state import GameStateDTO
from app.services.investigation_context import (
    InvestigationContext,
    InvestigationContextBuilder,
)
from app.services.player_state import PlayerStateBuilder
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "",
    response_model=SessionCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    registry: ScenarioRegistry = Depends(get_scenario_registry),
    ctx_builder: InvestigationContextBuilder = Depends(
        get_investigation_context_builder
    ),
) -> SessionCreatedResponse:
    """Start a new game session using scenario ID or display name."""
    canonical_id = registry.resolve_scenario_id(request.scenario)
    state = session_service.start_game(canonical_id, db=db)
    context = ctx_builder.build_context(state.session_id, db=db)

    cur_loc = (
        SessionLocationResponse(
            id=context.current_location_id,
            name=context.current_location_name,
            description=context.current_location_description,
        )
        if context.current_location_id
        else None
    )

    return SessionCreatedResponse(
        session_id=state.session_id,
        scenario_id=state.scenario_id,
        case_title=context.case_title,
        stage=SessionStageResponse(
            id=context.current_stage_id,
            order=context.current_stage_order,
            name=context.current_stage_name,
        ),
        status=state.status.value,
        score=state.score,
        current_location=cur_loc,
    )


@router.get("/{session_id}", response_model=GameStateDTO)
def get_session_state(
    session_id: str,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> GameStateDTO:
    """Retrieve player-facing GameStateDTO for an active or completed session."""
    session_obj = session_service.get_session(session_id, db=db)
    return session_service.to_game_state_dto(session_obj)


@router.get("/{session_id}/context", response_model=InvestigationContext)
def get_session_context(
    session_id: str,
    db: Session = Depends(get_db),
    ctx_builder: InvestigationContextBuilder = Depends(
        get_investigation_context_builder
    ),
) -> InvestigationContext:
    """Retrieve player-safe InvestigationContext strictly omitting ground truth."""
    return ctx_builder.build_context(session_id, db=db)


@router.get("/{session_id}/available-actions", response_model=AvailableActionsResponse)
def get_available_actions(
    session_id: str,
    db: Session = Depends(get_db),
    ctx_builder: InvestigationContextBuilder = Depends(
        get_investigation_context_builder
    ),
) -> AvailableActionsResponse:
    """Retrieve player-friendly representation of actions currently available."""
    context = ctx_builder.build_context(session_id, db=db)

    move_options = [
        ActionItem(id=loc["id"], name=loc["name"])
        for loc in context.available_locations
        if loc["id"] != context.current_location_id
    ]

    interrogate_options = [
        ActionItem(id=s["id"], name=s["name"]) for s in context.available_suspects
    ]

    examine_options = [
        ActionItem(id=ev["id"], name=ev["name"]) for ev in context.discovered_evidence
    ]

    can_inspect = bool(
        context.current_location_id and context.session_status == "in_progress"
    )

    return AvailableActionsResponse(
        move=move_options,
        inspect=can_inspect,
        interrogate=interrogate_options,
        examine=examine_options,
        advance=AvailabilityFlag(available=context.can_advance),
        solve=AvailabilityFlag(available=context.is_final_stage),
    )


@router.get("/{session_id}/history", response_model=list[GameEventResponse])
def get_session_history(
    session_id: str,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
) -> list[GameEventResponse]:
    """Retrieve chronological player-visible audit history for a session."""
    # Ensure session exists
    session_service.get_session(session_id, db=db)

    events = db.scalars(
        select(GameEvent)
        .where(GameEvent.session_id == session_id)
        .order_by(GameEvent.timestamp)
    ).all()

    return [
        GameEventResponse(
            id=str(e.id),
            session_id=e.session_id,
            event_type=e.event_type,
            target_type=e.target_type,
            target_id=e.target_id,
            timestamp=e.timestamp,
            result_data=e.result_data,
        )
        for e in events
    ]


@router.get("/{session_id}/state", response_model=PlayerInvestigationState)
def get_player_investigation_state(
    session_id: str,
    db: Session = Depends(get_db),
    state_builder: PlayerStateBuilder = Depends(get_player_state_builder),
) -> PlayerInvestigationState:
    """Retrieve complete player-facing investigation state DTO."""
    return state_builder.build_state(session_id, db=db)
