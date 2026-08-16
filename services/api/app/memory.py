from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True)
class MemoryFact:
    text: str
    source_ids: tuple[str, ...]
    last_confirmed_at: datetime
    importance: float = 0.5
    contradicted: bool = False


@dataclass
class ContextPacket:
    facts: list[MemoryFact] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    stale_source_ids: list[str] = field(default_factory=list)

    @property
    def has_gap(self) -> bool:
        return bool(self.gaps)

    @property
    def has_stale_context(self) -> bool:
        return bool(self.stale_source_ids)


def build_context_packet(
    facts: list[MemoryFact],
    *,
    required_topics: list[str] | None = None,
    stale_after_days: int = 90,
    now: datetime | None = None,
) -> ContextPacket:
    """Build a compact, evidence-backed packet for ChatGPT.

    This intentionally does not perform semantic retrieval yet. It defines the
    output contract the retrieval layer must satisfy: ranked facts, source
    provenance, freshness warnings, and explicit knowledge gaps.
    """

    now = now or datetime.now(timezone.utc)
    usable = [fact for fact in facts if not fact.contradicted]
    usable.sort(key=lambda fact: (fact.importance, fact.last_confirmed_at), reverse=True)

    stale_source_ids: list[str] = []
    for fact in usable:
        age_days = (now - fact.last_confirmed_at).days
        if age_days > stale_after_days:
            stale_source_ids.extend(fact.source_ids)

    gaps: list[str] = []
    corpus = " ".join(fact.text.lower() for fact in usable)
    for topic in required_topics or []:
        if topic.lower() not in corpus:
            gaps.append(topic)

    return ContextPacket(
        facts=usable,
        gaps=gaps,
        stale_source_ids=list(dict.fromkeys(stale_source_ids)),
    )
