def build_response(data):
    return {
        "status": "success",
        "content": data["content"],
        "sources": data["sources"],
    }