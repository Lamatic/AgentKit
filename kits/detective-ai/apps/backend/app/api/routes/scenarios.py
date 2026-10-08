"""FastAPI router for scenario discovery and detail inspection."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_scenario_registry
from app.api.schemas.scenario import PublicScenarioDefinition, ScenarioSummaryResponse
from app.scenarios.registry import ScenarioRegistry

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("", response_model=list[ScenarioSummaryResponse])
def list_scenarios(
    registry: ScenarioRegistry = Depends(get_scenario_registry),
) -> list[ScenarioSummaryResponse]:
    """Retrieve player-safe summaries of all registered scenarios."""
    scenarios = registry.list_scenarios()
    return [
        ScenarioSummaryResponse(
            id=s["id"],
            name=s["name"],
            description=s["description"],
            version=s["version"],
        )
        for s in scenarios
    ]


@router.get("/{scenario_id}", response_model=PublicScenarioDefinition)
def get_scenario(
    scenario_id: str,
    registry: ScenarioRegistry = Depends(get_scenario_registry),
) -> PublicScenarioDefinition:
    """Retrieve complete player-safe scenario representation (ground truth stripped)."""
    canonical_id = registry.resolve_scenario_id(scenario_id)
    scenario_def = registry.get_scenario(canonical_id)
    return scenario_def.to_player_view()
