LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
}





CONFIDENCE_WEIGHTS = {
    "source_support": 0.30,
    "recency": 0.40,
    "consistency": 0.30,
}

RECENCY_SCORES = {
    "less_than_1_hour": 1.0,
    "less_than_1_day": 0.8,
    "less_than_7_days": 0.6,
    "less_than_30_days": 0.4,
    "more_than_30_days": 0.2,
}

CONFIDENCE_THRESHOLDS = {
    "HIGH": (80, 100),
    "MEDIUM": (50, 79.99),
    "LOW": (0, 49.99),
}