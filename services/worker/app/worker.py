from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Protocol, Sequence


class WorkerStage(str, Enum):
    OBSERVE = "observe"
    UNDERSTAND = "understand"
    SCORE = "score"
    CLAIM = "claim"
    EXECUTE = "execute"
    VERIFY = "verify"
    LEARN = "learn"


@dataclass
class Signal:
    source: str
    external_key: str
    payload: dict


@dataclass
class CandidateOpportunity:
    external_key: str
    title: str
    estimated_value: float
    probability: float
    human_minutes: int
    executable: bool = False
    requires_human: bool = False
    metadata: dict = field(default_factory=dict)

    @property
    def expected_value(self) -> float:
        return self.estimated_value * self.probability

    @property
    def attention_efficiency(self) -> float | None:
        if self.human_minutes <= 0:
            return None
        return self.expected_value / (self.human_minutes / 60)


class Observer(Protocol):
    def observe(self, since: datetime | None) -> Sequence[Signal]: ...


class Interpreter(Protocol):
    def interpret(self, signals: Sequence[Signal]) -> Sequence[CandidateOpportunity]: ...


class Executor(Protocol):
    def execute(self, opportunity: CandidateOpportunity) -> dict: ...


class Verifier(Protocol):
    def verify(self, opportunity: CandidateOpportunity, receipt: dict) -> dict: ...


class Store(Protocol):
    def claim(self, opportunity: CandidateOpportunity) -> bool: ...
    def record_observation(self, signal: Signal) -> None: ...
    def record_opportunity(self, opportunity: CandidateOpportunity) -> None: ...
    def record_outcome(self, opportunity: CandidateOpportunity, outcome: dict) -> None: ...
    def checkpoint(self) -> datetime | None: ...
    def save_checkpoint(self, at: datetime) -> None: ...


@dataclass
class WorkerResult:
    observed: int = 0
    opportunities: int = 0
    claimed: int = 0
    executed: int = 0
    verified: int = 0
    needs_human: list[CandidateOpportunity] = field(default_factory=list)


class OpportunityWorker:
    """Idempotent orchestration loop.

    Provider-specific connectors live outside this class. This worker owns the
    sequence and invariants: incremental observation, economic scoring, single
    ownership/claiming, safe execution, verification, and learning.
    """

    def __init__(
        self,
        observers: Sequence[Observer],
        interpreter: Interpreter,
        executor: Executor,
        verifier: Verifier,
        store: Store,
    ) -> None:
        self.observers = observers
        self.interpreter = interpreter
        self.executor = executor
        self.verifier = verifier
        self.store = store

    def run_once(self) -> WorkerResult:
        result = WorkerResult()
        since = self.store.checkpoint()
        signals: list[Signal] = []

        for observer in self.observers:
            observed = list(observer.observe(since))
            signals.extend(observed)
            for signal in observed:
                self.store.record_observation(signal)

        result.observed = len(signals)
        opportunities = sorted(
            self.interpreter.interpret(signals),
            key=lambda item: (
                item.expected_value,
                item.attention_efficiency or float("inf"),
            ),
            reverse=True,
        )
        result.opportunities = len(opportunities)

        for opportunity in opportunities:
            self.store.record_opportunity(opportunity)

            if not self.store.claim(opportunity):
                continue
            result.claimed += 1

            if opportunity.requires_human or not opportunity.executable:
                result.needs_human.append(opportunity)
                continue

            receipt = self.executor.execute(opportunity)
            result.executed += 1
            verification = self.verifier.verify(opportunity, receipt)
            self.store.record_outcome(opportunity, verification)
            if verification.get("verified") is True:
                result.verified += 1

        self.store.save_checkpoint(datetime.now(timezone.utc))
        return result
