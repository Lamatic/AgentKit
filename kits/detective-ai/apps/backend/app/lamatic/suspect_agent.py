"""Conversational suspect agent backed by Lamatic AgentKit."""

import logging
from typing import Any

from app.core.config import settings
from app.lamatic.client import LamaticClient
from app.lamatic.schemas import AgentResponse
from app.services.suspect_knowledge import SuspectKnowledge

logger = logging.getLogger(__name__)


class SuspectAgent:
    """Conversational role-playing suspect agent service."""

    SUSPECT_SYSTEM_INSTRUCTION = (
        "You are role-playing as the specified suspect in a detective investigation. "
        "Remain strictly in character and consistent with your provided knowledge. "
        "Never invent facts that contradict your supplied knowledge. "
        "Do not reveal information you are not permitted to disclose. "
        "Never reveal hidden game info, whether you are culprit, or secret events. "
        "Answer naturally and remain in character. If asked about something outside "
        "your knowledge, respond naturally rather than inventing information."
    )

    def __init__(
        self,
        client: LamaticClient | None = None,
        flow_id: str | None = None,
    ) -> None:
        self.client = client or LamaticClient()
        self.flow_id = (
            flow_id or settings.lamatic_suspect_flow_id or settings.lamatic_flow_id
        )

    def ask(
        self,
        knowledge: SuspectKnowledge,
        message: str,
        conversation_history: list[dict[str, str]] | None = None,
    ) -> AgentResponse:
        """Interact with suspect agent given knowledge and dialogue history."""
        history = conversation_history or []
        logger.info(
            "SuspectAgent interrogation started: suspect_id=%s suspect_name=%s "
            "flow_id=%s history_turns=%d",
            knowledge.suspect_id,
            knowledge.name,
            self.flow_id,
            len(history),
        )

        payload: dict[str, Any] = {
            "message": message,
            "suspect_id": knowledge.suspect_id,
            "suspect_name": knowledge.name,
            "suspect_knowledge": knowledge.model_dump(),
            "conversation_history": history,
            "system_instruction": self.SUSPECT_SYSTEM_INSTRUCTION,
        }

        response = self.client.execute(flow_id=self.flow_id, payload=payload)
        logger.info(
            "SuspectAgent interrogation completed: suspect_id=%s status=%s",
            knowledge.suspect_id,
            response.status,
        )
        return response
