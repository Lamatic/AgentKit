"""Scenario management package for DetectiveAI."""

from app.scenarios.exceptions import (
    ScenarioError,
    ScenarioFormatError,
    ScenarioNotFoundError,
    ScenarioValidationError,
)
from app.scenarios.loader import ScenarioLoader
from app.scenarios.registry import ScenarioRegistry
from app.scenarios.schemas import (
    CaseDefinition,
    EvidenceDefinition,
    LocationDefinition,
    PublicScenarioDefinition,
    PublicSuspectDefinition,
    PublicTimelineEventDefinition,
    ScenarioDefinition,
    SolutionDefinition,
    StageDefinition,
    SuspectDefinition,
    TimelineEventDefinition,
    VictimDefinition,
)
from app.scenarios.validator import ScenarioValidator

__all__ = [
    "ScenarioError",
    "ScenarioNotFoundError",
    "ScenarioValidationError",
    "ScenarioFormatError",
    "ScenarioDefinition",
    "PublicScenarioDefinition",
    "CaseDefinition",
    "VictimDefinition",
    "SuspectDefinition",
    "PublicSuspectDefinition",
    "LocationDefinition",
    "EvidenceDefinition",
    "TimelineEventDefinition",
    "PublicTimelineEventDefinition",
    "SolutionDefinition",
    "StageDefinition",
    "ScenarioValidator",
    "ScenarioLoader",
    "ScenarioRegistry",
]
