from .models import AutonomyStage, DecisionRequest, DecisionResponse


BLOCKED_TASK_FRAGMENTS = {
    "legal",
    "tax",
    "medical",
    "employment_offer",
    "pricing_commitment",
    "wire_transfer",
    "delete_account",
}


def choose_autonomy_stage(request: DecisionRequest) -> DecisionResponse:
    """Choose how far Atlas may go for a task.

    The policy deliberately favors reversible action while preserving a hard
    boundary around consequential or sensitive decisions. This module should
    remain deterministic and testable even when the reasoning layer later uses
    an LLM.
    """

    normalized_task = request.task_type.lower().replace(" ", "_")

    if request.contains_sensitive_data:
        return DecisionResponse(
            stage=AutonomyStage.SURFACE,
            reason="Sensitive data requires explicit human attention.",
        )

    if request.consequence == "high" or any(
        fragment in normalized_task for fragment in BLOCKED_TASK_FRAGMENTS
    ):
        return DecisionResponse(
            stage=AutonomyStage.SURFACE,
            reason="High-consequence category is not eligible for autonomous execution.",
        )

    if not request.reversible:
        return DecisionResponse(
            stage=AutonomyStage.RECOMMEND,
            reason="Irreversible action requires human approval.",
        )

    if request.confidence >= 0.97 and request.consequence == "low":
        return DecisionResponse(
            stage=AutonomyStage.EXECUTE,
            reason="High confidence, low consequence, and reversible.",
        )

    if request.confidence >= 0.85:
        return DecisionResponse(
            stage=AutonomyStage.DRAFT,
            reason="Confidence is strong enough to prepare the action but not execute it.",
        )

    if request.confidence >= 0.65:
        return DecisionResponse(
            stage=AutonomyStage.RECOMMEND,
            reason="Atlas has a useful prediction but needs confirmation.",
        )

    return DecisionResponse(
        stage=AutonomyStage.SURFACE,
        reason="Confidence is too low; preserve signal without guessing.",
    )
