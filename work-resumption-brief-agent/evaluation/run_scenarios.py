import json
import os
import sys
from datetime import datetime, timezone

from src.agent import WorkResumptionAgent


EVALUATION_REFERENCE_TIME = datetime(
    2024,
    9,
    4,
    tzinfo=timezone.utc,
)


class EvaluationRunner:
    """Run all evaluation scenarios and measure results."""

    def __init__(self):
        self.agent = WorkResumptionAgent()
        self.results = []

    def run_all_scenarios(self):
        """Run all scenario JSON files."""

        self.results = []
        scenario_dir = "scenarios"

        if not os.path.exists(scenario_dir):
            print(
                f"ERROR: Scenarios directory "
                f"'{scenario_dir}' does not exist"
            )
            return []

        scenario_files = sorted(
            file_name
            for file_name in os.listdir(scenario_dir)
            if file_name.endswith(".json")
        )

        if not scenario_files:
            print(
                f"ERROR: No scenario JSON files found "
                f"in '{scenario_dir}'"
            )
            return []

        for scenario_file in scenario_files:
            file_path = os.path.join(
                scenario_dir,
                scenario_file,
            )

            try:
                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                ) as file:
                    scenario = json.load(file)

            except json.JSONDecodeError as error:
                result = {
                    "scenario": scenario_file,
                    "file": scenario_file,
                    "status": "FAIL",
                    "error": (
                        f"Invalid JSON in scenario file: {error}"
                    ),
                    "score": 0.0,
                }
                self.results.append(result)

                print(
                    f"ERROR: Invalid JSON in "
                    f"'{scenario_file}': {error}"
                )
                continue

            except OSError as error:
                result = {
                    "scenario": scenario_file,
                    "file": scenario_file,
                    "status": "FAIL",
                    "error": (
                        f"Unable to read scenario file: {error}"
                    ),
                    "score": 0.0,
                }
                self.results.append(result)

                print(
                    f"ERROR: Unable to read "
                    f"'{scenario_file}': {error}"
                )
                continue

            result = self.run_scenario(
                scenario,
                scenario_file,
            )
            self.results.append(result)

        return self.results

    def run_scenario(self, scenario, filename):
        """Run one scenario and calculate its score."""

        scenario_name = filename

        try:
            if not isinstance(scenario, dict):
                raise ValueError(
                    "Scenario content must be a JSON object"
                )

            metadata = scenario.get("metadata") or {}

            if not isinstance(metadata, dict):
                raise ValueError(
                    "Scenario metadata must be a dictionary"
                )

            scenario_name = metadata.get("name", filename)

            brief = self.agent.process(
                scenario["inputs"],
                reference_time=EVALUATION_REFERENCE_TIME,
            )

            expected = scenario.get("expected_outputs", {})

            score = self._calculate_score(
                brief,
                expected,
            )

            return {
                "scenario": scenario_name,
                "file": filename,
                "status": (
                    "PASS"
                    if score == 1.0
                    else "PARTIAL"
                ),
                "score": score,
                "brief_summary": self._summarize_brief(
                    brief
                ),
            }

        except Exception as error:
            return {
                "scenario": scenario_name,
                "file": filename,
                "status": "FAIL",
                "error": str(error),
                "score": 0.0,
            }

    def _calculate_score(self, brief, expected):
        """Calculate the percentage of satisfied criteria."""

        if not expected:
            return 0.0

        if not isinstance(expected, dict):
            return 0.0

        correct = 0

        for key, expected_value in expected.items():
            if self._check_criterion(
                brief,
                key,
                expected_value,
            ):
                correct += 1

        return correct / len(expected)

    def _check_criterion(
        self,
        brief,
        key,
        expected_value,
    ):
        """Check one expected criterion."""

        if key == "conflicts_detected":
            return len(brief.conflicts) == expected_value

        if key == "state_complete":
            actual_value = any(
                state.state.value == "complete"
                for state in brief.current_state
            )
            return actual_value == bool(expected_value)

        if key == "confidence_overall_min":
            return (
                brief.confidence_overall >= expected_value
            )

        if key == "confidence_level":
            if expected_value == "LOW":
                return brief.confidence_overall < 50

            if expected_value == "MEDIUM":
                return (
                    50
                    <= brief.confidence_overall
                    < 80
                )

            if expected_value == "HIGH":
                return brief.confidence_overall >= 80

            return False

        if key == "confidence_max":
            return brief.confidence_overall <= expected_value

        if key == "confidence_overall_max":
            return brief.confidence_overall <= expected_value

        if key == "blocker_identified":
            actual_value = len(brief.blockers) > 0
            return actual_value == bool(expected_value)

        if key == "blockers_count_min":
            return len(brief.blockers) >= expected_value

        if key == "actions_generated_min":
            return len(brief.actions) >= expected_value

        if key == "sources_count":
            return len(brief.evidence) == expected_value

        if key == "state":
            allowed_states = [
                state.strip().lower()
                for state in expected_value.split(" or ")
            ]

            actual_states = [
                state.state.value.lower()
                for state in brief.current_state
            ]

            return any(
                expected_state in actual_states
                for expected_state in allowed_states
            )

        if key == "recommended_action":
            expected_options = [
                option.strip().lower()
                for option in expected_value.split(" or ")
            ]

            if not brief.recommended_first_action:
                return "none" in expected_options

            action_text = (
                brief.recommended_first_action.action
                .strip()
                .lower()
            )

            if "none" in expected_options and not action_text:
                return True

            if "investigation" in expected_options:
                investigation_terms = (
                    "investigate",
                    "investigation",
                    "verify",
                    "check",
                    "review",
                )

                if any(
                    term in action_text
                    for term in investigation_terms
                ):
                    return True

            return any(
                option not in {"none", "investigation"}
                and option in action_text
                for option in expected_options
            )

        if key == "first_action":
            if not brief.recommended_first_action:
                return False

            action_text = (
                brief.recommended_first_action.action
                .strip()
                .lower()
            )

            if isinstance(expected_value, dict):
                expected_action = (
                    expected_value.get("action")
                    or expected_value.get("entity")
                    or ""
                )
            else:
                expected_action = expected_value

            expected_action = (
                str(expected_action).strip().lower()
            )

            if not expected_action:
                return False

            return expected_action in action_text

        if key == "latest_decision":
            if not brief.evidence:
                return False

            expected_decision = (
                str(expected_value).strip().lower()
            )

            if not expected_decision:
                return False

            relevant_evidence = [
                evidence
                for evidence in brief.evidence
                if expected_decision
                in evidence.conclusion.strip().lower()
            ]

            if not relevant_evidence:
                return False

            latest_evidence = relevant_evidence[-1]

            return (
                expected_decision
                in latest_evidence.conclusion.strip().lower()
            )

        if key == "blocker_reason":
            expected_text = str(expected_value).lower()
            return any(
                expected_text in str(blocker).lower()
                for blocker in brief.blockers
            )

        if key == "action_recommended":
            expected_text = str(expected_value).lower()

            if not brief.actions:
                return False

            return any(
                expected_text in action.action.lower()
                for action in brief.actions
            )

        if key == "top_blocker":
            if not brief.blockers:
                return False

            return (
                str(expected_value).lower()
                in str(brief.blockers[0]).lower()
            )

        if key == "high_impact_identified":
            actual_value = any(
                getattr(blocker, "impact", "").upper()
                in {"HIGH", "CRITICAL"}
                for blocker in brief.blockers
            )
            return actual_value == bool(expected_value)

        if key == "top_action":
            if not brief.actions:
                return False

            return (
                str(expected_value).lower()
                in brief.actions[0].action.lower()
            )

        if key == "ranking_correct":
            return self._check_action_ranking(
                brief,
                expected_value,
            )

        if key == "entity_resolution_correct":
            actual_value = False

            if len(brief.current_state) == 1:
                resolved_state = brief.current_state[0]

                state_evidence = {
                    evidence_id
                    for evidence_id in resolved_state.evidence
                    if evidence_id
                }

                associated_source_ids = {
                    source_id
                    for evidence in brief.evidence
                    for source_id in evidence.sources
                    if source_id
                }

                actual_value = (
                    bool(state_evidence)
                    and bool(associated_source_ids)
                    and len(state_evidence) >= 2
                )

            return actual_value == bool(expected_value)

        if key == "confidence_high":
            return brief.confidence_overall >= 80

        return False

    def _check_action_ranking(
        self,
        brief,
        expected_value,
    ):
        """Validate that generated actions follow the expected ranking."""

        if len(brief.actions) < 2:
            return False

        if expected_value is True:
            return self._is_ranked_by_priority(brief.actions)

        if expected_value is False:
            return not self._is_ranked_by_priority(
                brief.actions
            )

        expected_actions = [
            action.strip().lower()
            for action in str(expected_value).split(">")
        ]

        actual_actions = [
            action.action.strip().lower()
            for action in brief.actions
        ]

        if len(expected_actions) != len(actual_actions):
            return False

        return all(
            expected in actual
            for expected, actual in zip(
                expected_actions,
                actual_actions,
            )
        )

    @staticmethod
    def _is_ranked_by_priority(actions):
        """Verify that actions are ordered from highest to lowest priority."""

        priority_values = []

        for action in actions:
            priority = getattr(
                action,
                "priority",
                None,
            )

            if priority is None:
                priority = getattr(
                    action,
                    "priority_score",
                    None,
                )

            if priority is None:
                priority = getattr(
                    action,
                    "score",
                    None,
                )

            if priority is None:
                return False

            if isinstance(priority, str):
                normalized = priority.strip().upper()

                priority_map = {
                    "CRITICAL": 4,
                    "HIGH": 3,
                    "MEDIUM": 2,
                    "LOW": 1,
                }

                if normalized not in priority_map:
                    try:
                        priority = float(priority)
                    except ValueError:
                        return False
                else:
                    priority = priority_map[normalized]

            try:
                priority_values.append(float(priority))
            except (TypeError, ValueError):
                return False

        return all(
            current >= following
            for current, following in zip(
                priority_values,
                priority_values[1:],
            )
        )

    def _summarize_brief(self, brief):
        """Create a compact summary of the generated brief."""

        return {
            "states": len(brief.current_state),
            "conflicts": len(brief.conflicts),
            "blockers": len(brief.blockers),
            "actions": len(brief.actions),
            "confidence": brief.confidence_overall,
        }


if __name__ == "__main__":
    runner = EvaluationRunner()
    results = runner.run_all_scenarios()

    print("\n" + "=" * 70)
    print("EVALUATION RESULTS")
    print("=" * 70)

    total_score = 0.0

    for result in results:
        print(f"\n{result['scenario']}")
        print(f"  Status: {result['status']}")
        print(f"  Score: {result['score']:.1%}")

        if "error" in result:
            print(f"  Error: {result['error']}")

        total_score += result["score"]

    if results:
        average_score = total_score / len(results)
    else:
        average_score = 0.0

    print("\n" + "=" * 70)
    print(f"OVERALL SCORE: {average_score:.1%}")
    print("=" * 70 + "\n")

    os.makedirs("evaluation", exist_ok=True)

    with open(
        "evaluation/results.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            {
                "timestamp": datetime.now(
                    timezone.utc
                ).isoformat(),
                "scenarios": results,
                "overall_score": average_score,
            },
            file,
            indent=2,
        )

    has_failure = any(
        result.get("status") in {"FAIL", "PARTIAL"}
        for result in results
    )

    if not results or has_failure:
        sys.exit(1)

    sys.exit(0)