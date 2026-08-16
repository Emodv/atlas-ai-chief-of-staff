from collections import Counter
from dataclasses import dataclass

from .models import TwinProfile


@dataclass
class MessageSample:
    body: str
    language: str = "en"


def build_twin_profile(user_id: str, samples: list[MessageSample]) -> TwinProfile:
    """Build a first-pass behavioral profile from historical message samples.

    This is intentionally deterministic for the MVP. The production learner can
    enrich these features with embeddings/LLM extraction while preserving the
    same typed profile and evaluation interface.
    """

    if not samples:
        return TwinProfile(user_id=user_id)

    word_counts = [max(1, len(sample.body.split())) for sample in samples]
    avg_words = sum(word_counts) / len(word_counts)
    language_counts = Counter(sample.language for sample in samples)

    concise = max(0.0, min(1.0, 1 - (avg_words / 120)))
    direct_markers = ("yes", "no", "sure", "done", "perfect", "let's", "please")
    warm_markers = ("thank", "thanks", "love", "great", "azizam", "appreciate")

    all_text = " ".join(sample.body.lower() for sample in samples)
    direct_hits = sum(all_text.count(marker) for marker in direct_markers)
    warm_hits = sum(all_text.count(marker) for marker in warm_markers)
    scale = max(1, len(samples))

    return TwinProfile(
        user_id=user_id,
        concise=round(concise, 3),
        direct=min(1.0, 0.45 + direct_hits / (scale * 3)),
        warm=min(1.0, 0.45 + warm_hits / (scale * 3)),
        commercial_clarity=0.5,
        preferred_languages=[language for language, _ in language_counts.most_common()],
        style_notes=[
            f"Average historical message length: {avg_words:.1f} words",
            "Profile is an MVP baseline and should be refined by correction feedback.",
        ],
        decision_rules=[],
    )
