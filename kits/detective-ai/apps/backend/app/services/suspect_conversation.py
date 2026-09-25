"""Session and suspect-scoped conversation manager for AI interrogations."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.lamatic.schemas import AgentResponse
from app.lamatic.suspect_agent import SuspectAgent
from app.models.game_event import GameEvent
from app.services.suspect_knowledge import SuspectKnowledge

logger = logging.getLogger(__name__)


class SuspectConversationManager:
    """Manages multi-turn suspect interrogations and persistent conversation history."""

    def __init__(self, agent: SuspectAgent | None = None) -> None:
        self.agent = agent or SuspectAgent()

    def get_conversation_history(
        self, session_id: str, suspect_id: str, db: Session
    ) -> list[dict[str, str]]:
        """Fetch past conversation turns for a suspect in a session from audit log."""
        events = db.scalars(
            select(GameEvent)
            .where(
                GameEvent.session_id == session_id,
                GameEvent.target_type == "suspect",
                GameEvent.target_id == suspect_id,
                GameEvent.event_type == "INTERVIEW_DIALOGUE",
            )
            .order_by(GameEvent.timestamp)
        ).all()

        history: list[dict[str, str]] = []
        for e in events:
            data = e.result_data or {}
            if "user_message" in data:
                history.append({"role": "user", "content": data["user_message"]})
            if "suspect_response" in data:
                history.append({"role": "suspect", "content": data["suspect_response"]})

        return history

    def ask_suspect(
        self,
        session_id: str,
        knowledge: SuspectKnowledge,
        user_message: str,
        db: Session,
    ) -> AgentResponse:
        """Send question to suspect agent, append turn to history, and record event."""
        history = self.get_conversation_history(session_id, knowledge.suspect_id, db=db)
        logger.info(
            "Suspect conversation turn started: session_id=%s "
            "suspect_id=%s past_turns=%d",
            session_id,
            knowledge.suspect_id,
            len(history),
        )

        response = self.agent.ask(
            knowledge=knowledge,
            message=user_message,
            conversation_history=history,
        )

        # Log dialogue turn into GameEvent audit log for persistence
        dialogue_event = GameEvent(
            session_id=session_id,
            event_type="INTERVIEW_DIALOGUE",
            target_type="suspect",
            target_id=knowledge.suspect_id,
            result_data={
                "user_message": user_message,
                "suspect_response": response.content,
            },
        )
        db.add(dialogue_event)
        db.commit()

        logger.info(
            "Suspect conversation turn completed: session_id=%s "
            "suspect_id=%s status=%s",
            session_id,
            knowledge.suspect_id,
            response.status,
        )

        return response
