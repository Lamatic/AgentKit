"""Pydantic schemas for standardized API error responses."""

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Structured error payload details."""

    code: str = Field(..., description="Machine-readable uppercase error code")
    message: str = Field(..., description="Human-readable error description")


class ErrorResponse(BaseModel):
    """Standard top-level API error response envelope."""

    error: ErrorDetail
