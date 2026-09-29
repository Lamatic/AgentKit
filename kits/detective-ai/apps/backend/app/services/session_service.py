"""Session management service for creating, retrieving, and updating game sessions."""

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import SessionNotFoundError
from app.models.case import Case
from app.models.game_event import GameEvent
from app.models.game_session import GameSession
from app.models.location import Location
from app.scenarios.loader import ScenarioLoader
from app.scenarios.registry import ScenarioRegistry
from app.schemas.game_state import GameStateDTO, SessionStatus

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing investigation game session lifecycles."""

    def __init__(
        self,
        loader: ScenarioLoader | None = None,
        registry: ScenarioRegistry | None = None,
    ) -> None:
        self.loader = loader or ScenarioLoader()
        self.registry = registry or ScenarioRegistry(base_dir=self.loader.base_dir)

    def start_game(
        self,
        scenario_id: str,
        db: Session,
        session_id: str | None = None,
    ) -> GameStateDTO:
        """Start a new game session from a validated scenario.

        1. Loads and validates the scenario definition.
        2. Ensures parent Case and Location DB entries exist for FK integrity.
        3. Initializes starting stage, starting location, and player discovery state.
        4. Persists GameSession and initial GameEvent record in the database.
        5. Returns initial GameStateDTO.
        """
        canonical_scenario_id = self.registry.resolve_scenario_id(scenario_id)
        logger.info(
            "Starting new game session for scenario_id=%s", canonical_scenario_id
        )
        scenario = self.loader.load(canonical_scenario_id)

        # 2. Ensure parent Case DB entry exists for foreign key integrity
        db_case = db.scalar(select(Case).where(Case.id == scenario.case.id))
        if not db_case:
            db_case = Case(
                id=scenario.case.id,
                title=scenario.case.title,
                description=scenario.case.description,
                status="active",
            )
            db.add(db_case)
            db.flush()

        # Ensure Location DB entries exist for foreign key integrity
        for loc_def in scenario.locations:
            db_loc = db.scalar(select(Location).where(Location.id == loc_def.id))
            if not db_loc:
                db_loc = Location(
                    id=loc_def.id,
                    case_id=scenario.case.id,
                    name=loc_def.name,
                    description=loc_def.description,
                    is_initial_unlocked=loc_def.is_initial_unlocked,
                )
                db.add(db_loc)

        db.commit()

        # 3. Determine starting location and stage
        starting_location = next(
            (loc for loc in scenario.locations if loc.is_initial_unlocked),
            scenario.locations[0] if scenario.locations else None,
        )
        starting_loc_id = starting_location.id if starting_location else None

        sorted_stages = sorted(scenario.stages, key=lambda s: s.order)
        starting_stage = sorted_stages[0]

        # 4. Initialize player discovery state metadata
        visited_locations = [starting_loc_id] if starting_loc_id else []
        state_metadata: dict[str, Any] = {
            "scenario_id": scenario.scenario_id,
            "scenario_version": scenario.version,
            "current_stage_id": starting_stage.id,
            "current_stage_order": starting_stage.order,
            "discovered_evidence_ids": [],
            "interviewed_suspect_ids": [],
            "visited_location_ids": visited_locations,
            "completed_stage_ids": [],
        }

        sid = session_id or str(uuid.uuid4())
        session = GameSession(
            id=sid,
            case_id=scenario.case.id,
            current_location_id=starting_loc_id,
            status=SessionStatus.IN_PROGRESS.value,
            score=0,
            state_metadata=state_metadata,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Record initial START_GAME audit log event
        start_event = GameEvent(
            session_id=session.id,
            event_type="START_GAME",
            target_type="scenario",
            target_id=scenario.scenario_id,
            result_data={
                "scenario_name": scenario.name,
                "initial_location": starting_loc_id,
                "initial_stage": starting_stage.id,
            },
        )
        db.add(start_event)
        db.commit()

        logger.info(
            "Created session_id=%s scenario_id=%s initial_stage=%s initial_location=%s",
            session.id,
            scenario.scenario_id,
            starting_stage.id,
            starting_loc_id,
        )

        return self.to_game_state_dto(session)

    def get_session(self, session_id: str, db: Session) -> GameSession:
        """Fetch a GameSession by ID or raise SessionNotFoundError."""
        session = db.scalar(select(GameSession).where(GameSession.id == session_id))
        if not session:
            logger.warning(
                "Session retrieval failed: session_id=%s not found in database",
                session_id,
            )
            raise SessionNotFoundError(
                f"Game session '{session_id}' not found in database."
            )
        return session

    def to_game_state_dto(self, session: GameSession) -> GameStateDTO:
        """Convert a GameSession ORM model to player-facing GameStateDTO."""
        meta = session.state_metadata or {}
        return GameStateDTO(
            session_id=session.id,
            scenario_id=meta.get("scenario_id", ""),
            case_id=session.case_id,
            status=SessionStatus(session.status),
            current_stage_id=meta.get("current_stage_id", ""),
            current_stage_order=meta.get("current_stage_order", 1),
            current_location_id=session.current_location_id,
            discovered_evidence_ids=list(meta.get("discovered_evidence_ids", [])),
            interviewed_suspect_ids=list(meta.get("interviewed_suspect_ids", [])),
            visited_location_ids=list(meta.get("visited_location_ids", [])),
            completed_stage_ids=list(meta.get("completed_stage_ids", [])),
            score=session.score,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )
