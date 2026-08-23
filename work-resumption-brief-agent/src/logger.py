import logging
import sys
from src.config import LOGGING_CONFIG

def setup_logger(component_name: str) -> logging.Logger:
    """Setup logger for a component."""
    logger = logging.getLogger(component_name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            f"[{component_name}] %(levelname)s: %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(LOGGING_CONFIG["level"])

    return logger