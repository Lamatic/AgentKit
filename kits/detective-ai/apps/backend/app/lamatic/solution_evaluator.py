"""SolutionEvaluator service for evaluating player solution reasoning using Lamatic."""

import json
import logging
from typing import Any

from app.core.config import settings
from app.lamatic.client import LamaticClient
from app.lamatic.schemas import AgentResponse
from app.scenarios.schemas import PublicScenarioDefinition
from app.schemas.solution_evaluation import SolutionEvaluation, SolutionSubmission
from app.services.investigation_context import InvestigationContext

logger = logging.getLogger(__name__)


class SolutionEvaluator:
    """Evaluates player solution submissions via Lamatic AgentKit."""

    SOLUTION_SYSTEM_INSTRUCTION = (
        "You are a master detective judge reviewing a player's case solution theory. "
        "Evaluate the player's evidence selection, motive, reasoning, "
        "and timeline reconstruction against established public facts. "
        "Provide numeric sub-scores for evidence (0-20), motive (0-15), "
        "reasoning (0-20), and timeline (0-15). "
        "Highlight clear strengths, weaknesses, and any logical contradictions. "
        "Write a constructive detective feedback summary. "
        "Never reveal hidden ground-truth solutions or state unestablished facts."
    )

    def __init__(
        self,
        client: LamaticClient | None = None,
        flow_id: str | None = None,
    ) -> None:
        self.client = client or LamaticClient()
        self.flow_id = (
            flow_id or settings.lamatic_solution_flow_id or settings.lamatic_flow_id
        )

    def evaluate(
        self,
        submission: SolutionSubmission,
        player_scenario: PublicScenarioDefinition,
        objective_culprit_correct: bool,
        context: InvestigationContext | None = None,
    ) -> SolutionEvaluation:
        """Evaluate player solution submission using Lamatic AI flow."""
        logger.info(
            "SolutionEvaluator evaluation started: session_id=%s scenario_name=%s "
            "flow_id=%s objective_correct=%s",
            submission.session_id,
            player_scenario.name,
            self.flow_id,
            objective_culprit_correct,
        )

        # Construct explicit player-safe payload (strictly NO ground truth)
        payload: dict[str, Any] = {
            "submission": submission.model_dump(),
            "objective_culprit_correct": objective_culprit_correct,
            "scenario_name": player_scenario.name,
            "public_suspects": [
                {
                    "suspect_id": s.id,
                    "name": s.name,
                    "description": s.description,
                    "alibi": s.alibi,
                    "relationship_to_victim": s.relationship_to_victim,
                }
                for s in player_scenario.suspects
            ],
            "public_evidence": [
                {
                    "evidence_id": e.id,
                    "name": e.name,
                    "description": e.description,
                    "evidence_type": e.evidence_type,
                }
                for e in player_scenario.evidence
            ],
            "public_timeline": [
                {
                    "event_id": t.id,
                    "timestamp": t.timestamp_str,
                    "description": t.description,
                }
                for t in player_scenario.timeline
            ],
            "system_instruction": self.SOLUTION_SYSTEM_INSTRUCTION,
        }

        if context:
            payload["investigation_context"] = context.model_dump()

        response: AgentResponse = self.client.execute(
            flow_id=self.flow_id, payload=payload
        )

        raw_json = self._parse_response_content(response.content)
        evaluation = SolutionEvaluation.from_raw_dict(
            raw_json, culprit_correct=objective_culprit_correct
        )
        logger.info(
            "SolutionEvaluator evaluation completed: session_id=%s overall_score=%d "
            "evidence_score=%d motive_score=%d reasoning_score=%d timeline_score=%d",
            submission.session_id,
            evaluation.overall_score,
            evaluation.evidence_score,
            evaluation.motive_score,
            evaluation.reasoning_score,
            evaluation.timeline_score,
        )
        return evaluation

    @staticmethod
    def _parse_response_content(content: str) -> dict[str, Any]:
        """Safely extract JSON dictionary from model response content."""
        if not content:
            return {}

        clean_text = content.strip()

        # Extract markdown fenced JSON if present
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(clean_text)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

        # Fallback if raw text returned instead of JSON
        return {
            "evidence_score": 12,
            "motive_score": 10,
            "reasoning_score": 12,
            "timeline_score": 8,
            "feedback": content,
            "strengths": ["Submitted complete case theory."],
        }
