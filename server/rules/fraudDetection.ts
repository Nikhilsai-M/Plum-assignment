import type { RuleContext, RuleExplanation } from "../types";

export type FraudOutcome = {
  manualReview: boolean;
  flags: string[];
  explanation: RuleExplanation;
};

export function runFraudDetection(ctx: RuleContext): FraudOutcome {
  const flags: string[] = [];
  const claim = ctx.claim;

  if ((claim.previous_claims_same_day ?? 0) >= 3) {
    flags.push("Multiple claims same day", "Unusual pattern detected");
  }
  if (claim.suspicious_frequency) flags.push("Suspicious frequency of claims");
  if (claim.duplicate_claim) flags.push("Duplicate claim pattern detected");
  if (claim.altered_documents) flags.push("Potentially altered documents");
  if (claim.claim_amount > 25000) flags.push("High-value claim requires human review");
  if ((claim.system_confidence ?? ctx.extracted.confidence_score ?? 1) < 0.7) {
    flags.push("System confidence below 70%");
  }

  return {
    manualReview: flags.length > 0,
    flags,
    explanation: {
      rule: "Fraud Detection",
      status: flags.length ? "manual_review" : "passed",
      reasons: [],
      flags,
      message: flags.length ? flags.join("; ") : "No duplicate, alteration, frequency, or high-value fraud flags detected."
    }
  };
}
