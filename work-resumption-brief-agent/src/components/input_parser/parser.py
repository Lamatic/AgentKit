from pathlib import Path
from typing import Dict, Any


def parse_input(file_path: str) -> Dict[str, Any]:
    """Read a text/markdown input file and return normalized content."""

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    content = path.read_text(encoding="utf-8")

    return {
        "source": str(path),
        "content": content.strip(),
        "length": len(content.strip()),
    }