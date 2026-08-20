"""FastAPI exception handlers mapping domain exceptions to HTTP responses."""

import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    EvidenceNotDiscoveredError,
    EvidenceNotFoundError,
    GameEngineError,
    InvalidActionError,
    InvalidLocationError,
    InvalidSolutionError,
    LocationLockedError,
    SessionAlreadyCompletedError,
    SessionNotFoundError,
    StageRequirementsNotMetError,
    SuspectNotAvailableError,
)
from app.lamatic.exceptions import (
    LamaticConfigurationError,
    LamaticConnectionError,
    LamaticError,
    LamaticInvocationError,
)
from app.scenarios.exceptions import (
    ScenarioError,
    ScenarioFormatError,
    ScenarioNotFoundError,
    ScenarioValidationError,
)

logger = logging.getLogger(__name__)


def make_error_response(
    status_code: int, code: str, message: str, lock_reason: str | None = None
) -> JSONResponse:
    """Construct a standardized JSON error response."""
    content = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if lock_reason is not None:
        content["error"]["lock_reason"] = lock_reason
    return JSONResponse(
        status_code=status_code,
        content=content,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register domain and system exception handlers on the FastAPI app."""

    @app.exception_handler(SessionNotFoundError)
    async def session_not_found_handler(
        request: Request, exc: SessionNotFoundError
    ) -> JSONResponse:
        logger.warning("Session not found: %s", exc)
        return make_error_response(
            status.HTTP_404_NOT_FOUND, "SESSION_NOT_FOUND", str(exc)
        )

    @app.exception_handler(EvidenceNotFoundError)
    async def evidence_not_found_handler(
        request: Request, exc: EvidenceNotFoundError
    ) -> JSONResponse:
        logger.warning("Evidence not found: %s", exc)
        return make_error_response(
            status.HTTP_404_NOT_FOUND, "EVIDENCE_NOT_FOUND", str(exc)
        )

    @app.exception_handler(ScenarioNotFoundError)
    async def scenario_not_found_handler(
        request: Request, exc: ScenarioNotFoundError
    ) -> JSONResponse:
        logger.warning("Scenario not found: %s", exc)
        return make_error_response(
            status.HTTP_404_NOT_FOUND, "SCENARIO_NOT_FOUND", str(exc)
        )

    @app.exception_handler(InvalidLocationError)
    async def invalid_location_handler(
        request: Request, exc: InvalidLocationError
    ) -> JSONResponse:
        logger.warning("Invalid location: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "INVALID_LOCATION", str(exc)
        )

    @app.exception_handler(InvalidActionError)
    async def invalid_action_handler(
        request: Request, exc: InvalidActionError
    ) -> JSONResponse:
        logger.warning("Invalid action: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "INVALID_ACTION", str(exc)
        )

    @app.exception_handler(InvalidSolutionError)
    async def invalid_solution_handler(
        request: Request, exc: InvalidSolutionError
    ) -> JSONResponse:
        logger.warning("Invalid solution: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "INVALID_SOLUTION", str(exc)
        )

    @app.exception_handler(ScenarioValidationError)
    async def scenario_validation_handler(
        request: Request, exc: ScenarioValidationError
    ) -> JSONResponse:
        logger.warning("Scenario validation error: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "SCENARIO_VALIDATION_ERROR", str(exc)
        )

    @app.exception_handler(ScenarioFormatError)
    async def scenario_format_handler(
        request: Request, exc: ScenarioFormatError
    ) -> JSONResponse:
        logger.warning("Scenario format error: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "SCENARIO_FORMAT_ERROR", str(exc)
        )

    @app.exception_handler(EvidenceNotDiscoveredError)
    async def evidence_not_discovered_handler(
        request: Request, exc: EvidenceNotDiscoveredError
    ) -> JSONResponse:
        logger.warning("Evidence not discovered: %s", exc)
        return make_error_response(
            status.HTTP_409_CONFLICT, "EVIDENCE_NOT_DISCOVERED", str(exc)
        )

    @app.exception_handler(LocationLockedError)
    async def location_locked_handler(
        request: Request, exc: LocationLockedError
    ) -> JSONResponse:
        logger.warning("Location locked: %s", exc)
        lock_reason = getattr(exc, "lock_reason", None)
        return make_error_response(
            status.HTTP_409_CONFLICT,
            "LOCATION_LOCKED",
            str(exc),
            lock_reason=lock_reason,
        )

    @app.exception_handler(StageRequirementsNotMetError)
    async def stage_requirements_handler(
        request: Request, exc: StageRequirementsNotMetError
    ) -> JSONResponse:
        logger.warning("Stage requirements not met: %s", exc)
        return make_error_response(
            status.HTTP_409_CONFLICT, "STAGE_REQUIREMENTS_NOT_MET", str(exc)
        )

    @app.exception_handler(SessionAlreadyCompletedError)
    async def session_completed_handler(
        request: Request, exc: SessionAlreadyCompletedError
    ) -> JSONResponse:
        logger.warning("Session already completed: %s", exc)
        return make_error_response(
            status.HTTP_409_CONFLICT, "SESSION_ALREADY_COMPLETED", str(exc)
        )

    @app.exception_handler(SuspectNotAvailableError)
    async def suspect_not_available_handler(
        request: Request, exc: SuspectNotAvailableError
    ) -> JSONResponse:
        logger.warning("Suspect not available: %s", exc)
        return make_error_response(
            status.HTTP_409_CONFLICT, "SUSPECT_NOT_AVAILABLE", str(exc)
        )

    @app.exception_handler(LamaticConfigurationError)
    async def lamatic_config_handler(
        request: Request, exc: LamaticConfigurationError
    ) -> JSONResponse:
        logger.error("Lamatic configuration error: %s", exc)
        return make_error_response(
            status.HTTP_503_SERVICE_UNAVAILABLE, "LAMATIC_CONFIGURATION_ERROR", str(exc)
        )

    @app.exception_handler(LamaticConnectionError)
    async def lamatic_connection_handler(
        request: Request, exc: LamaticConnectionError
    ) -> JSONResponse:
        logger.error("Lamatic connection error: %s", exc)
        return make_error_response(
            status.HTTP_503_SERVICE_UNAVAILABLE, "LAMATIC_CONNECTION_ERROR", str(exc)
        )

    @app.exception_handler(LamaticInvocationError)
    async def lamatic_invocation_handler(
        request: Request, exc: LamaticInvocationError
    ) -> JSONResponse:
        logger.error("Lamatic invocation error: %s", exc)
        return make_error_response(
            status.HTTP_503_SERVICE_UNAVAILABLE, "LAMATIC_INVOCATION_ERROR", str(exc)
        )

    @app.exception_handler(LamaticError)
    async def general_lamatic_handler(
        request: Request, exc: LamaticError
    ) -> JSONResponse:
        logger.error("Lamatic generic error: %s", exc)
        return make_error_response(
            status.HTTP_503_SERVICE_UNAVAILABLE, "LAMATIC_ERROR", str(exc)
        )

    @app.exception_handler(ScenarioError)
    async def general_scenario_handler(
        request: Request, exc: ScenarioError
    ) -> JSONResponse:
        logger.warning("Scenario error: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "SCENARIO_ERROR", str(exc)
        )

    @app.exception_handler(GameEngineError)
    async def general_engine_handler(
        request: Request, exc: GameEngineError
    ) -> JSONResponse:
        logger.warning("Game engine error: %s", exc)
        return make_error_response(
            status.HTTP_400_BAD_REQUEST, "GAME_ENGINE_ERROR", str(exc)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        first_err = errors[0] if errors else {}
        msg = first_err.get("msg", "Invalid request body.")
        loc = " -> ".join(str(loc_elem) for loc_elem in first_err.get("loc", []))
        message = f"{loc}: {msg}" if loc else msg
        return make_error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_400_BAD_REQUEST:
            code = "BAD_REQUEST"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            code = "FORBIDDEN"
        elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
            code = "UNAUTHORIZED"

        detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return make_error_response(exc.status_code, code, detail_msg)

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled application error: %s", exc)
        return make_error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "An unexpected internal server error occurred.",
        )
