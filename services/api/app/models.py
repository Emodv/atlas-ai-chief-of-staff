from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class AutonomyStage(str, Enum):
    SURFACE = "surface"
    RECOMMEND = "recommend"
    DRAFT = "draft"
    EXECUTE = "execute"


class TrustLevel(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class OpportunityStage(str, Enum):
    DETECTED = "detected"
    RANKED = "ranked"
    ASSIGNED = "assigned"
    ACTED = "acted"
    VERIFIED = "verified"
    CLOSED = "closed"
    LEARNED = "learned"


class PriorityBand(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class EconomicNodeType(str, Enum):
    PERSON = "person"
    COMPANY = "company"
    ASSET = "asset"
    INCOME_STREAM = "income_stream"
    OPPORTUNITY = "opportunity"
    ACTION = "action"
    OUTCOME = "outcome"
    RELATIONSHIP = "relationship"


class EconomicValueKind(str, Enum):
    REVENUE = "revenue"
    SAVINGS = "savings"
    COST = "cost"
    COMMISSION = "commission"
    COMPENSATION = "compensation"
    ASSET_VALUE = "asset_value"


class Relationship(BaseModel):
    contact_id: str
    name: str
    relationship_type: str = "unknown"
    warmth: float = Field(default=0.5, ge=0, le=1)
    formality: float = Field(default=0.5, ge=0, le=1)
    languages: list[str] = Field(default_factory=list)
    last_meaningful_contact: str | None = None
    open_loops: list[str] = Field(default_factory=list)


class TwinProfile(BaseModel):
    user_id: str
    concise: float = Field(default=0.5, ge=0, le=1)
    warm: float = Field(default=0.5, ge=0, le=1)
    direct: float = Field(default=0.5, ge=0, le=1)
    commercial_clarity: float = Field(default=0.5, ge=0, le=1)
    preferred_languages: list[str] = Field(default_factory=list)
    style_notes: list[str] = Field(default_factory=list)
    decision_rules: list[str] = Field(default_factory=list)


class Opportunity(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    owner: str = "atlas"
    stage: OpportunityStage = OpportunityStage.DETECTED
    value: float = Field(default=0, ge=0, le=100)
    probability: float = Field(default=0, ge=0, le=100)
    speed: float = Field(default=0, ge=0, le=100)
    urgency: float = Field(default=0, ge=0, le=100)
    leverage: float = Field(default=0, ge=0, le=100)
    effort_efficiency: float = Field(default=0, ge=0, le=100)
    score: int | None = Field(default=None, ge=0, le=100)
    priority: PriorityBand | None = None
    requires_human: bool = False
    executable: bool = False
    evidence_ids: list[str] = Field(default_factory=list)
    next_action: str | None = None
    expected_value: str | None = None
    deadline: datetime | None = None
    last_action: str | None = None
    verification_evidence_ids: list[str] = Field(default_factory=list)
    learning: dict[str, str | int | float | bool] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EconomicOpportunity(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    income_stream: str
    currency: str = "CAD"
    estimated_value: Decimal = Field(default=Decimal("0"), ge=0)
    close_probability: float = Field(default=0, ge=0, le=1)
    estimated_human_minutes: int = Field(default=0, ge=0)
    expected_economic_value: Decimal = Field(default=Decimal("0"), ge=0)
    attention_efficiency: Decimal | None = None
    source_asset: str | None = None
    relationship_id: str | None = None
    deadline: datetime | None = None
    next_action: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EconomicValueEvent(BaseModel):
    id: str
    user_id: str
    kind: Literal["revenue", "savings", "cost", "commission", "compensation", "asset_value"]
    amount: Decimal
    currency: str = "CAD"
    opportunity_id: str | None = None
    income_stream: str | None = None
    source_asset: str | None = None
    evidence_id: str | None = None
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EconomicGraphNode(BaseModel):
    id: str
    user_id: str
    node_type: EconomicNodeType
    label: str
    external_key: str | None = None
    attributes: dict[str, str | int | float | bool] = Field(default_factory=dict)


class EconomicGraphEdge(BaseModel):
    id: str
    user_id: str
    source_node_id: str
    target_node_id: str
    relationship: str
    weight: float = Field(default=1, ge=0)
    evidence_ids: list[str] = Field(default_factory=list)


class DecisionRequest(BaseModel):
    user_id: str
    task_type: str
    confidence: float = Field(ge=0, le=1)
    reversible: bool = True
    consequence: Literal["low", "medium", "high"] = "low"
    contains_sensitive_data: bool = False
    has_required_permission: bool = True
    context_is_stale: bool = False
    context_gap: bool = False
    standing_rule: bool = False
    independently_verifiable: bool = False
    estimated_value: Decimal | None = Field(default=None, ge=0)
    estimated_human_minutes: int = Field(default=0, ge=0, le=1440)


class DecisionResponse(BaseModel):
    stage: AutonomyStage
    trust: TrustLevel
    summary: str
    reason: str
