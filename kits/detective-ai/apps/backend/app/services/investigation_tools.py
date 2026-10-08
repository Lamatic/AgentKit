"""Application-level investigation tool interface delegating to GameEngine."""

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.schemas.game_state import ActionResultDTO, ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import (
    InvestigationContext,
    InvestigationContextBuilder,
)

logger = logging.getLogger(__name__)


class InvestigationTools:
    """Application-level tool interface for reading state and delegating actions."""

    def __init__(
        self,
        engine: GameEngine | None = None,
        context_builder: InvestigationContextBuilder | None = None,
    ) -> None:
        self.engine = engine or GameEngine()
        self.context_builder = context_builder or InvestigationContextBuilder()

    # --- READ TOOLS ---

    def get_investigation_state(
        self, session_id: str, db: Session
    ) -> InvestigationContext:
        """Fetch player-safe explicit investigation context."""
        logger.info(
            "Investigation tool invoked: get_investigation_state session_id=%s",
            session_id,
        )
        return self.context_builder.build_context(session_id, db=db)

    def get_visible_evidence(
        self, session_id: str, db: Session
    ) -> list[dict[str, Any]]:
        """Fetch list of evidence items discovered by the player in this session."""
        logger.info(
            "Investigation tool invoked: get_visible_evidence session_id=%s", session_id
        )
        ctx = self.get_investigation_state(session_id, db=db)
        return ctx.discovered_evidence

    def get_visible_suspects(
        self, session_id: str, db: Session
    ) -> list[dict[str, Any]]:
        """Fetch public profile summaries for all suspects in scenario."""
        logger.info(
            "Investigation tool invoked: get_visible_suspects session_id=%s", session_id
        )
        ctx = self.get_investigation_state(session_id, db=db)
        return ctx.public_suspects

    def get_visible_locations(
        self, session_id: str, db: Session
    ) -> list[dict[str, str]]:
        """Fetch list of currently unlocked/accessible locations."""
        logger.info(
            "Investigation tool invoked: get_visible_locations session_id=%s",
            session_id,
        )
        ctx = self.get_investigation_state(session_id, db=db)
        return ctx.available_locations

    def get_investigation_history(
        self, session_id: str, db: Session
    ) -> list[dict[str, Any]]:
        """Fetch chronological event audit history for this session."""
        logger.info(
            "Investigation tool invoked: get_investigation_history session_id=%s",
            session_id,
        )
        ctx = self.get_investigation_state(session_id, db=db)
        return ctx.investigation_history

    # --- ACTION TOOLS (Delegated strictly to GameEngine) ---

    def move_to_location(
        self, session_id: str, location_id: str, db: Session
    ) -> ActionResultDTO:
        """Delegate MOVE action to GameEngine."""
        logger.info(
            "Investigation tool invoked: move_to_location session_id=%s location_id=%s",
            session_id,
            location_id,
        )
        action = GameActionDTO(action_type=ActionType.MOVE, target_id=location_id)
        return self.engine.execute_action(session_id, action, db=db)

    def inspect_location(self, session_id: str, db: Session) -> ActionResultDTO:
        """Delegate INSPECT action to GameEngine."""
        logger.info(
            "Investigation tool invoked: inspect_location session_id=%s", session_id
        )
        action = GameActionDTO(action_type=ActionType.INSPECT)
        return self.engine.execute_action(session_id, action, db=db)

    def interview_suspect(
        self, session_id: str, suspect_id: str, db: Session
    ) -> ActionResultDTO:
        """Delegate INTERVIEW action to GameEngine."""
        logger.info(
            "Investigation tool invoked: interview_suspect session_id=%s suspect_id=%s",
            session_id,
            suspect_id,
        )
        action = GameActionDTO(action_type=ActionType.INTERVIEW, target_id=suspect_id)
        return self.engine.execute_action(session_id, action, db=db)

    def examine_evidence(
        self, session_id: str, evidence_id: str, db: Session
    ) -> ActionResultDTO:
        """Delegate EXAMINE_EVIDENCE action to GameEngine."""
        logger.info(
            "Investigation tool invoked: examine_evidence session_id=%s evidence_id=%s",
            session_id,
            evidence_id,
        )
        action = GameActionDTO(
            action_type=ActionType.EXAMINE_EVIDENCE, target_id=evidence_id
        )
        return self.engine.execute_action(session_id, action, db=db)

    def advance_stage(self, session_id: str, db: Session) -> ActionResultDTO:
        """Delegate ADVANCE_STAGE action to GameEngine."""
        logger.info(
            "Investigation tool invoked: advance_stage session_id=%s", session_id
        )
        action = GameActionDTO(action_type=ActionType.ADVANCE_STAGE)
        return self.engine.execute_action(session_id, action, db=db)
