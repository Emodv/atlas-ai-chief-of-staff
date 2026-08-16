from .models import AutonomyStage, DecisionRequest, DecisionResponse, TrustLevel


BLOCKED_TASK_FRAGMENTS = {
    "legal",
    "tax",
    "medical",
    "employment_offer",
    "pricing_commitment",
    "wire_transfer",
    "delete_account",
}


def _response(
    stage: AutonomyStage,
    trust: TrustLevel,
    summary: str,
    reason: str,
) -> DecisionResponse:
    return DecisionResponse(stage=stage, trust=trust, summary=summary, reason=reason)


def choose_autonomy_stage(request: DecisionRequest) -> DecisionResponse:
    """Choose how far Atlas may go while exposing only human trust buckets.

    Internal confidence remains numeric for evaluation. Users see Green, Yellow,
    or Red. Risk, missing permissions, stale context, and knowledge gaps can
    always downgrade the trust bucket regardless of model confidence.
    """

    normalized_task = request.task_type.lower().replace(" ", "_")

    if not request.has_required_permission:
        return _response(
            AutonomyStage.SURFACE,
            TrustLevel.RED,
            "Needs you",
            "Required connector permission is missing.",
        )

    if request.contains_sensitive_data:
        return _response(
            AutonomyStage.SURFACE,
            TrustLevel.RED,
            "Needs you",
            "Sensitive data requires explicit human attention.",
        )

    if request.consequence == "high" or any(
        fragment in normalized_task for fragment in BLOCKED_TASK_FRAGMENTS
    ):
        return _response(
            AutonomyStage.SURFACE,
            TrustLevel.RED,
            "Needs you",
            "High-consequence category is not eligible for autonomous execution.",
        )

    if request.context_gap:
        return _response(
            AutonomyStage.SURFACE,
            TrustLevel.RED,
            "Needs you",
            "Atlas is missing context required to act safely.",
        )

    if request.context_is_stale:
        return _response(
            AutonomyStage.RECOMMEND,
            TrustLevel.YELLOW,
            "Review",
            "The relevant context may be stale, so Atlas will not act autonomously.",
        )

    if not request.reversible:
        return _response(
            AutonomyStage.RECOMMEND,
            TrustLevel.YELLOW,
            "Review",
            "The action is not safely reversible.",
        )

    if request.confidence >= 0.85 and request.consequence == "low":
        return _response(
            AutonomyStage.EXECUTE,
            TrustLevel.GREEN,
            "Handled",
            "Pattern is familiar, consequence is low, and the action is reversible.",
        )

    if request.confidence >= 0.50:
        stage = AutonomyStage.DRAFT if request.consequence == "low" else AutonomyStage.RECOMMEND
        return _response(
            stage,
            TrustLevel.YELLOW,
            "Review",
            "Atlas has a useful prediction but should not execute it without review.",
        )

    return _response(
        AutonomyStage.SURFACE,
        TrustLevel.RED,
        "Needs you",
        "Atlas is not sure enough to guess.",
    )
