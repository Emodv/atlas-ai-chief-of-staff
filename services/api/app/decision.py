from .models import AutonomyStage, DecisionRequest, DecisionResponse, TrustLevel


HARD_BLOCKED_TASK_FRAGMENTS = {
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
    "security_change",
    "credential",
    "password",
}

# Owner-approved autonomous operating territory. These tasks are intended to be
# handled rather than merely suggested when the request is non-sensitive, the
# connector is authorized, context is current, and the action can be verified.
APPROVED_AUTONOMOUS_ACTIONS = {
    "relationship_checkin",
    "lead_checkin",
    "lead_reactivation",
    "old_contact_reconnect",
    "simple_acknowledgement",
    "basic_capability_reply",
    "basic_factual_reply",
    "inbound_lead_reply",
    "calendar_coordination",
    "meeting_coordination",
    "share_booking_link",
    "crm_hygiene",
    "internal_record_update",
    "lead_segmentation",
    "lead_scoring",
    "prospect_research",
    "research",
    "opportunity_scoring",
    "opportunity_research",
    "relationship_research",
    "seo_content_update",
    "content_refresh",
    "safe_site_optimization",
    "data_cleanup",
    "data_deduplication",
    "document_organization",
    "meeting_brief",
    "proposal_draft",
    "followup_draft",
}

# Medium-consequence work may be prepared aggressively, but the final external
# commitment stays with the user unless an explicit standing rule says otherwise.
REVIEW_REQUIRED_FRAGMENTS = {
    "discount",
    "custom_price",
    "scope_commitment",
    "public_publish",
    "mass_outreach",
    "bulk_send",
    "vendor_commitment",
    "offer_acceptance",
}


def _response(
    stage: AutonomyStage,
    trust: TrustLevel,
    summary: str,
    reason: str,
) -> DecisionResponse:
    return DecisionResponse(stage=stage, trust=trust, summary=summary, reason=reason)


def choose_autonomy_stage(request: DecisionRequest) -> DecisionResponse:
    """Choose the highest safe action level for Atlas.

    Atlas is designed to be an operating partner, not a passive recommender.
    Standing rules intentionally widen the autonomous zone for bounded business
    and administrative work. Confidence never overrides missing permission,
    sensitivity, stale/missing context, or hard-blocked consequence classes.
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
        fragment in normalized_task for fragment in HARD_BLOCKED_TASK_FRAGMENTS
    ):
        return _response(
            AutonomyStage.SURFACE,
            TrustLevel.RED,
            "Needs you",
            "High-consequence category is outside Atlas autonomous authority.",
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
            "The relevant context may be stale, so Atlas will not act on it yet.",
        )

    if any(fragment in normalized_task for fragment in REVIEW_REQUIRED_FRAGMENTS):
        return _response(
            AutonomyStage.RECOMMEND,
            TrustLevel.YELLOW,
            "Review",
            "Atlas can prepare and pressure-test this work, but the final commitment requires review.",
        )

    if not request.reversible and not request.independently_verifiable:
        return _response(
            AutonomyStage.RECOMMEND,
            TrustLevel.YELLOW,
            "Review",
            "The action is neither safely reversible nor independently verifiable.",
        )

    is_approved = normalized_task in APPROVED_AUTONOMOUS_ACTIONS
    has_standing_authority = request.standing_rule or is_approved

    # Standing authority is deliberately stronger than generic assistant mode.
    # Atlas may execute familiar, bounded business work at 0.70 confidence when
    # the result can be verified and the consequence is low.
    if (
        has_standing_authority
        and request.confidence >= 0.70
        and request.consequence == "low"
        and (request.reversible or request.independently_verifiable)
    ):
        return _response(
            AutonomyStage.EXECUTE,
            TrustLevel.GREEN,
            "Handled",
            "Standing authority covers this bounded action; context, permission, and verification controls are sufficient.",
        )

    # Medium consequence can execute only under an explicit standing rule and
    # only when independently verifiable. This enables real chief-of-staff work
    # without silently crossing into contracts, money, security, or other hard blocks.
    if (
        request.standing_rule
        and request.confidence >= 0.90
        and request.consequence == "medium"
        and request.independently_verifiable
    ):
        return _response(
            AutonomyStage.EXECUTE,
            TrustLevel.GREEN,
            "Handled",
            "Explicit standing authority and independent verification justify bounded medium-consequence execution.",
        )

    if request.confidence >= 0.85 and request.consequence == "low" and request.reversible:
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
            "Atlas has enough signal to prepare the work, but not enough authority or certainty to execute it.",
        )

    return _response(
        AutonomyStage.SURFACE,
        TrustLevel.RED,
        "Needs you",
        "Atlas is not sure enough to guess.",
    )
