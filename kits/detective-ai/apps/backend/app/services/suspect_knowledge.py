"""Player and agent-safe SuspectKnowledge model and builder."""

from typing import Any

from pydantic import BaseModel, Field

from app.core.exceptions import SuspectNotAvailableError
from app.scenarios.loader import ScenarioLoader


class SuspectKnowledge(BaseModel):
    """Player and agent-safe representation of knowledge known to a suspect."""

    suspect_id: str = Field(..., description="Unique ID of the suspect")
    name: str = Field(..., description="Full name of the suspect")
    public_description: str = Field(..., description="Public profile description")
    alibi: str | None = Field(None, description="Suspect's stated alibi")
    relationship_to_victim: str | None = Field(
        None, description="Suspect's relationship to the victim"
    )
    profile_metadata: dict[str, Any] | None = Field(
        default=None, description="Additional public metadata attributes"
    )
    known_timeline_events: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Non-secret timeline events known to or involving this suspect",
    )
    known_evidence_names: list[str] = Field(
        default_factory=list,
        description="Names of public/discovered evidence items in the case",
    )


class SuspectKnowledgeBuilder:
    """Builder for constructing explicit, player-safe SuspectKnowledge objects."""

    def __init__(self, loader: ScenarioLoader | None = None) -> None:
        self.loader = loader or ScenarioLoader()

    def resolve_suspect_id(self, scenario_id: str, identifier: str) -> str:
        """Resolve suspect ID from exact ID, exact name, or case-insensitive name."""
        if not identifier or not identifier.strip():
            raise SuspectNotAvailableError("Suspect identifier cannot be empty.")

        clean = identifier.strip()
        scenario_def = self.loader.load(scenario_id)
        public_scenario = scenario_def.to_player_view()
        suspects = public_scenario.suspects

        # 1. Exact ID match
        for s in suspects:
            if s.id == clean:
                return s.id

        # 2. Exact Name match
        name_matches = [s for s in suspects if s.name == clean]
        if len(name_matches) == 1:
            return name_matches[0].id
        elif len(name_matches) > 1:
            match_ids = ", ".join(f"{s.name} ({s.id})" for s in name_matches)
            raise SuspectNotAvailableError(
                f"Ambiguous suspect name '{identifier}'. Matches: {match_ids}"
            )

        # 3. Case-insensitive ID match
        ci_id_matches = [s for s in suspects if s.id.lower() == clean.lower()]
        if len(ci_id_matches) == 1:
            return ci_id_matches[0].id

        # 4. Case-insensitive Name match
        ci_name_matches = [s for s in suspects if s.name.lower() == clean.lower()]
        if len(ci_name_matches) == 1:
            return ci_name_matches[0].id
        elif len(ci_name_matches) > 1:
            match_ids = ", ".join(f"{s.name} ({s.id})" for s in ci_name_matches)
            raise SuspectNotAvailableError(
                f"Ambiguous suspect name '{identifier}'. Matches: {match_ids}"
            )

        avail_list = ", ".join(f"{s.name} ({s.id})" for s in suspects)
        raise SuspectNotAvailableError(
            f"Suspect '{identifier}' not found in scenario '{scenario_id}'. "
            f"Available suspects: {avail_list}"
        )

    def build_knowledge(self, scenario_id: str, suspect_id: str) -> SuspectKnowledge:
        """Construct player/agent-safe SuspectKnowledge for a suspect in a scenario."""
        canonical_suspect_id = self.resolve_suspect_id(scenario_id, suspect_id)
        scenario_def = self.loader.load(scenario_id)
        public_scenario = scenario_def.to_player_view()

        # Locate requested suspect from public scenario view (ground truth stripped)
        suspect = next(
            (s for s in public_scenario.suspects if s.id == canonical_suspect_id), None
        )
        if not suspect:
            raise SuspectNotAvailableError(
                f"Suspect '{suspect_id}' is not available in scenario '{scenario_id}'."
            )

        # Non-secret timeline events involving or relevant to this suspect
        known_events = [
            {
                "order": event.event_order,
                "description": event.description,
                "timestamp": event.timestamp_str,
            }
            for event in public_scenario.timeline
            if event.suspect_id == canonical_suspect_id or event.suspect_id is None
        ]

        # Public evidence names (excluding secret discovery metadata)
        known_evidence = [ev.name for ev in public_scenario.evidence]

        return SuspectKnowledge(
            suspect_id=suspect.id,
            name=suspect.name,
            public_description=suspect.description,
            alibi=suspect.alibi,
            relationship_to_victim=suspect.relationship_to_victim,
            profile_metadata=suspect.profile_metadata,
            known_timeline_events=known_events,
            known_evidence_names=known_evidence,
        )
