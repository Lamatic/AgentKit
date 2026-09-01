from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def parse_input(file_path: str) -> Dict[str, Any]:
    """Read a markdown input file with error handling."""

    try:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Input file not found: {file_path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Input path is not a file: {file_path}"
            )

        content = path.read_text(encoding="utf-8")

        if not content.strip():
            raise ValueError(
                f"Input file is empty: {file_path}"
            )

        normalized_content = content.strip()

        return {
            "source": str(path),
            "content": normalized_content,
            "length": len(normalized_content),
        }

    except FileNotFoundError:
        logger.error("Input file not found: %s", file_path)
        raise

    except UnicodeDecodeError:
        logger.error(
            "Unable to decode input file as UTF-8: %s",
            file_path
        )
        raise ValueError(
            f"Input file is not valid UTF-8: {file_path}"
        )

    except Exception as e:
        logger.exception(
            "Failed to parse input file %s: %s",
            file_path,
            e
        )
        raise