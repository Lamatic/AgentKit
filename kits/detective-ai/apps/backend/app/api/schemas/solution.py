"""Pydantic schemas for case solution submission and evaluation."""

from pydantic import BaseModel, Field


class SolveRequest(BaseModel):
    """Player payload for final case solution hypothesis submission."""

    culprit_id: str = Field(..., description="Accused culprit suspect ID or name")
    motive: str = Field(..., description="Hypothesized motive for the crime")
    evidence_ids: list[str] = Field(
        default_factory=list,
        description="List of supporting evidence IDs or names",
    )
    reasoning: str = Field(
        ...,
        description="Detective's deductive reasoning connecting evidence and suspects",
    )
    timeline: str = Field(
        ...,
        description="Detective's reconstruction of the sequence of events",
    )
    explanation: str | None = Field(
        default=None,
        description="Optional narrative summary of the crime sequence",
    )


class SolutionEvaluationBreakdown(BaseModel):
    """Rubric scoring breakdown of the detective's case hypothesis."""

    culprit_identification: int = Field(
        ..., description="Score for culprit identification (max 30)"
    )
    evidence_relevance: int = Field(
        ..., description="Score for supporting evidence relevance (max 20)"
    )
    motive_reasoning: int = Field(
        ..., description="Score for motive plausibility (max 15)"
    )
    reasoning_quality: int = Field(
        ..., description="Score for deductive reasoning quality (max 20)"
    )
    timeline_reasoning: int = Field(
        ..., description="Score for chronological timeline accuracy (max 15)"
    )


class SolveResponse(BaseModel):
    """Player-safe solution evaluation result."""

    status: str = Field(
        ..., description="Session outcome status: 'solved' or 'in_progress'"
    )
    score: int = Field(..., description="Updated total session score")
    evaluation: SolutionEvaluationBreakdown = Field(
        ..., description="Scoring breakdown across evaluation rubrics"
    )
    feedback: str = Field(
        ..., description="Constructive evaluation feedback and commentary"
    )
