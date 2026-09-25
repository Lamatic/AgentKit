"""Player-safe investigation context models and context builder."""

import logging
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.game_event import GameEvent
from app.scenarios.loader import ScenarioLoader
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


class InvestigationContext(BaseModel):
    """Player-safe explicit investigation context representation for AI reasoning."""

    session_id: str = Field(..., description="Active session ID")
    scenario_id: str = Field(..., description="Scenario ID")
    case_id: str = Field(..., description="Case ID")
    case_title: str = Field(..., description="Case title")
    case_description: str = Field(..., description="Case description")

    current_stage_id: str = Field(..., description="Current stage ID")
    current_stage_order: int = Field(..., description="Current stage numerical order")
    current_stage_name: str = Field(..., description="Current stage name")
    current_stage_description: str = Field(..., description="Current stage description")

    current_location_id: str | None = Field(None, description="Current location ID")
    current_location_name: str | None = Field(None, description="Current location name")
    current_location_description: str | None = Field(
        None, description="Current location description"
    )

    available_locations: list[dict[str, str]] = Field(
        default_factory=list, description="Currently unlocked/accessible locations"
    )
    locked_locations: list[dict[str, str]] = Field(
        default_factory=list, description="Currently locked locations"
    )
    visited_locations: list[str] = Field(
        default_factory=list, description="List of visited location IDs"
    )
    discovered_evidence: list[dict[str, Any]] = Field(
        default_factory=list, description="List of evidence items discovered so far"
    )
    interviewed_suspects: list[dict[str, Any]] = Field(
        default_factory=list, description="List of suspects interviewed so far"
    )
    public_suspects: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Public suspect profiles (strictly no ground truth)",
    )
    available_suspects: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Suspects currently available based on stage/discovery",
    )
    completed_stages: list[str] = Field(
        default_factory=list, description="List of completed stage IDs"
    )
    can_advance: bool = Field(
        False, description="Whether stage advancement requirements are met"
    )
    next_stage_name: str | None = Field(
        None, description="Name of next stage if advancement is ready"
    )
    is_final_stage: bool = Field(
        False, description="Whether this is the final stage of the scenario"
    )
    score: int = Field(0, description="Current investigation score")
    session_status: str = Field("IN_PROGRESS", description="Current session status")
    investigation_history: list[dict[str, Any]] = Field(
        default_factory=list, description="Chronological player-visible event log"
    )


