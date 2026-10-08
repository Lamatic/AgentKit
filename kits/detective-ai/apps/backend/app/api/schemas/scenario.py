"""Pydantic schemas for scenario API endpoints."""

from pydantic import BaseModel, Field

from app.scenarios.schemas import PublicScenarioDefinition


class ScenarioSummaryResponse(BaseModel):
    """Player-safe scenario summary schema."""

    id: str = Field(..., description="Scenario unique identifier")
    name: str = Field(..., description="Scenario display name")
    description: str = Field(..., description="Scenario short summary")
    version: str = Field(..., description="Scenario semver version string")


__all__ = ["PublicScenarioDefinition", "ScenarioSummaryResponse"]
