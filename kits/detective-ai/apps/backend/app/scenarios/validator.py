"""Scenario validation service enforcing cross-reference integrity and structure."""

import re

from app.scenarios.exceptions import ScenarioValidationError
from app.scenarios.schemas import ScenarioDefinition

SEMVER_REGEX = re.compile(r"^\d+\.\d+\.\d+$")


class ScenarioValidator:
    """Validator for scenario structural integrity and cross-entity references."""

    @staticmethod
    def validate(scenario: ScenarioDefinition) -> None:
        """Validate ScenarioDefinition for structural and referential integrity.

        Raises ScenarioValidationError if any validation check fails.
        """
        # 1. Version validation
        if not SEMVER_REGEX.match(scenario.version):
            raise ScenarioValidationError(
                "Scenario validation failed: invalid scenario version "
                f"'{scenario.version}'. Version must follow semver format (X.Y.Z)"
            )

        # 2. Entity existence checks
        if not scenario.suspects:
            raise ScenarioValidationError(
                "Scenario validation failed: scenario must contain at least 1 suspect."
            )
        if not scenario.locations:
            raise ScenarioValidationError(
                "Scenario validation failed: scenario must contain at least 1 location."
            )
        if not scenario.stages:
            raise ScenarioValidationError(
                "Scenario validation failed: scenario must contain at least 1 stage."
            )

        # 3. Collect IDs and check duplicate IDs
        suspect_ids: set[str] = set()
        for s in scenario.suspects:
            if s.id in suspect_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: duplicate suspect ID found '{s.id}'"
                )
            suspect_ids.add(s.id)

        location_ids: set[str] = set()
        for loc in scenario.locations:
            if loc.id in location_ids:
                raise ScenarioValidationError(
                    "Scenario validation failed: duplicate location ID "
                    f"found '{loc.id}'"
                )
            location_ids.add(loc.id)

        evidence_ids: set[str] = set()
        for ev in scenario.evidence:
            if ev.id in evidence_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: duplicate evidence ID found '{ev.id}'"
                )
            evidence_ids.add(ev.id)

        timeline_ids: set[str] = set()
        for t in scenario.timeline:
            if t.id in timeline_ids:
                raise ScenarioValidationError(
                    "Scenario validation failed: duplicate timeline event ID "
                    f"found '{t.id}'"
                )
            timeline_ids.add(t.id)

        stage_ids: set[str] = set()
        stage_orders: set[int] = set()
        for st in scenario.stages:
            if st.id in stage_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: duplicate stage ID found '{st.id}'"
                )
            if st.order in stage_orders:
                raise ScenarioValidationError(
                    "Scenario validation failed: duplicate stage order "
                    f"found '{st.order}'"
                )
            stage_ids.add(st.id)
            stage_orders.add(st.order)

        # 4. Solution reference validation
        culprit_id = scenario.solution.culprit_id
        if culprit_id not in suspect_ids:
            raise ScenarioValidationError(
                f"Scenario validation failed: solution culprit_id '{culprit_id}' "
                "references unknown suspect"
            )

        culprit_suspect = next(s for s in scenario.suspects if s.id == culprit_id)
        if not culprit_suspect.is_culprit:
            raise ScenarioValidationError(
                f"Scenario validation failed: solution culprit_id '{culprit_id}' "
                f"references suspect '{culprit_suspect.name}' whose is_culprit flag "
                "is False"
            )

        for req_ev_id in scenario.solution.required_evidence_ids:
            if req_ev_id not in evidence_ids:
                raise ScenarioValidationError(
                    "Scenario validation failed: solution required evidence "
                    f"'{req_ev_id}' references unknown evidence"
                )

        # 5. Evidence location references
        for ev in scenario.evidence:
            if ev.location_id and ev.location_id not in location_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: evidence '{ev.id}' "
                    f"references unknown location '{ev.location_id}'"
                )

        # 6. Timeline references
        for t in scenario.timeline:
            if t.location_id and t.location_id not in location_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: timeline event '{t.id}' "
                    f"references unknown location '{t.location_id}'"
                )
            if t.suspect_id and t.suspect_id not in suspect_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: timeline event '{t.id}' "
                    f"references unknown suspect '{t.suspect_id}'"
                )
            if t.evidence_id and t.evidence_id not in evidence_ids:
                raise ScenarioValidationError(
                    f"Scenario validation failed: timeline event '{t.id}' "
                    f"references unknown evidence '{t.evidence_id}'"
                )

        # 7. Stage requirements validation
        for stage in scenario.stages:
            if not stage.requirements:
                continue

            reqs = stage.requirements
            req_ev_list = reqs.get("required_evidence_ids") or reqs.get(
                "evidence_ids", []
            )
            if isinstance(req_ev_list, list):
                for req_ev_id in req_ev_list:
                    if req_ev_id not in evidence_ids:
                        raise ScenarioValidationError(
                            f"Scenario validation failed: stage '{stage.id}' "
                            f"requirement references unknown evidence '{req_ev_id}'"
                        )

            req_loc_list = reqs.get("required_location_ids") or reqs.get(
                "location_ids", []
            )
            if isinstance(req_loc_list, list):
                for req_loc_id in req_loc_list:
                    if req_loc_id not in location_ids:
                        raise ScenarioValidationError(
                            f"Scenario validation failed: stage '{stage.id}' "
                            f"requirement references unknown location '{req_loc_id}'"
                        )

            req_sus_list = reqs.get("required_suspect_ids") or reqs.get(
                "suspect_ids", []
            )
            if isinstance(req_sus_list, list):
                for req_sus_id in req_sus_list:
                    if req_sus_id not in suspect_ids:
                        raise ScenarioValidationError(
                            f"Scenario validation failed: stage '{stage.id}' "
                            f"requirement references unknown suspect '{req_sus_id}'"
                        )
