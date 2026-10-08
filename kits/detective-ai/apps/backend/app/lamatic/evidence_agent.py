"""AI forensic interpretation agent service backed by Lamatic AgentKit."""

import logging
from typing import Any

from app.core.config import settings
from app.lamatic.client import LamaticClient
from app.lamatic.evidence_knowledge import EvidenceKnowledge
from app.lamatic.schemas import AgentResponse
from app.services.investigation_context import InvestigationContext

logger = logging.getLogger(__name__)


class EvidenceAgent:
    """AI forensic interpretation agent service using Lamatic AgentKit."""

    EVIDENCE_SYSTEM_INSTRUCTION = (
        "You are an experienced forensic investigator analyzing evidence. "
        "Describe observable physical and structural features of the evidence item. "
        "Identify relevant forensic details and explain plausible interpretations. "
        "Strictly distinguish direct observations from inferences. "
        "Suggest useful follow-up questions or investigative avenues. "
        "Never invent unstated facts or claim certainty beyond the evidence "
        "description, and never reveal hidden game solutions or the culprit."
    )

    def __init__(
        self,
        client: LamaticClient | None = None,
        flow_id: str | None = None,
    ) -> None:
        self.client = client or LamaticClient()
        self.flow_id = (
            flow_id or settings.lamatic_evidence_flow_id or settings.lamatic_flow_id
        )

    def ask(
        self,
        knowledge: EvidenceKnowledge,
        message: str | None = None,
        context: InvestigationContext | None = None,
    ) -> AgentResponse:
        """Perform AI forensic interpretation of an evidence item."""
        logger.info(
            "EvidenceAgent examination started: evidence_id=%s evidence_name=%s "
            "flow_id=%s has_context=%s",
            knowledge.evidence_id,
            knowledge.name,
            self.flow_id,
            context is not None,
        )

        payload: dict[str, Any] = {
            "message": message or f"Analyze evidence: {knowledge.name}",
            "evidence_id": knowledge.evidence_id,
            "evidence_name": knowledge.name,
            "evidence_knowledge": knowledge.model_dump(),
            "system_instruction": self.EVIDENCE_SYSTEM_INSTRUCTION,
        }
        if context:
            payload["investigation_context"] = context.model_dump()

        response = self.client.execute(flow_id=self.flow_id, payload=payload)
        logger.info(
            "EvidenceAgent examination completed: evidence_id=%s status=%s",
            knowledge.evidence_id,
            response.status,
        )
        return response
