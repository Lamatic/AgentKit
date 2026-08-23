def detect_conflicts(sources):
    conflicts = []

    for i, first in enumerate(sources):
        for second in sources[i + 1:]:
            if (
                first.get("timestamp") == second.get("timestamp")
                and first.get("content") != second.get("content")
            ):
                conflicts.append({
                    "timestamp": first.get("timestamp"),
                    "sources": [first.get("id"), second.get("id")]
                })

    return conflicts