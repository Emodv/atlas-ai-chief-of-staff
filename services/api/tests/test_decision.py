from app.decision import choose_autonomy_stage
from app.models import AutonomyStage, DecisionRequest, TrustLevel


def test_green_executes_reversible_low_risk_familiar_action():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="archive_newsletter",
            confidence=0.91,
            reversible=True,
            consequence="low",
        )
    )
    assert result.stage == AutonomyStage.EXECUTE
    assert result.trust == TrustLevel.GREEN
    assert result.summary == "Handled"


def test_high_consequence_is_red_even_with_high_confidence():
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
    assert result.trust == TrustLevel.RED
    assert result.summary == "Needs you"


def test_yellow_mid_confidence_becomes_draft():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="reply_thanks",
            confidence=0.72,
            reversible=True,
            consequence="low",
        )
    )
    assert result.stage == AutonomyStage.DRAFT
    assert result.trust == TrustLevel.YELLOW
    assert result.summary == "Review"


def test_stale_context_downgrades_to_yellow():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="client_follow_up",
            confidence=0.99,
            reversible=True,
            consequence="low",
            context_is_stale=True,
        )
    )
    assert result.stage == AutonomyStage.RECOMMEND
    assert result.trust == TrustLevel.YELLOW


def test_missing_context_is_red():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="meeting_follow_up",
            confidence=0.99,
            reversible=True,
            consequence="low",
            context_gap=True,
        )
    )
    assert result.stage == AutonomyStage.SURFACE
    assert result.trust == TrustLevel.RED


def test_missing_permission_is_red():
    result = choose_autonomy_stage(
        DecisionRequest(
            user_id="u1",
            task_type="archive_newsletter",
            confidence=0.99,
            has_required_permission=False,
        )
    )
    assert result.trust == TrustLevel.RED
    assert result.reason == "Required connector permission is missing."
