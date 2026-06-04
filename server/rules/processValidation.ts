import type { RuleContext, RuleOutcome } from "../types";
import { daysBetween } from "./helpers";

export function runProcessValidation(ctx: RuleContext): RuleOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const submittedAt = ctx.claim.submitted_at;

  if (submittedAt && daysBetween(ctx.claim.treatment_date, submittedAt) > ctx.policy.claim_requirements.submission_timeline_days) {
    reasons.push("LATE_SUBMISSION");
  }
  if (ctx.claim.duplicate_claim) reasons.push("DUPLICATE_CLAIM");

  return {
    reasons,
    explanation: {
      rule: "Process Validation",
      status: reasons.length ? "failed" : "passed",
      reasons,
      message: reasons.length
        ? "Claim violates submission timeline or duplicate-claim process rules."
        : "Submission timeline and duplicate-claim checks passed."
    }
  };
}
