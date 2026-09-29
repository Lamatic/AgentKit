"""Pydantic schemas for suspect interrogation API endpoints."""

from pydantic import BaseModel, Field


class InterrogateRequest(BaseModel):
    """Request payload for interrogating a suspect with a dialogue message."""

    message: str = Field(
        ..., min_length=1, description="Question or statement addressed to the suspect"
    )


class InterrogateResponse(BaseModel):
    """Player-safe response payload returned from a suspect interrogation turn."""

    suspect_id: str
    suspect_name: str
    response: str
    status: str = "success"
