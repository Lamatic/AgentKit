"""Pydantic schemas for evidence examination API endpoints."""

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.game_state import ActionResultDTO


class AIAnalysisResponse(BaseModel):
    """Forensic AI agent analysis outcome."""

    content: str | None = Field(
        default=None, description="Generated forensic analysis content"
    )
    status: str = Field(
        ..., description="Execution status: 'success', 'unavailable', or 'error'"
    )
    error: str | None = Field(
        default=None, description="Error explanation if AI analysis was unavailable"
    )


class EvidenceExamineResponse(BaseModel):
    """Response containing deterministic game result and AI forensic analysis."""

    evidence: dict[str, Any] = Field(..., description="Player-safe evidence metadata")
    action_result: ActionResultDTO = Field(
        ..., description="Deterministic GameEngine action result"
    )
    analysis: AIAnalysisResponse = Field(..., description="AI forensic interpretation")
