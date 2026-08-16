from datetime import datetime, timedelta, timezone

from app.memory import MemoryFact, build_context_packet


def test_context_packet_preserves_sources_and_flags_stale_facts():
    now = datetime(2026, 8, 16, tzinfo=timezone.utc)
    packet = build_context_packet(
        [
            MemoryFact(
                text="Alice is the client lead at Acme.",
                source_ids=("gmail:1",),
                last_confirmed_at=now - timedelta(days=120),
                importance=0.9,
            ),
            MemoryFact(
                text="The next campaign planning call is monthly.",
                source_ids=("calendar:2",),
                last_confirmed_at=now - timedelta(days=5),
                importance=0.8,
            ),
        ],
        required_topics=["Alice", "budget"],
        stale_after_days=90,
        now=now,
    )

    assert packet.facts[0].source_ids == ("gmail:1",)
    assert "gmail:1" in packet.stale_source_ids
    assert packet.gaps == ["budget"]
    assert packet.has_stale_context is True
    assert packet.has_gap is True


def test_contradicted_fact_is_not_used():
    now = datetime(2026, 8, 16, tzinfo=timezone.utc)
    packet = build_context_packet(
        [
            MemoryFact(
                text="Bob works at OldCo.",
                source_ids=("drive:old",),
                last_confirmed_at=now,
                contradicted=True,
            )
        ],
        required_topics=["Bob"],
        now=now,
    )

    assert packet.facts == []
    assert packet.gaps == ["Bob"]
