from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from .models import Opportunity, OpportunityStage, PriorityBand


WEIGHTS = {
    "value": 0.25,
    "probability": 0.20,
    "speed": 0.15,
    "urgency": 0.15,
    "leverage": 0.15,
    "effort_efficiency": 0.10,
}


ALLOWED_TRANSITIONS: dict[OpportunityStage, set[OpportunityStage]] = {
    OpportunityStage.DETECTED: {OpportunityStage.RANKED, OpportunityStage.CLOSED},
    OpportunityStage.RANKED: {OpportunityStage.ASSIGNED, OpportunityStage.CLOSED},
    OpportunityStage.ASSIGNED: {OpportunityStage.ACTED, OpportunityStage.CLOSED},
    OpportunityStage.ACTED: {OpportunityStage.VERIFIED, OpportunityStage.ASSIGNED, OpportunityStage.CLOSED},
    OpportunityStage.VERIFIED: {OpportunityStage.CLOSED, OpportunityStage.ACTED},
    OpportunityStage.CLOSED: {OpportunityStage.LEARNED},
    OpportunityStage.LEARNED: set(),
}


def score_opportunity(opportunity: Opportunity) -> int:
    raw = sum(getattr(opportunity, key) * weight for key, weight in WEIGHTS.items())
    return round(raw)


def priority_band(score: int) -> PriorityBand:
    if score >= 90:
        return PriorityBand.P0
    if score >= 75:
        return PriorityBand.P1
    if score >= 60:
        return PriorityBand.P2
    if score >= 40:
        return PriorityBand.P3
    return PriorityBand.P4


def rank_opportunity(opportunity: Opportunity) -> Opportunity:
    score = score_opportunity(opportunity)
    opportunity.score = score
    opportunity.priority = priority_band(score)
    if opportunity.stage == OpportunityStage.DETECTED:
        opportunity.stage = OpportunityStage.RANKED
    opportunity.updated_at = datetime.now(timezone.utc)
    return opportunity


def transition(opportunity: Opportunity, target: OpportunityStage) -> Opportunity:
    if target == opportunity.stage:
        return opportunity
    allowed = ALLOWED_TRANSITIONS[opportunity.stage]
    if target not in allowed:
        raise ValueError(f"Invalid opportunity transition: {opportunity.stage.value} -> {target.value}")
    opportunity.stage = target
    opportunity.updated_at = datetime.now(timezone.utc)
    return opportunity


@dataclass(frozen=True)
class DecisionCompression:
    handled: tuple[Opportunity, ...]
    needs_you: tuple[Opportunity, ...]
    watch: tuple[Opportunity, ...]
    ignored: tuple[Opportunity, ...]


def compress_decisions(opportunities: Iterable[Opportunity]) -> DecisionCompression:
    ranked = sorted((rank_opportunity(o) for o in opportunities), key=lambda o: o.score or 0, reverse=True)
    handled: list[Opportunity] = []
    needs_you: list[Opportunity] = []
    watch: list[Opportunity] = []
    ignored: list[Opportunity] = []

    for item in ranked:
        if item.stage in {OpportunityStage.VERIFIED, OpportunityStage.CLOSED, OpportunityStage.LEARNED}:
            handled.append(item)
        elif item.requires_human or item.priority in {PriorityBand.P0, PriorityBand.P1}:
            needs_you.append(item)
        elif item.priority == PriorityBand.P4:
            ignored.append(item)
        else:
            watch.append(item)

    return DecisionCompression(tuple(handled), tuple(needs_you), tuple(watch), tuple(ignored))
