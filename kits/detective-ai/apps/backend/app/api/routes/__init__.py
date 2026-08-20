"""Aggregate APIRouter combining all v1 endpoints."""

from fastapi import APIRouter

from app.api.routes.actions import router as actions_router
from app.api.routes.evidence import router as evidence_router
from app.api.routes.interrogation import router as interrogation_router
from app.api.routes.scenarios import router as scenarios_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.solutions import router as solutions_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(scenarios_router)
api_v1_router.include_router(sessions_router)
api_v1_router.include_router(actions_router)
api_v1_router.include_router(interrogation_router)
api_v1_router.include_router(evidence_router)
api_v1_router.include_router(solutions_router)

__all__ = ["api_v1_router"]