class InvestigationContextBuilder:
    """Builder for constructing explicit, player-safe InvestigationContext."""

    def __init__(
        self,
        session_service: SessionService | None = None,
        loader: ScenarioLoader | None = None,
    ) -> None:
        self.session_service = session_service or SessionService()
        self.loader = loader or ScenarioLoader()

    def build_context(self, session_id: str, db: Session) -> InvestigationContext:
        """Construct player-safe InvestigationContext for a given session."""
        session_obj = self.session_service.get_session(session_id, db=db)
        state_dto = self.session_service.to_game_state_dto(session_obj)

        # Load scenario and convert to public view (ground truth stripped)
        scenario_def = self.loader.load(state_dto.scenario_id)
        public_scenario = scenario_def.to_player_view()

        # Current stage info
        cur_stage = next(
            (s for s in public_scenario.stages if s.id == state_dto.current_stage_id),
            None,
        )
        stage_name = cur_stage.name if cur_stage else state_dto.current_stage_id
        stage_desc = cur_stage.description if cur_stage else ""

        # Current location info
        cur_loc = next(
            (
                loc
                for loc in public_scenario.locations
                if loc.id == state_dto.current_location_id
            ),
            None,
        )
        loc_name = cur_loc.name if cur_loc else None
        loc_desc = cur_loc.description if cur_loc else None

        # Available / Unlocked locations vs Locked locations
        avail_locs = []
        for loc in public_scenario.locations:
            is_avail = (
                loc.is_initial_unlocked or loc.id in state_dto.visited_location_ids
            )
            if not is_avail:
                for st in public_scenario.stages:
                    if st.order <= state_dto.current_stage_order:
                        reqs = st.requirements or {}
                        req_locs = reqs.get("required_location_ids") or reqs.get(
                            "location_ids", []
                        )
                        if loc.id in req_locs:
                            is_avail = True
                            break
            if is_avail:
                avail_locs.append(
                    {"id": loc.id, "name": loc.name, "description": loc.description}
                )

        avail_ids = {item["id"] for item in avail_locs}

        # Identify required location IDs up to current stage
        required_loc_ids = set()
        for st in public_scenario.stages:
            if st.order <= state_dto.current_stage_order:
                reqs = st.requirements or {}
                req_locs = reqs.get("required_location_ids") or reqs.get(
                    "location_ids", []
                )
                for loc_id in req_locs:
                    required_loc_ids.add(loc_id)

        locked_locs = [
            {"id": loc.id, "name": loc.name, "description": loc.description}
            for loc in public_scenario.locations
            if loc.id not in avail_ids and loc.id in required_loc_ids
        ]

        # Location name lookup map
        loc_map = {loc.id: loc.name for loc in public_scenario.locations}

        # Discovered evidence details with location names
        disc_ev_set = set(state_dto.discovered_evidence_ids)
        disc_evidence = [
            {
                "id": ev.id,
                "name": ev.name,
                "description": ev.description,
                "evidence_type": ev.evidence_type,
                "location_id": ev.location_id,
                "location_name": loc_map.get(ev.location_id)
                if ev.location_id
                else None,
            }
            for ev in public_scenario.evidence
            if ev.id in disc_ev_set
        ]

        # Interviewed suspects details
        inter_sus_set = set(state_dto.interviewed_suspect_ids)
        interviewed_suspects = [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "alibi": s.alibi,
                "relationship_to_victim": s.relationship_to_victim,
            }
            for s in public_scenario.suspects
            if s.id in inter_sus_set
        ]

        # Public suspects summaries
        public_suspects = [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "alibi": s.alibi,
                "relationship_to_victim": s.relationship_to_victim,
            }
            for s in public_scenario.suspects
        ]

        # Available suspects summaries based on current/past stages
        relevant_suspect_ids = set(state_dto.interviewed_suspect_ids)
        has_any_suspect_reqs = False
        for st in public_scenario.stages:
            reqs = st.requirements or {}
            req_suss = reqs.get("required_suspect_ids") or reqs.get("suspect_ids", [])
            if req_suss:
                has_any_suspect_reqs = True
            if st.order <= state_dto.current_stage_order:
                for sus_id in req_suss:
                    relevant_suspect_ids.add(sus_id)

        if not has_any_suspect_reqs:
            available_suspects = public_suspects
        else:
            available_suspects = [
                s for s in public_suspects if s["id"] in relevant_suspect_ids
            ]

        # Chronological audit history
        events = db.scalars(
            select(GameEvent)
            .where(GameEvent.session_id == session_id)
            .order_by(GameEvent.timestamp)
        ).all()
        history = [
            {
                "event_type": e.event_type,
                "target_type": e.target_type,
                "target_id": e.target_id,
                "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                if e.timestamp
                else None,
            }
            for e in events
        ]

        # Check stage advancement readiness safely via GameEngine
        from app.services.game_engine import GameEngine

        engine = GameEngine(session_service=self.session_service, loader=self.loader)
        can_advance, next_stage_name = engine.check_stage_advancement_ready(
            session_id, db=db
        )

        sorted_stages = sorted(public_scenario.stages, key=lambda s: s.order)
        is_final_stage = (
            (cur_stage.id == sorted_stages[-1].id)
            if cur_stage and sorted_stages
            else False
        )

        return InvestigationContext(
            session_id=state_dto.session_id,
            scenario_id=state_dto.scenario_id,
            case_id=state_dto.case_id,
            case_title=public_scenario.case.title,
            case_description=public_scenario.case.description,
            current_stage_id=state_dto.current_stage_id,
            current_stage_order=state_dto.current_stage_order,
            current_stage_name=stage_name,
            current_stage_description=stage_desc,
            current_location_id=state_dto.current_location_id,
            current_location_name=loc_name,
            current_location_description=loc_desc,
            available_locations=avail_locs,
            locked_locations=locked_locs,
            visited_locations=state_dto.visited_location_ids,
            discovered_evidence=disc_evidence,
            interviewed_suspects=interviewed_suspects,
            public_suspects=public_suspects,
            available_suspects=available_suspects,
            completed_stages=state_dto.completed_stage_ids,
            can_advance=can_advance,
            next_stage_name=next_stage_name,
            is_final_stage=is_final_stage,
            score=state_dto.score,
            session_status=state_dto.status.value,
            investigation_history=history,
        )
