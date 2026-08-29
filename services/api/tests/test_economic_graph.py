from decimal import Decimal

from app.economic_graph import attention_efficiency, enrich_economics, realized_value
from app.models import EconomicOpportunity, EconomicValueEvent


def test_expected_value_and_attention_efficiency():
    opportunity = EconomicOpportunity(
        id="opp-1",
        user_id="user-1",
        title="Retainer opportunity",
        category="revenue",
        income_stream="banoo",
        estimated_value=Decimal("12000"),
        close_probability=0.40,
        estimated_human_minutes=120,
    )

    enriched = enrich_economics(opportunity)

    assert enriched.expected_economic_value == Decimal("4800.00")
    assert enriched.attention_efficiency == Decimal("2400.00")


def test_zero_human_minutes_has_unbounded_machine_leverage():
    assert attention_efficiency(Decimal("5000"), 0) is None


def test_realized_value_nets_costs():
    events = [
        EconomicValueEvent(id="1", user_id="u", kind="revenue", amount=Decimal("3000")),
        EconomicValueEvent(id="2", user_id="u", kind="savings", amount=Decimal("500")),
        EconomicValueEvent(id="3", user_id="u", kind="cost", amount=Decimal("250")),
    ]

    assert realized_value(events) == Decimal("3250.00")
