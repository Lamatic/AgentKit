"""FastAPI dependency providers for database sessions and application services."""

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.evidence_knowledge import EvidenceKnowledgeBuilder
from app.scenarios.loader import ScenarioLoader
from app.scenarios.registry import ScenarioRegistry
from app.services.game_engine import GameEngine
from app.services.investigation_context import InvestigationContextBuilder
from app.services.player_state import PlayerStateBuilder
from app.services.session_service import SessionService
from app.services.solution_service import SolutionEvaluationService
from app.services.suspect_conversation import SuspectConversationManager
from app.services.suspect_knowledge import SuspectKnowledgeBuilder


def get_db() -> Generator[Session, None, None]:
    """Provide a database session lifecycle per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session_service() -> SessionService:
    """Provide SessionService instance."""
    return SessionService()


def get_scenario_loader() -> ScenarioLoader:
    """Provide ScenarioLoader instance."""
    return ScenarioLoader()


def get_scenario_registry() -> ScenarioRegistry:
    """Provide ScenarioRegistry instance."""
    return ScenarioRegistry()


def get_game_engine(
    session_service: SessionService = Depends(get_session_service),
    loader: ScenarioLoader = Depends(get_scenario_loader),
) -> GameEngine:
    """Provide authoritative GameEngine instance."""
    return GameEngine(session_service=session_service, loader=loader)


def get_investigation_context_builder(
    session_service: SessionService = Depends(get_session_service),
    loader: ScenarioLoader = Depends(get_scenario_loader),
) -> InvestigationContextBuilder:
    """Provide InvestigationContextBuilder instance."""
    return InvestigationContextBuilder(session_service=session_service, loader=loader)


def get_suspect_knowledge_builder(
    loader: ScenarioLoader = Depends(get_scenario_loader),
) -> SuspectKnowledgeBuilder:
    """Provide SuspectKnowledgeBuilder instance."""
    return SuspectKnowledgeBuilder(loader=loader)


def get_suspect_conversation_manager() -> SuspectConversationManager:
    """Provide SuspectConversationManager instance."""
    return SuspectConversationManager()


def get_evidence_knowledge_builder(
    loader: ScenarioLoader = Depends(get_scenario_loader),
) -> EvidenceKnowledgeBuilder:
    """Provide EvidenceKnowledgeBuilder instance."""
    return EvidenceKnowledgeBuilder(loader=loader)


def get_evidence_agent() -> EvidenceAgent:
    """Provide EvidenceAgent instance."""
    return EvidenceAgent()


def get_solution_evaluation_service(
    session_service: SessionService = Depends(get_session_service),
    game_engine: GameEngine = Depends(get_game_engine),
    loader: ScenarioLoader = Depends(get_scenario_loader),
    ctx_builder: InvestigationContextBuilder = Depends(
        get_investigation_context_builder
    ),
) -> SolutionEvaluationService:
    """Provide SolutionEvaluationService instance."""
    return SolutionEvaluationService(
        session_service=session_service,
        game_engine=game_engine,
        loader=loader,
        ctx_builder=ctx_builder,
    )


def get_player_state_builder(
    session_service: SessionService = Depends(get_session_service),
    loader: ScenarioLoader = Depends(get_scenario_loader),
    game_engine: GameEngine = Depends(get_game_engine),
) -> PlayerStateBuilder:
    """Provide PlayerStateBuilder instance."""
    return PlayerStateBuilder(
        session_service=session_service,
        loader=loader,
        game_engine=game_engine,
    )
