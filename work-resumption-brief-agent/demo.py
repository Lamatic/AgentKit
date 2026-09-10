from src.agent import WorkResumptionAgent


def main():
    inputs = {
        "pr_comments": [
            {
                "timestamp": "2024-08-18T09:00:00Z",
                "pr_number": 123,
                "text": "Resume parser is incomplete",
            }
        ],
        "commits": [
            {
                "timestamp": "2024-08-18T10:00:00Z",
                "hash": "abc1234",
                "message": "Implement resume parser",
            }
        ],
        "meeting_notes": [
            {
                "timestamp": "2024-08-18T14:00:00Z",
                "text": "Resume parsing work is complete",
            }
        ],
    }

    agent = WorkResumptionAgent()
    brief = agent.process(inputs)

    print("=== Work Resumption Brief ===")
    print(f"Overall Confidence: {brief.confidence_overall:.1f}%")

    print("\nCurrent State:")
    for state in brief.current_state:
        print(
            f"- {state.entity}: "
            f"{state.state.value} "
            f"({state.confidence:.1f}%)"
        )

    print("\nConflicts:")
    if brief.conflicts:
        for conflict in brief.conflicts:
            print(f"- {conflict}")
    else:
        print("- None")

    print("\nBlockers:")
    if brief.blockers:
        for blocker in brief.blockers:
            print(f"- {blocker.blocker} [{blocker.impact}]")
    else:
        print("- None")

    print("\nRecommended Actions:")
    if brief.actions:
        for action in brief.actions:
            print(f"- {action.action}")
    else:
        print("- None")


if __name__ == "__main__":
    main()