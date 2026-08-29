from fastapi import FastAPI

from .decision import choose_autonomy_stage
from .economic_graph import enrich_economics, summarize_portfolio
from .models import (
    DecisionRequest,
    DecisionResponse,
    EconomicOpportunity,
    EconomicValueEvent,
    Opportunity,
    TwinProfile,
)
from .opportunity import compress_decisions, rank_opportunity
from .twin import MessageSample, build_twin_profile

app = FastAPI(title="Atlas V2 API", version="0.3.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "atlas-api"}


@app.post("/v1/autonomy/decide", response_model=DecisionResponse)
def autonomy_decide(request: DecisionRequest) -> DecisionResponse:
    return choose_autonomy_stage(request)


@app.post("/v1/opportunities/rank", response_model=Opportunity)
def opportunity_rank(opportunity: Opportunity) -> Opportunity:
    return rank_opportunity(opportunity)


@app.post("/v1/economics/opportunity", response_model=EconomicOpportunity)
def economic_opportunity(opportunity: EconomicOpportunity) -> EconomicOpportunity:
    return enrich_economics(opportunity)


@app.post("/v1/economics/portfolio")
def economic_portfolio(
    opportunities: list[EconomicOpportunity],
    value_events: list[EconomicValueEvent] | None = None,
) -> dict:
    summary = summarize_portfolio(opportunities, value_events or [])
    return {
        "expected_value": str(summary.expected_value),
        "realized_value": str(summary.realized_value),
        "opportunity_count": summary.opportunity_count,
        "human_minutes": summary.human_minutes,
        "expected_value_per_human_hour": (
            str(summary.expected_value_per_human_hour)
            if summary.expected_value_per_human_hour is not None
            else None
        ),
    }


@app.post("/v1/decisions/compress")
def decision_compress(opportunities: list[Opportunity]) -> dict:
    result = compress_decisions(opportunities)
    return {
        "handled": [item.model_dump() for item in result.handled],
        "needs_you": [item.model_dump() for item in result.needs_you],
        "watch": [item.model_dump() for item in result.watch],
        "ignored": [item.model_dump() for item in result.ignored],
    }


@app.post("/v1/twin/demo", response_model=TwinProfile)
def twin_demo() -> TwinProfile:
    samples = [
        MessageSample("Perfect, thank you."),
        MessageSample("Sure, let's do it."),
        MessageSample("Send me the details and I will take a look."),
    ]
    return build_twin_profile("demo-user", samples)
