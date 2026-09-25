"""Pydantic schemas for case solution submission and evaluation."""

from typing import Any

from pydantic import BaseModel, Field


class SolutionSubmission(BaseModel):
    """Player-submitted case resolution proposal."""

    session_id: str = Field(..., description="Active game session ID")
    culprit_id: str = Field(..., description="ID of the accused suspect")
    motive: str = Field(..., description="Proposed motive explanation")
    explanation: str = Field(
        ..., description="Narrative summary of what occurred during the crime"
    )
    supporting_evidence_ids: list[str] = Field(
        default_factory=list, description="IDs of evidence supporting the theory"
    )
    reasoning: str = Field(
        ..., description="Explanation of why evidence supports the theory"
    )
    timeline_explanation: str | None = Field(
        default=None, description="Optional reconstruction of crime timeline"
    )


class SolutionEvaluation(BaseModel):
    """Evaluated feedback and scoring result for a case solution submission."""

    culprit_correct: bool = Field(
        ..., description="Objective correctness of accused culprit"
    )
    evidence_score: int = Field(
        ..., ge=0, le=20, description="Evidence relevance score (0-20)"
    )
    motive_score: int = Field(
        ..., ge=0, le=15, description="Motive reasoning score (0-15)"
    )
    reasoning_score: int = Field(
        ..., ge=0, le=20, description="Reasoning quality score (0-20)"
    )
    timeline_score: int = Field(
        ..., ge=0, le=15, description="Timeline reconstruction score (0-15)"
    )
    overall_score: int = Field(
        ..., ge=0, le=100, description="Total weighted case score (0-100)"
    )
    strengths: list[str] = Field(
        default_factory=list, description="Key strengths of the submitted theory"
    )
    weaknesses: list[str] = Field(
        default_factory=list, description="Weaknesses or gaps in reasoning"
    )
    contradictions: list[str] = Field(
        default_factory=list, description="Contradictions with established facts"
    )
    feedback: str = Field(
        ..., description="Overall constructive detective feedback summary"
    )

    @classmethod
    def from_raw_dict(
        cls, raw: dict[str, Any], culprit_correct: bool
    ) -> "SolutionEvaluation":
        """Safely parse raw dict from Lamatic/LLM into validated SolutionEvaluation."""
        # Enforce bounds and defaults on subjective scores
        ev_score = max(0, min(20, int(raw.get("evidence_score", 10))))
        mot_score = max(0, min(15, int(raw.get("motive_score", 8))))
        reas_score = max(0, min(20, int(raw.get("reasoning_score", 10))))
        time_score = max(0, min(15, int(raw.get("timeline_score", 7))))

        culprit_score = 30 if culprit_correct else 0
        computed_overall = (
            culprit_score + ev_score + mot_score + reas_score + time_score
        )

        strengths = raw.get("strengths") or []
        if isinstance(strengths, str):
            strengths = [strengths]

        weaknesses = raw.get("weaknesses") or []
        if isinstance(weaknesses, str):
            weaknesses = [weaknesses]

        contradictions = raw.get("contradictions") or []
        if isinstance(contradictions, str):
            contradictions = [contradictions]

        feedback = raw.get("feedback") or "Evaluation complete."

        return cls(
            culprit_correct=culprit_correct,
            evidence_score=ev_score,
            motive_score=mot_score,
            reasoning_score=reas_score,
            timeline_score=time_score,
            overall_score=computed_overall,
            strengths=[str(s) for s in strengths],
            weaknesses=[str(w) for w in weaknesses],
            contradictions=[str(c) for c in contradictions],
            feedback=str(feedback),
        )
