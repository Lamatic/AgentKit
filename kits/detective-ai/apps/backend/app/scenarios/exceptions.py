"""Scenario package custom exceptions."""


class ScenarioError(Exception):
    """Base exception for scenario-related errors."""

    pass


class ScenarioNotFoundError(ScenarioError):
    """Raised when a scenario directory or file cannot be located."""

    pass


class ScenarioValidationError(ScenarioError):
    """Raised when a scenario fails structural or cross-reference validation."""

    pass


class ScenarioFormatError(ScenarioError):
    """Raised when a scenario file format or JSON parsing fails."""

    pass
