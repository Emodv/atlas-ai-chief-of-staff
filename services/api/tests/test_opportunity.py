import pytest

from app.models import Opportunity, OpportunityStage, PriorityBand
from app.opportunity import compress_decisions, rank_opportunity, transition


def opportunity(**overrides):
    data = {
        "id": "opp-1",
        "user_id": "user-1",
        "title": "Warm revenue opportunity",
        "category": "revenue",
        "value": 95,
        "probability": 90,
        "speed": 90,
        "urgency": 85,
        "leverage": 80,
        "effort_efficiency": 90,
    }
    data.update(overrides)
    return Opportunity(**data)


def test_rank_opportunity_assigns_master_score_and_priority():
    item = rank_opportunity(opportunity())
    assert item.score == 89
    assert item.priority == PriorityBand.P1
    assert item.stage == OpportunityStage.RANKED


def test_lifecycle_requires_verification_before_close():
    item = opportunity(stage=OpportunityStage.ACTED)
    with pytest.raises(ValueError):
        transition(item, OpportunityStage.LEARNED)
    transition(item, OpportunityStage.VERIFIED)
    transition(item, OpportunityStage.CLOSED)
    transition(item, OpportunityStage.LEARNED)
    assert item.stage == OpportunityStage.LEARNED


def test_decision_compression_limits_human_attention_to_material_items():
    human = opportunity(id="human", requires_human=True)
    ignored = opportunity(
        id="noise",
        value=10,
        probability=10,
        speed=10,
        urgency=10,
        leverage=10,
        effort_efficiency=10,
    )
    handled = opportunity(id="done", stage=OpportunityStage.VERIFIED)

    result = compress_decisions([ignored, handled, human])

    assert [item.id for item in result.needs_you] == ["human"]
    assert [item.id for item in result.handled] == ["done"]
    assert [item.id for item in result.ignored] == ["noise"]
