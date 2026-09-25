"""Main FastAPI application entry point for DetectiveAI."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.exceptions import register_exception_handlers
from app.api.health import router as health_router
from app.api.routes import api_v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import init_db

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown hooks."""
    logger.info(
        "Initializing %s FastAPI application (env=%s)",
        settings.app_name,
        settings.environment,
    )
    init_db()
    yield
    logger.info("Shutting down %s FastAPI application", settings.app_name)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        description="Authoritative game engine and API server for DetectiveAI.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Configure CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register domain and standard exception handlers
    register_exception_handlers(application)

    # Include root health router
    application.include_router(health_router)

    # Include versioned API routers
    application.include_router(api_v1_router)

    return application


app = create_app()
