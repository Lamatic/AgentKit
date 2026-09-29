"""Player-safe EvidenceKnowledge model and builder for AI forensic analysis."""

from typing import Any

from pydantic import BaseModel, Field

from app.core.exceptions import EvidenceNotFoundError
from app.scenarios.loader import ScenarioLoader


class EvidenceKnowledge(BaseModel):
    """Player-safe representation of evidence information for AI forensic analysis."""

    evidence_id: str = Field(..., description="Unique ID of the evidence item")
    name: str = Field(..., description="Name of the evidence item")
    description: str = Field(
        ..., description="Detailed description of the evidence item"
    )
    evidence_type: str = Field(
        ..., description="Type/category of evidence (e.g., physical, digital)"
    )
    location_id: str | None = Field(
        None, description="Location ID where evidence was found"
    )
    location_name: str | None = Field(
        None, description="Name of location where evidence was found"
    )
    discovery_metadata: dict[str, Any] | None = Field(
        default=None, description="Player-visible discovery metadata attributes"
    )


class EvidenceKnowledgeBuilder:
    """Builder for constructing explicit, player-safe EvidenceKnowledge objects."""

    def __init__(self, loader: ScenarioLoader | None = None) -> None:
        self.loader = loader or ScenarioLoader()

    def resolve_evidence_id(self, scenario_id: str, identifier: str) -> str:
        """Resolve evidence ID from exact ID, exact name, or case-insensitive name."""
        if not identifier or not identifier.strip():
            raise EvidenceNotFoundError("Evidence identifier cannot be empty.")

        clean = identifier.strip()
        scenario_def = self.loader.load(scenario_id)
        public_scenario = scenario_def.to_player_view()
        evidence_list = public_scenario.evidence

        # 1. Exact ID match
        for ev in evidence_list:
            if ev.id == clean:
                return ev.id

        # 2. Exact Name match
        name_matches = [ev for ev in evidence_list if ev.name == clean]
        if len(name_matches) == 1:
            return name_matches[0].id
        elif len(name_matches) > 1:
            match_ids = ", ".join(f"{ev.name} ({ev.id})" for ev in name_matches)
            raise EvidenceNotFoundError(
                f"Ambiguous evidence name '{identifier}'. Matches: {match_ids}"
            )

        # 3. Case-insensitive ID match
        ci_id_matches = [ev for ev in evidence_list if ev.id.lower() == clean.lower()]
        if len(ci_id_matches) == 1:
            return ci_id_matches[0].id

        # 4. Case-insensitive Name match
        ci_name_matches = [
            ev for ev in evidence_list if ev.name.lower() == clean.lower()
        ]
        if len(ci_name_matches) == 1:
            return ci_name_matches[0].id
        elif len(ci_name_matches) > 1:
            match_ids = ", ".join(f"{ev.name} ({ev.id})" for ev in ci_name_matches)
            raise EvidenceNotFoundError(
                f"Ambiguous evidence name '{identifier}'. Matches: {match_ids}"
            )

        avail_list = ", ".join(f"{ev.name} ({ev.id})" for ev in evidence_list)
        raise EvidenceNotFoundError(
            f"Evidence '{identifier}' not found in scenario '{scenario_id}'. "
            f"Available evidence: {avail_list}"
        )

    def build_knowledge(self, scenario_id: str, evidence_id: str) -> EvidenceKnowledge:
        """Construct player-safe EvidenceKnowledge for an evidence item."""
        canonical_evidence_id = self.resolve_evidence_id(scenario_id, evidence_id)
        scenario_def = self.loader.load(scenario_id)
        public_scenario = scenario_def.to_player_view()

        # Locate requested evidence from public scenario view (ground truth stripped)
        evidence = next(
            (ev for ev in public_scenario.evidence if ev.id == canonical_evidence_id),
            None,
        )
        if not evidence:
            raise EvidenceNotFoundError(
                f"Evidence '{evidence_id}' does not exist in scenario '{scenario_id}'."
            )

        # Determine location name if location_id is present
        loc_name = None
        if evidence.location_id:
            found_loc = next(
                (
                    loc
                    for loc in public_scenario.locations
                    if loc.id == evidence.location_id
                ),
                None,
            )
            if found_loc:
                loc_name = found_loc.name

        return EvidenceKnowledge(
            evidence_id=evidence.id,
            name=evidence.name,
            description=evidence.description,
            evidence_type=evidence.evidence_type,
            location_id=evidence.location_id,
            location_name=loc_name,
            discovery_metadata=evidence.discovery_metadata,
        )
