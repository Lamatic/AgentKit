"""Scenario loader service for discovering, parsing, and validating scenarios."""

import json
import logging
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.scenarios.exceptions import (
    ScenarioFormatError,
    ScenarioNotFoundError,
    ScenarioValidationError,
)
from app.scenarios.schemas import ScenarioDefinition
from app.scenarios.validator import ScenarioValidator

logger = logging.getLogger(__name__)


class ScenarioLoader:
    """Service to load scenario files, parse JSON, validate schemas and integrity."""

    def __init__(self, base_dir: str | Path = "scenarios") -> None:
        target_path = Path(base_dir)
        if not target_path.is_absolute():
            target_path = Path(__file__).resolve().parents[2] / base_dir
        self.base_dir = target_path

    def load(self, scenario_id_or_path: str | Path) -> ScenarioDefinition:
        """Locate, parse, and validate a scenario by ID or filesystem path.

        Raises ScenarioNotFoundError if the scenario cannot be found.
        Raises ScenarioFormatError if JSON parsing fails.
        Raises ScenarioValidationError if validation fails.
        """
        logger.info("Loading scenario: %s", scenario_id_or_path)
        target_path = Path(scenario_id_or_path)

        if not target_path.is_absolute() and not target_path.exists():
            target_path = self.base_dir / scenario_id_or_path

        if not target_path.exists():
            logger.warning("Scenario not found at path: %s", target_path)
            raise ScenarioNotFoundError(
                f"Scenario '{scenario_id_or_path}' not found at path '{target_path}'"
            )

        data = self._read_scenario_data(target_path, scenario_id_or_path)

        # Pydantic schema validation
        try:
            scenario_def = ScenarioDefinition.model_validate(data)
        except ValidationError as err:
            logger.warning(
                "Scenario %s failed schema validation: %s", scenario_id_or_path, err
            )
            raise ScenarioValidationError(
                f"Scenario '{scenario_id_or_path}' failed schema validation:\n{err}"
            ) from err

        # Referential integrity validation
        ScenarioValidator.validate(scenario_def)

        logger.info(
            "Scenario loaded successfully: %s version=%s",
            scenario_def.scenario_id,
            scenario_def.version,
        )
        return scenario_def

    def _read_scenario_data(
        self, target_path: Path, identifier: str | Path
    ) -> dict[str, Any]:
        """Read and combine scenario JSON file(s) into a single dictionary."""
        if target_path.is_file():
            return self._load_json_file(target_path, identifier)

        if not target_path.is_dir():
            raise ScenarioNotFoundError(
                f"Scenario path '{target_path}' is neither a file nor a directory."
            )

        scenario_json_path = target_path / "scenario.json"
        if not scenario_json_path.exists():
            raise ScenarioNotFoundError(
                f"Scenario directory '{target_path}' missing primary "
                "'scenario.json' file."
            )

        base_meta = self._load_json_file(scenario_json_path, identifier)

        # If scenario.json is a self-contained full definition, use it
        required_embedded = {
            "case",
            "suspects",
            "locations",
            "evidence",
            "timeline",
            "solution",
            "stages",
        }
        if required_embedded.issubset(base_meta.keys()):
            return base_meta

        # Modular / split file scenario structure
        combined = dict(base_meta)

        split_files = {
            "case": "case.json",
            "suspects": "suspects.json",
            "locations": "locations.json",
            "evidence": "evidence.json",
            "timeline": "timeline.json",
            "solution": "solution.json",
            "stages": "stages.json",
        }

        for key, filename in split_files.items():
            if key not in combined:
                file_path = target_path / filename
                if not file_path.exists():
                    raise ScenarioValidationError(
                        f"Scenario '{identifier}' is missing required file "
                        f"'{filename}' in '{target_path}'"
                    )
                combined[key] = self._load_json_file(file_path, identifier)

        victim_file = target_path / "victim.json"
        if "victim" not in combined and victim_file.exists():
            combined["victim"] = self._load_json_file(victim_file, identifier)

        return combined

    def _load_json_file(self, filepath: Path, identifier: str | Path) -> Any:
        """Safely load and parse a JSON file."""
        logger.debug("Loading scenario file: %s", filepath)
        try:
            with open(filepath, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as err:
            logger.warning(
                "Invalid JSON syntax in file %s for scenario %s: %s",
                filepath.name,
                identifier,
                err,
            )
            raise ScenarioFormatError(
                f"Invalid JSON syntax in file '{filepath.name}' "
                f"for scenario '{identifier}': {err}"
            ) from err
        except OSError as err:
            logger.warning(
                "Failed to read file %s for scenario %s: %s",
                filepath,
                identifier,
                err,
            )
            raise ScenarioNotFoundError(
                f"Failed to read file '{filepath}' for scenario '{identifier}': {err}"
            ) from err
