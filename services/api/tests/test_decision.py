from app.decision import choose_autonomy_stage
from app.models import AutonomyStage, DecisionRequest


def test_executes_reversible_low_risk_high_confidence_action():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="archive_newsletter",
            confidence=0.99,
            reversible=True,
            consequence="low",
        )
    )
    assert result.stage == AutonomyStage.EXECUTE


def test_high_consequence_is_only_surfaced():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="wire_transfer",
            confidence=0.999,
            reversible=False,
            consequence="high",
        )
    )
    assert result.stage == AutonomyStage.SURFACE


def test_mid_confidence_becomes_draft():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="reply_thanks",
            confidence=0.9,
            reversible=True,
            consequence="low",
        )
    )
    assert result.stage == AutonomyStage.DRAFT
