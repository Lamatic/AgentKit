"""Scenario registry for discovering available scenarios dynamically."""

import logging
from pathlib import Path
from typing import Any

from app.scenarios.exceptions import (
    ScenarioNotFoundError,
    ScenarioValidationError,
)
from app.scenarios.loader import ScenarioLoader
from app.scenarios.schemas import ScenarioDefinition

logger = logging.getLogger(__name__)


class ScenarioRegistry:
    """Registry to discover and list available scenarios in the workspace."""

    def __init__(self, base_dir: str | Path = "scenarios") -> None:
        target_path = Path(base_dir)
        if not target_path.is_absolute():
            target_path = Path(__file__).resolve().parents[2] / base_dir
        self.base_dir = target_path
        self.loader = ScenarioLoader(self.base_dir)

    def list_scenarios(self) -> list[dict[str, Any]]:
        """Scan the scenario base directory and return summaries of valid scenarios.

        Returns a list of dictionaries, each containing:
        - id
        - name
        - version
        - description
        """
        logger.info("Scanning for scenarios in directory: %s", self.base_dir)
        if not self.base_dir.exists() or not self.base_dir.is_dir():
            logger.warning(
                "Scenario directory %s does not exist or is not a directory",
                self.base_dir,
            )
            return []

        scenarios: list[dict[str, Any]] = []

        for entry in sorted(self.base_dir.iterdir()):
            if not entry.is_dir():
                continue

            try:
                scenario_def = self.loader.load(entry.name)
                scenarios.append(
                    {
                        "id": scenario_def.scenario_id,
                        "name": scenario_def.name,
                        "version": scenario_def.version,
                        "description": scenario_def.description,
                    }
                )
            except Exception as err:
                logger.debug(
                    "Skipping invalid scenario directory %s: %s", entry.name, err
                )
                continue

        logger.info("Discovered %d scenario(s)", len(scenarios))
        return scenarios

    def get_scenario(self, scenario_id: str) -> ScenarioDefinition:
        """Retrieve and return a validated ScenarioDefinition by ID."""
        logger.info("Retrieving scenario by id: %s", scenario_id)
        return self.loader.load(scenario_id)

    def resolve_scenario_id(self, identifier: str) -> str:
        """Resolve scenario ID from exact ID, exact name, or case-insensitive name.

        Resolution order:
        1. Exact scenario ID match.
        2. Exact scenario display/name match.
        3. Case-insensitive scenario ID match.
        4. Case-insensitive scenario display/name match.

        Raises:
            ScenarioNotFoundError: If no matching scenario is found.
            ScenarioValidationError: If identifier matches multiple scenarios.
        """
        if not identifier or not identifier.strip():
            raise ScenarioNotFoundError("Scenario identifier cannot be empty.")

        clean_id = identifier.strip()
        scenarios = self.list_scenarios()

        # 1. Exact scenario ID match
        for s in scenarios:
            if s["id"] == clean_id:
                return s["id"]

        # 2. Exact scenario display/name match
        name_matches = [s for s in scenarios if s["name"] == clean_id]
        if len(name_matches) == 1:
            return name_matches[0]["id"]
        elif len(name_matches) > 1:
            match_ids = ", ".join(s["id"] for s in name_matches)
            raise ScenarioValidationError(
                f"Ambiguous scenario name '{identifier}'. "
                f"Matches multiple scenarios: {match_ids}"
            )

        # 3. Case-insensitive scenario ID match
        ci_id_matches = [s for s in scenarios if s["id"].lower() == clean_id.lower()]
        if len(ci_id_matches) == 1:
            return ci_id_matches[0]["id"]

        # Fallback for custom temporary directories not discovered by list_scenarios
        if (self.base_dir / clean_id).is_dir():
            try:
                loaded = self.loader.load(clean_id)
                return loaded.scenario_id
            except Exception:
                pass

        if not scenarios:
            raise ScenarioNotFoundError(
                f"No scenarios available in '{self.base_dir}'. "
                f"Cannot resolve '{identifier}'."
            )

        # 4. Case-insensitive scenario display/name match
        ci_name_matches = [
            s for s in scenarios if s["name"].lower() == clean_id.lower()
        ]
        if len(ci_name_matches) == 1:
            return ci_name_matches[0]["id"]
        elif len(ci_name_matches) > 1:
            match_ids = ", ".join(s["id"] for s in ci_name_matches)
            raise ScenarioValidationError(
                f"Ambiguous scenario name '{identifier}'. "
                f"Matches multiple scenarios: {match_ids}"
            )

        # No match found - construct helpful error message
        avail_list = ", ".join(f"{s['name']} ({s['id']})" for s in scenarios)
        raise ScenarioNotFoundError(
            f"Scenario '{identifier}' not found. Available scenarios: {avail_list}"
        )
