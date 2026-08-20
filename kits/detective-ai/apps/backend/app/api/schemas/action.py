"""Pydantic schemas for deterministic action execution."""

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.game_state import ActionResultDTO


class ActionExecutionRequest(BaseModel):
    """Request body for executing a deterministic investigation action."""

    action: str = Field(
        ...,
        description=(
            "Action type: 'move', 'inspect', 'interview', 'examine_evidence', 'advance'"
        ),
    )
    target_id: str | None = Field(
        default=None,
        description="Target ID (e.g. location_id, suspect_id, evidence_id)",
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Optional auxiliary payload metadata",
    )


__all__ = ["ActionExecutionRequest", "ActionResultDTO"]
