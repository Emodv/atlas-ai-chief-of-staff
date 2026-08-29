from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable

from .models import EconomicOpportunity, EconomicValueEvent


def expected_economic_value(estimated_value: Decimal, probability: float) -> Decimal:
    """Probability-weighted economic value using probability in the 0..1 range."""
    return (estimated_value * Decimal(str(probability))).quantize(Decimal("0.01"))


def attention_efficiency(expected_value: Decimal, human_minutes: int) -> Decimal | None:
    """Expected economic value per human hour. None means no human attention is required."""
    if human_minutes <= 0:
        return None
    hours = Decimal(human_minutes) / Decimal(60)
    return (expected_value / hours).quantize(Decimal("0.01"))


def enrich_economics(opportunity: EconomicOpportunity) -> EconomicOpportunity:
    opportunity.expected_economic_value = expected_economic_value(
        opportunity.estimated_value,
        opportunity.close_probability,
    )
    opportunity.attention_efficiency = attention_efficiency(
        opportunity.expected_economic_value,
        opportunity.estimated_human_minutes,
    )
    return opportunity


def realized_value(events: Iterable[EconomicValueEvent]) -> Decimal:
    total = Decimal("0")
    for event in events:
        direction = Decimal("-1") if event.kind == "cost" else Decimal("1")
        total += direction * event.amount
    return total.quantize(Decimal("0.01"))


@dataclass(frozen=True)
class EconomicPortfolioSummary:
    expected_value: Decimal
    realized_value: Decimal
    opportunity_count: int
    human_minutes: int
    expected_value_per_human_hour: Decimal | None


def summarize_portfolio(
    opportunities: Iterable[EconomicOpportunity],
    value_events: Iterable[EconomicValueEvent] = (),
) -> EconomicPortfolioSummary:
    enriched = [enrich_economics(item) for item in opportunities]
    expected = sum((item.expected_economic_value for item in enriched), Decimal("0"))
    minutes = sum(item.estimated_human_minutes for item in enriched)
    expected = expected.quantize(Decimal("0.01"))
    return EconomicPortfolioSummary(
        expected_value=expected,
        realized_value=realized_value(value_events),
        opportunity_count=len(enriched),
        human_minutes=minutes,
        expected_value_per_human_hour=attention_efficiency(expected, minutes),
    )
