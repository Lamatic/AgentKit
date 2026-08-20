"""Pydantic schemas for session management, status, actions, and history."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    """Request payload to create/start a new game session."""

    scenario: str = Field(
        ...,
        description="Scenario identifier or display name",
    )


class SessionStageResponse(BaseModel):
    """Current stage details in a session."""

    id: str
    order: int
    name: str


class SessionLocationResponse(BaseModel):
    """Current location details in a session."""

    id: str | None = None
    name: str | None = None
    description: str | None = None


class SessionCreatedResponse(BaseModel):
    """Response returned upon successful game session creation."""

    session_id: str
    scenario_id: str
    case_title: str
    stage: SessionStageResponse
    status: str
    score: int = 0
    current_location: SessionLocationResponse | None = None


class ActionItem(BaseModel):
    """Generic action item with id and display name."""

    id: str
    name: str


class AvailabilityFlag(BaseModel):
    """Boolean flag indicating whether a composite action is available."""

    available: bool
    reason: str | None = None


class AvailableActionsResponse(BaseModel):
    """Player-friendly available actions currently permitted in the session."""

    move: list[ActionItem] = Field(default_factory=list)
    inspect: bool = Field(default=False)
    interrogate: list[ActionItem] = Field(default_factory=list)
    examine: list[ActionItem] = Field(default_factory=list)
    advance: AvailabilityFlag
    solve: AvailabilityFlag


class GameEventResponse(BaseModel):
    """Player-visible chronological game event record."""

    id: str
    session_id: str
    event_type: str
    target_type: str | None = None
    target_id: str | None = None
    timestamp: datetime | None = None
    result_data: dict[str, Any] | None = None


# --- PlayerInvestigationState DTO and Sub-Models ---


class CaseState(BaseModel):
    """Player-facing case metadata."""

    title: str
    description: str


class StageState(BaseModel):
    """Player-facing investigation stage info."""

    id: str
    order: int
    name: str
    description: str
    status: str


class CurrentLocationState(BaseModel):
    """Player-facing current location info."""

    id: str | None = None
    name: str | None = None
    description: str | None = None


class AvailableActionsState(BaseModel):
    """Player-facing available status of system-level actions."""

    can_inspect: bool
    can_advance: AvailabilityFlag
    can_solve: AvailabilityFlag


class AvailableLocationState(BaseModel):
    """Player-facing location with lock status."""

    id: str
    name: str
    description: str
    is_current: bool
    is_locked: bool
    lock_reason: str | None = None


class AvailableSuspectState(BaseModel):
    """Player-facing suspect with interview status."""

    id: str
    name: str
    public_description: str
    relationship_to_victim: str
    can_interrogate: bool
    already_interviewed: bool


class DiscoveredEvidenceState(BaseModel):
    """Player-facing discovered evidence with examined status."""

    id: str
    name: str
    type: str
    description: str
    location_id: str | None = None
    location_name: str | None = None
    examined: bool


class HistoryEventState(BaseModel):
    """Player-facing formatted audit event log."""

    event_type: str
    message: str
    timestamp: str | None = None


class ProgressionState(BaseModel):
    """Player-facing investigation progression and requirements details."""

    completed_stages: list[str] = Field(default_factory=list)
    remaining_requirements: list[str] = Field(default_factory=list)
    next_objective: str | None = None


class PlayerInvestigationState(BaseModel):
    """Authoritative client-facing investigation state DTO representation."""

    session_id: str
    scenario_id: str
    case: CaseState
    stage: StageState
    current_location: CurrentLocationState | None = None
    score: int
    session_status: str
    available_actions: AvailableActionsState
    available_locations: list[AvailableLocationState] = Field(default_factory=list)
    available_suspects: list[AvailableSuspectState] = Field(default_factory=list)
    discovered_evidence: list[DiscoveredEvidenceState] = Field(default_factory=list)
    investigation_history: list[HistoryEventState] = Field(default_factory=list)
    progression: ProgressionState
