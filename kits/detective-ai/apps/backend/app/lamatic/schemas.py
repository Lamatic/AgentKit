"""Pydantic schemas for Lamatic AgentKit integration boundary."""

from typing import Any

from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    """Input payload schema for Lamatic agent invocation."""

    message: str = Field(..., description="User prompt or message sent to the agent")
    context: dict[str, Any] | None = Field(
        default=None, description="Optional non-game-state context parameters"
    )


class AgentResponse(BaseModel):
    """Structured output response schema from Lamatic agent invocation."""

    content: str = Field(
        ..., description="Human-readable message or reply content from the agent"
    )
    status: str = Field(
        default="success",
        description="Execution status ('success', 'error', 'failed')",
    )
    raw_result: dict[str, Any] | None = Field(
        default=None, description="Raw result metadata returned from SDK"
    )
