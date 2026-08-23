def extend_sources(sources):
    result = []

    for source in sources:
        extended = source.copy()
        extended["source_type"] = "unknown"
        result.append(extended)

    return result