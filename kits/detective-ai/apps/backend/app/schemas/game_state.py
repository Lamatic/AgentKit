"""Pydantic schemas and DTOs for player-facing game state and actions."""

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SessionStatus(StrEnum):
    """Investigation game session status enum."""

    IN_PROGRESS = "in_progress"
    SOLVED = "solved"
    FAILED = "failed"


class ActionType(StrEnum):
    """Supported deterministic game investigation action types."""

    MOVE = "move"
    INSPECT = "inspect"
    INTERVIEW = "interview"
    EXAMINE_EVIDENCE = "examine_evidence"
    ADVANCE_STAGE = "advance_stage"
    SUBMIT_SOLUTION = "submit_solution"


class GameStateDTO(BaseModel):
    """Player-facing game state representation (strictly excludes ground truth)."""

    session_id: str
    scenario_id: str
    case_id: str
    status: SessionStatus
    current_stage_id: str
    current_stage_order: int
    current_location_id: str | None = None
    discovered_evidence_ids: list[str] = Field(default_factory=list)
    interviewed_suspect_ids: list[str] = Field(default_factory=list)
    visited_location_ids: list[str] = Field(default_factory=list)
    completed_stage_ids: list[str] = Field(default_factory=list)
    score: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameActionDTO(BaseModel):
    """Input request model for executing a game action."""

    action_type: ActionType
    target_id: str | None = None
    details: dict[str, Any] | None = None

    model_config = ConfigDict(extra="forbid")


class ActionResultDTO(BaseModel):
    """Execution output result returned after an action completes."""

    success: bool
    action: ActionType
    message: str
    state: GameStateDTO
    newly_discovered_evidence: list[str] | None = None
    already_known_evidence: list[str] | None = None
    evidence_detail: dict[str, Any] | None = None
    interview_result: dict[str, Any] | None = None
    stage_unlocked: str | None = None
    solution_correct: bool | None = None

    model_config = ConfigDict(extra="forbid")
