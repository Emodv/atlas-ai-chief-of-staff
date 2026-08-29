from .models import AutonomyStage, DecisionRequest, DecisionResponse, TrustLevel


BLOCKED_TASK_FRAGMENTS = {
    "legal",
    "tax",
    "medical",
    "employment_offer",
    "pricing_commitment",
    "wire_transfer",
    "payment",
    "purchase",
    "trade",
    "investment",
    "contract",
    "refund",
    "guarantee",
    "delete_account",
}

# Standing owner-approved low-risk actions. These still require permission,
# fresh context, no sensitive data, low consequence, and reversibility.
APPROVED_LOW_RISK_ACTIONS = {
    "relationship_checkin",
    "lead_checkin",
    "lead_reactivation",
    "old_contact_reconnect",
    "simple_acknowledgement",
    "basic_capability_reply",
    "basic_factual_reply",
    "calendar_coordination",
    "share_booking_link",
    "crm_hygiene",
    "internal_record_update",
    "lead_segmentation",
    "lead_scoring",
    "research",
    "seo_content_update",
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

    Confidence never overrides consequence, sensitivity, permission, stale
    context, or the explicit blocked-action registry. Approved low-risk actions
    can execute at a slightly lower confidence threshold because the owner has
    granted a standing rule for those categories.
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

    if (
        normalized_task in APPROVED_LOW_RISK_ACTIONS
        and request.confidence >= 0.75
        and request.consequence == "low"
    ):
        return _response(
            AutonomyStage.EXECUTE,
            TrustLevel.GREEN,
            "Handled",
            "Standing rule permits this low-risk reversible action and context is sufficient.",
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
