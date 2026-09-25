"""Core domain exception hierarchy for DetectiveAI."""


class GameEngineError(Exception):
    """Base exception for all game engine and investigation session errors."""

    pass


class SessionNotFoundError(GameEngineError):
    """Raised when a requested game session cannot be found."""

    pass


class SessionAlreadyCompletedError(GameEngineError):
    """Raised when attempting an action on a SOLVED or FAILED session."""

    pass


class InvalidActionError(GameEngineError):
    """Raised when an action is unknown, invalid, or malformed."""

    pass


class InvalidLocationError(GameEngineError):
    """Raised when moving to a nonexistent location."""

    pass


class LocationLockedError(GameEngineError):
    """Raised when attempting to enter a locked or inaccessible location."""

    pass


class EvidenceNotDiscoveredError(GameEngineError):
    """Raised when attempting to examine undiscovered evidence."""

    pass


class EvidenceNotFoundError(GameEngineError):
    """Raised when requesting an evidence item that does not exist in scenario."""

    pass


class SuspectNotAvailableError(GameEngineError):
    """Raised when interviewing a suspect who is invalid or unavailable."""

    pass


class StageRequirementsNotMetError(GameEngineError):
    """Raised when advancing a stage before requirements are satisfied."""

    pass


class InvalidSolutionError(GameEngineError):
    """Raised when submitting an invalid or malformed solution proposal."""

    pass
