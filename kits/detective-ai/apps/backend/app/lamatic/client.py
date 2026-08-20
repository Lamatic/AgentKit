"""Adapter wrapper over official Lamatic Python SDK client."""

import logging
import time
from typing import Any

import httpx
import lamatic.client
from lamatic import Lamatic

from app.core.config import settings
from app.lamatic.exceptions import (
    LamaticConfigurationError,
    LamaticConnectionError,
    LamaticInvocationError,
)
from app.lamatic.schemas import AgentResponse

logger = logging.getLogger(__name__)


# Patch SDK's internal httpx client to bypass SSL verification
# (handles hostnames with underscores like 'detective_ai945.lamatic.dev')
class _UnverifiedClient(httpx.Client):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["verify"] = False
        super().__init__(*args, **kwargs)


class _UnverifiedAsyncClient(httpx.AsyncClient):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["verify"] = False
        super().__init__(*args, **kwargs)


lamatic.client.httpx.Client = _UnverifiedClient  # type: ignore[misc]
lamatic.client.httpx.AsyncClient = _UnverifiedAsyncClient  # type: ignore[misc]


class LamaticClient:
    """Adapter wrapping the official Lamatic Python SDK client."""

    def __init__(
        self,
        endpoint: str | None = None,
        project_id: str | None = None,
        api_key: str | None = None,
        flow_id: str | None = None,
        sdk_client: Any | None = None,
    ) -> None:
        self.endpoint = endpoint or settings.lamatic_endpoint
        self.project_id = project_id or settings.lamatic_project_id
        self.api_key = api_key or settings.lamatic_api_key
        self.flow_id = flow_id or settings.lamatic_flow_id

        self._sdk_client = sdk_client

    def _get_sdk_client(self) -> Any:
        if self._sdk_client is not None:
            return self._sdk_client

        if not self.endpoint or not self.project_id or not self.api_key:
            raise LamaticConfigurationError(
                "Lamatic credentials are not configured. Please set "
                "LAMATIC_ENDPOINT, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY."
            )

        try:
            self._sdk_client = Lamatic(
                endpoint=self.endpoint,
                project_id=self.project_id,
                api_key=self.api_key,
            )
            return self._sdk_client
        except ValueError as err:
            raise LamaticConfigurationError(
                f"Invalid Lamatic configuration: {err}"
            ) from err

    def execute(
        self,
        flow_id: str | None = None,
        payload: dict[str, Any] | None = None,
    ) -> AgentResponse:
        """Execute a Lamatic AgentKit workflow flow synchronously."""
        sdk = self._get_sdk_client()
        target_flow_id = flow_id or self.flow_id
        if not target_flow_id:
            logger.warning("Lamatic execution aborted: flow_id is not configured")
            raise LamaticConfigurationError(
                "Lamatic flow_id is not configured. Please set LAMATIC_FLOW_ID."
            )
        exec_payload = payload or {}

        logger.info("Invoking Lamatic flow flow_id=%s", target_flow_id)
        start_time = time.perf_counter()

        try:
            sdk_response = sdk.execute_flow(
                flow_id=target_flow_id, payload=exec_payload
            )
        except (httpx.HTTPError, TimeoutError, ConnectionError) as err:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Lamatic SDK request connection failed flow_id=%s duration_ms=%.2f: %s",
                target_flow_id,
                duration_ms,
                err,
            )
            raise LamaticConnectionError(
                f"Unable to connect to Lamatic AgentKit service: {err}"
            ) from err
        except Exception as err:
            duration_ms = (time.perf_counter() - start_time) * 1000
            if isinstance(err, (LamaticConfigurationError, LamaticConnectionError)):
                raise
            logger.error(
                "Lamatic SDK request failed flow_id=%s duration_ms=%.2f: %s",
                target_flow_id,
                duration_ms,
                err,
            )
            raise LamaticInvocationError(
                f"Unable to invoke the Detective AI agent: {err}"
            ) from err

        duration_ms = (time.perf_counter() - start_time) * 1000

        if sdk_response.status in ("error", "failed"):
            err_msg = sdk_response.message or "Unknown execution failure"
            logger.warning(
                "Lamatic invocation failed flow_id=%s duration_ms=%.2f "
                "status=%s message=%s",
                target_flow_id,
                duration_ms,
                sdk_response.status,
                err_msg,
            )
            raise LamaticInvocationError(
                f"Lamatic AgentKit invocation failed: {err_msg}"
            )

        logger.info(
            "Lamatic flow completed successfully flow_id=%s duration_ms=%.2f status=%s",
            target_flow_id,
            duration_ms,
            sdk_response.status,
        )

        result_data = sdk_response.result or {}
        content = _extract_content_from_result(result_data)

        return AgentResponse(
            content=content,
            status=sdk_response.status,
            raw_result=result_data,
        )


def _extract_content_from_result(result_data: dict[str, Any]) -> str:
    """Extract human-readable message string from SDK result dictionary."""
    if not result_data:
        return "No response content returned by agent."

    for key in ("response", "output", "content", "message", "text", "answer"):
        if key in result_data and isinstance(result_data[key], str):
            return result_data[key]

    if "output" in result_data and isinstance(result_data["output"], dict):
        return _extract_content_from_result(result_data["output"])

    return str(result_data)
