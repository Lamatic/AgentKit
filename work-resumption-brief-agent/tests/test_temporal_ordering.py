from src.components.temporal_ordering.ordering import order_sources


def test_order_sources():
    sources = [
        {"id": "2", "timestamp": "2026-08-23T12:00:00Z"},
        {"id": "1", "timestamp": "2026-08-23T10:00:00Z"},
        {"id": "3", "timestamp": "2026-08-23T14:00:00Z"},
    ]

    result = order_sources(sources)

    assert [source["id"] for source in result] == ["1", "2", "3"]


def test_order_sources_does_not_modify_original():
    sources = [
        {"id": "2", "timestamp": "2026-08-23T12:00:00Z"},
        {"id": "1", "timestamp": "2026-08-23T10:00:00Z"},
    ]

    original = sources.copy()

    order_sources(sources)

    assert sources == original