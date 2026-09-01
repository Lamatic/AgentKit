def generate_brief(actions):
    if not actions:
        return "No prioritized actions available."

    lines = ["Work Resumption Brief", ""]

    for index, item in enumerate(actions, start=1):
        action = item.get("action", "Unknown action")
        impact = item.get("impact", "UNKNOWN")
        urgency = item.get("urgency", "UNKNOWN")
        confidence = item.get("confidence", 0)

        lines.append(
            f"{index}. {action} "
            f"(Impact: {impact}, Urgency: {urgency}, "
            f"Confidence: {confidence})"
        )

    return "\n".join(lines)