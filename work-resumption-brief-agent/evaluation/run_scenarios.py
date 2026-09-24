import json
import os
from datetime import datetime

from src.agent import WorkResumptionAgent


class EvaluationRunner:
    """Run all evaluation scenarios and measure results."""

    def __init__(self):
        self.agent = WorkResumptionAgent()
        self.results = []

    def run_all_scenarios(self):
        """Run all scenario JSON files."""

        scenario_dir = "scenarios"

        scenario_files = sorted(
            file_name
            for file_name in os.listdir(scenario_dir)
            if file_name.endswith(".json")
        )

        for scenario_file in scenario_files:
            file_path = os.path.join(
                scenario_dir,
                scenario_file
            )

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as file:
                scenario = json.load(file)

            result = self.run_scenario(
                scenario,
                scenario_file
            )

            self.results.append(result)

        return self.results

    def run_scenario(self, scenario, filename):
        """Run one scenario and calculate its score."""

        scenario_name = scenario.get(
            "metadata",
            {}
        ).get(
            "name",
            filename
        )

        try:
            brief = self.agent.process(
                scenario["inputs"]
            )

            expected = scenario.get(
                "expected_outputs",
                {}
            )

            score = self._calculate_score(
                brief,
                expected
            )

            return {
                "scenario": scenario_name,
                "file": filename,
                "status": (
                    "PASS"
                    if score >= 0.80
                    else "PARTIAL"
                ),
                "score": score,
                "brief_summary": self._summarize_brief(
                    brief
                )
            }

        except Exception as error:
            return {
                "scenario": scenario_name,
                "file": filename,
                "status": "FAIL",
                "error": str(error),
                "score": 0.0
            }

    def _calculate_score(self, brief, expected):
        """Calculate the percentage of satisfied criteria."""

        if not expected:
            return 0.0

        correct = 0

        for key, expected_value in expected.items():
            if self._check_criterion(
                brief,
                key,
                expected_value
            ):
                correct += 1

        return correct / len(expected)

    def _check_criterion(
        self,
        brief,
        key,
        expected_value
    ):
        """Check one expected criterion."""

        if key == "conflicts_detected":
            return (
                len(brief.conflicts)
                == expected_value
            )

        if key == "state_complete":
            return any(
                state.state.value == "complete"
                for state in brief.current_state
            )

        if key == "parser_confidence_min":
            return (
                brief.confidence_overall
                >= expected_value
            )

        if key == "confidence_level":
            if expected_value == "LOW":
                return brief.confidence_overall < 50

            if expected_value == "MEDIUM":
                return 50 <= brief.confidence_overall < 80

            if expected_value == "HIGH":
                return brief.confidence_overall >= 80

        if key == "confidence_max":
            return (
                brief.confidence_overall
                <= expected_value
            )

        if key == "confidence_overall_max":
            return (
                brief.confidence_overall
                <= expected_value
            )

        if key == "blocker_identified":
            return len(brief.blockers) > 0

        if key == "blockers_count_min":
            return (
                len(brief.blockers)
                >= expected_value
            )

        if key == "actions_generated_min":
            return (
                len(brief.actions)
                >= expected_value
            )

        if key == "sources_count":
            return (
                len(brief.evidence)
                == expected_value
            )

        if key == "state":
            allowed_states = [
                state.strip().lower()
                for state in expected_value.split("or")
            ]

            actual_states = [
                state.state.value.lower()
                for state in brief.current_state
            ]

            return any(
                expected_state in actual_states
                for expected_state in allowed_states
            )

        if key == "conflicts_detected":
            return len(brief.conflicts) == expected_value

        if key == "recommended_action":
            if not brief.recommended_first_action:
                return "none" in expected_value.lower()

            action_text = (
                brief.recommended_first_action.action
                .lower()
            )

            return (
                "investigation" in expected_value.lower()
                or "none" in expected_value.lower()
                and not action_text
            )

        if key == "first_action":
            if not brief.recommended_first_action:
                return False

            action_text = (
                brief.recommended_first_action.action
                .lower()
            )

            return (
                "work" in action_text
                or "continue" in action_text
                or "start" in action_text
            )

        if key == "latest_decision":
            if not brief.current_state:
                return False

            return any(
                expected_value.lower()
                in state.entity.lower()
                for state in brief.current_state
            )

        if key == "blocker_reason":
            return any(
                expected_value.lower()
                in str(blocker).lower()
                for blocker in brief.blockers
            )

        if key == "action_recommended":
            if not brief.actions:
                return False

            return any(
                expected_value.lower()
                in action.action.lower()
                for action in brief.actions
            )

        if key == "top_blocker":
            if not brief.blockers:
                return False

            return (
                expected_value.lower()
                in str(brief.blockers[0]).lower()
            )

        if key == "high_impact_identified":
            return any(
                getattr(blocker, "impact", "").upper()
                in {"HIGH", "CRITICAL"}
                for blocker in brief.blockers
            )

        if key == "top_action":
            if not brief.actions:
                return False

            return (
                expected_value.lower()
                in brief.actions[0].action.lower()
            )

        if key == "ranking_correct":
            return len(brief.actions) >= 2

        if key == "entity_resolution_correct":
            return len(brief.current_state) > 0

        if key == "confidence_high":
            return brief.confidence_overall >= 80

        return False

    def _summarize_brief(self, brief):
        """Create a compact summary of the generated brief."""

        return {
            "states": len(brief.current_state),
            "conflicts": len(brief.conflicts),
            "blockers": len(brief.blockers),
            "actions": len(brief.actions),
            "confidence": brief.confidence_overall
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
        average_score = (
            total_score / len(results)
        )
    else:
        average_score = 0.0

    print("\n" + "=" * 70)
    print(
        f"OVERALL SCORE: "
        f"{average_score:.1%}"
    )
    print("=" * 70 + "\n")

    os.makedirs(
        "evaluation",
        exist_ok=True
    )

    with open(
        "evaluation/results.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            {
                "timestamp": datetime.now().isoformat(),
                "scenarios": results,
                "overall_score": average_score
            },
            file,
            indent=2
        )