import type { RuleContext, RuleOutcome } from "../types";
import { containsAny, getPrescription, mergedClaimText } from "./helpers";

export function runMedicalNecessity(ctx: RuleContext): RuleOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const text = mergedClaimText(ctx.claim, ctx.extracted);
  const diagnosis = ctx.extracted.diagnosis ?? "";

  if (!diagnosis && getPrescription(ctx.claim)) {
    reasons.push("NOT_MEDICALLY_NECESSARY");
  }

  if (containsAny(text, ["cosmetic", "whitening", "lasik"])) {
    reasons.push("COSMETIC_PROCEDURE");
  }

  if (containsAny(text, ["experimental", "unproven"])) {
    reasons.push("EXPERIMENTAL_TREATMENT");
  }

  return {
    reasons,
    explanation: {
      rule: "Medical Necessity Review",
      status: reasons.length ? "failed" : "passed",
      reasons,
      message: reasons.length
        ? "Diagnosis, prescription, or treatment purpose does not establish medical necessity."
        : "Diagnosis and treatment details are clinically consistent for automated review."
    }
  };
}
