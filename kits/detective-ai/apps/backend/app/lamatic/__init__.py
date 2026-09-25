"""Lamatic AgentKit integration package."""

from app.lamatic.agent import DetectiveAgent
from app.lamatic.client import LamaticClient
from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.evidence_knowledge import (
    EvidenceKnowledge,
    EvidenceKnowledgeBuilder,
)
from app.lamatic.exceptions import (
    LamaticConfigurationError,
    LamaticConnectionError,
    LamaticError,
    LamaticInvocationError,
)
from app.lamatic.schemas import AgentRequest, AgentResponse
from app.lamatic.solution_evaluator import SolutionEvaluator
from app.lamatic.suspect_agent import SuspectAgent

__all__ = [
    "AgentRequest",
    "AgentResponse",
    "DetectiveAgent",
    "EvidenceAgent",
    "EvidenceKnowledge",
    "EvidenceKnowledgeBuilder",
    "LamaticClient",
    "LamaticConfigurationError",
    "LamaticConnectionError",
    "LamaticError",
    "LamaticInvocationError",
    "SolutionEvaluator",
    "SuspectAgent",
]
