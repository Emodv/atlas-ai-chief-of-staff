from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class AutonomyStage(str, Enum):
    SURFACE = "surface"
    RECOMMEND = "recommend"
    DRAFT = "draft"
    EXECUTE = "execute"


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


class DecisionRequest(BaseModel):
    user_id: str
    task_type: str
    confidence: float = Field(ge=0, le=1)
    reversible: bool = True
    consequence: Literal["low", "medium", "high"] = "low"
    contains_sensitive_data: bool = False


class DecisionResponse(BaseModel):
    stage: AutonomyStage
    reason: str
