"""Pydantic schemas for scenario input definitions and ground-truth separation."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CaseDefinition(BaseModel):
    """Case metadata input definition."""

    id: str
    title: str
    description: str

    model_config = ConfigDict(extra="forbid")


class VictimDefinition(BaseModel):
    """Victim input definition."""

    id: str
    name: str
    description: str
    cause_of_death: str | None = None
    time_of_death: str | None = None
    notes: str | None = None
    metadata: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class SuspectDefinition(BaseModel):
    """Suspect input definition containing public profile and ground-truth info."""

    id: str
    name: str
    description: str
    alibi: str | None = None
    relationship_to_victim: str | None = None
    profile_metadata: dict[str, Any] | None = None
    is_culprit: bool = False
    motive: str | None = None

    model_config = ConfigDict(extra="forbid")


class PublicSuspectDefinition(BaseModel):
    """Player-facing suspect view stripped of ground-truth solution information."""

    id: str
    name: str
    description: str
    alibi: str | None = None
    relationship_to_victim: str | None = None
    profile_metadata: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class LocationDefinition(BaseModel):
    """Location input definition."""

    id: str
    name: str
    description: str
    is_initial_unlocked: bool = True
    metadata: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class EvidenceDefinition(BaseModel):
    """Evidence input definition."""

    id: str
    name: str
    description: str
    evidence_type: str = "physical"
    location_id: str | None = None
    discovery_metadata: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class TimelineEventDefinition(BaseModel):
    """Timeline event input definition."""

    id: str
    event_order: int
    description: str
    timestamp_str: str | None = None
    location_id: str | None = None
    suspect_id: str | None = None
    evidence_id: str | None = None
    is_secret: bool = False
    details: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class PublicTimelineEventDefinition(BaseModel):
    """Player-facing timeline event view stripped of secret metadata."""

    id: str
    event_order: int
    description: str
    timestamp_str: str | None = None
    location_id: str | None = None
    suspect_id: str | None = None
    evidence_id: str | None = None

    model_config = ConfigDict(extra="forbid")


class SolutionDefinition(BaseModel):
    """Authoritative ground-truth solution definition."""

    culprit_id: str
    solution_summary: str
    required_evidence_ids: list[str] = Field(default_factory=list)
    ground_truth_data: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class StageDefinition(BaseModel):
    """Investigation stage input definition."""

    id: str
    name: str
    description: str
    order: int
    requirements: dict[str, Any] | None = None
    status: str = "available"

    model_config = ConfigDict(extra="forbid")


class PublicScenarioDefinition(BaseModel):
    """Player-facing scenario definition excluding all ground-truth solutions."""

    scenario_id: str
    name: str
    description: str
    version: str
    case: CaseDefinition
    victim: VictimDefinition | None = None
    suspects: list[PublicSuspectDefinition]
    locations: list[LocationDefinition]
    evidence: list[EvidenceDefinition]
    timeline: list[PublicTimelineEventDefinition]
    stages: list[StageDefinition]

    model_config = ConfigDict(extra="forbid")


class ScenarioDefinition(BaseModel):
    """Authoritative full scenario definition (input model for scenario loading)."""

    scenario_id: str
    name: str
    description: str
    version: str
    case: CaseDefinition
    victim: VictimDefinition | None = None
    suspects: list[SuspectDefinition]
    locations: list[LocationDefinition]
    evidence: list[EvidenceDefinition]
    timeline: list[TimelineEventDefinition]
    solution: SolutionDefinition
    stages: list[StageDefinition]

    model_config = ConfigDict(extra="forbid")

    def to_player_view(self) -> PublicScenarioDefinition:
        """Export player-facing scenario definition omitting ground-truth details."""
        public_suspects = [
            PublicSuspectDefinition(
                id=s.id,
                name=s.name,
                description=s.description,
                alibi=s.alibi,
                relationship_to_victim=s.relationship_to_victim,
                profile_metadata=s.profile_metadata,
            )
            for s in self.suspects
        ]

        public_timeline = [
            PublicTimelineEventDefinition(
                id=t.id,
                event_order=t.event_order,
                description=t.description,
                timestamp_str=t.timestamp_str,
                location_id=t.location_id,
                suspect_id=t.suspect_id,
                evidence_id=t.evidence_id,
            )
            for t in self.timeline
            if not t.is_secret
        ]

        return PublicScenarioDefinition(
            scenario_id=self.scenario_id,
            name=self.name,
            description=self.description,
            version=self.version,
            case=self.case,
            victim=self.victim,
            suspects=public_suspects,
            locations=self.locations,
            evidence=self.evidence,
            timeline=public_timeline,
            stages=self.stages,
        )
