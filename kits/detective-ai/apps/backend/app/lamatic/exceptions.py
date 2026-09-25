"""Domain exceptions for Lamatic AgentKit integration."""


class LamaticError(Exception):
    """Base exception for all Lamatic integration errors."""


class LamaticConfigurationError(LamaticError):
    """Raised when Lamatic credentials or settings are missing or invalid."""


class LamaticConnectionError(LamaticError):
    """Raised when network connection to Lamatic AgentKit service fails."""


class LamaticInvocationError(LamaticError):
    """Raised when agent execution returns an error or fails."""
