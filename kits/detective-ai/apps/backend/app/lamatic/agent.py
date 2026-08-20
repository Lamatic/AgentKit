"""Application-level agent service for interacting with Lamatic AgentKit."""

import logging
from typing import Any

from app.lamatic.client import LamaticClient
from app.lamatic.schemas import AgentRequest, AgentResponse
from app.services.investigation_context import InvestigationContext

logger = logging.getLogger(__name__)


class DetectiveAgent:
    """Detective assistant agent service using Lamatic AgentKit."""

    DEFAULT_INSTRUCTION = (
        "You are a detective assistant participating in an investigation game. "
        "Analyze the provided player investigation context and answer the user's "
        "question clearly and concisely based strictly on player-visible facts."
    )

    def __init__(self, client: LamaticClient | None = None) -> None:
        self.client = client or LamaticClient()

    def ask(
        self,
        message: str,
        context: InvestigationContext | dict[str, Any] | None = None,
    ) -> AgentResponse:
        """Invoke detective assistant agent with investigation context."""
        logger.info("DetectiveAgent ask invoked: has_context=%s", context is not None)
        ctx_dict: dict[str, Any] | None = None
        if isinstance(context, InvestigationContext):
            ctx_dict = context.model_dump()
        elif isinstance(context, dict):
            ctx_dict = context

        request = AgentRequest(message=message, context=ctx_dict)

        payload: dict[str, Any] = {
            "message": request.message,
            "system_instruction": self.DEFAULT_INSTRUCTION,
        }
        if request.context:
            payload["investigation_context"] = request.context

        response = self.client.execute(payload=payload)
        logger.info("DetectiveAgent ask completed: status=%s", response.status)
        return response
