from datetime import datetime


def order_sources(sources):
    return sorted(
        sources,
        key=lambda source: datetime.fromisoformat(
            source["timestamp"].replace("Z", "+00:00")
        )
    )