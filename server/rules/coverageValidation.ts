import type { ClaimLineItem, RuleContext, RuleOutcome } from "../types";
import { containsAny, inferLineItems, mergedClaimText, normalize } from "./helpers";

export type CoverageOutcome = RuleOutcome & {
  coveredAmount: number;
  rejectedItems: string[];
  items: ClaimLineItem[];
  hasDentalPartial: boolean;
  hasNetworkProvider: boolean;
  isAlternativeMedicine: boolean;
};

export function runCoverageValidation(ctx: RuleContext): CoverageOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const rejectedItems: string[] = [];
  const { claim, policy, extracted } = ctx;
  const text = mergedClaimText(claim, extracted);
  const items = inferLineItems(claim, extracted);
  const hasNetworkProvider = policy.network_hospitals.some((name) =>
    normalize(claim.hospital ?? extracted.hospital_name).includes(normalize(name))
  );
  const isAlternativeMedicine = isAltMedicine(text, ctx);

  if (containsAny(text, ["weight loss", "bariatric", "obesity", "diet plan"])) {
    reasons.push("SERVICE_NOT_COVERED");
  }

  if (containsAny(text, ["experimental", "unproven"])) {
    reasons.push("EXPERIMENTAL_TREATMENT");
  }

  if (requiresPreAuth(text, ctx) && !claim.pre_authorization) {
    reasons.push("PRE_AUTH_MISSING");
  }

  const evaluatedItems = items.map((item) => evaluateItem(item, ctx));
  for (const item of evaluatedItems) {
    if (!item.covered) {
      rejectedItems.push(`${item.label} - ${item.reason ?? "not covered"}`);
    }
  }

  const coveredAmount = evaluatedItems
    .filter((item) => item.covered)
    .reduce((sum, item) => sum + item.amount, 0);
  const hasDentalPartial = evaluatedItems.some((item) => item.category === "dental" && !item.covered);

  return {
    reasons,
    coveredAmount: reasons.includes("SERVICE_NOT_COVERED") ? 0 : coveredAmount,
    rejectedItems,
    items: evaluatedItems,
    hasDentalPartial,
    hasNetworkProvider,
    isAlternativeMedicine,
    explanation: {
      rule: "Coverage Verification",
      status: reasons.length ? "failed" : rejectedItems.length ? "partial" : "passed",
      reasons,
      message: coverageMessage(reasons, rejectedItems, isAlternativeMedicine)
    }
  };
}

function evaluateItem(item: ClaimLineItem, ctx: RuleContext): ClaimLineItem {
  const label = normalize(item.label);
  if (label.includes("whitening") || label.includes("cosmetic")) {
    return { ...item, covered: false, reason: "cosmetic procedure" };
  }
  if (item.category === "dental") {
    const covered = ctx.policy.coverage_details.dental.procedures_covered.some((procedure) =>
      label.includes(normalize(procedure))
    );
    return covered ? { ...item, covered: true } : { ...item, covered: false, reason: "dental procedure not covered" };
  }
  return { ...item, covered: item.covered ?? true };
}

function requiresPreAuth(text: string, ctx: RuleContext) {
  const highValueDiagnostic = ctx.claim.claim_amount > ctx.policy.coverage_details.diagnostic_tests.sub_limit;
  return containsAny(text, ["mri", "ct scan"]) && highValueDiagnostic;
}

function isAltMedicine(text: string, ctx: RuleContext) {
  return [...ctx.policy.coverage_details.alternative_medicine.covered_treatments, "vaidya", "panchakarma"].some(
    (treatment) => normalize(text).includes(normalize(treatment))
  );
}

function coverageMessage(reasons: RuleOutcome["reasons"], rejectedItems: string[], isAlternative: boolean) {
  if (reasons.includes("PRE_AUTH_MISSING")) return "MRI requires pre-authorization for claims above ₹10000.";
  if (reasons.includes("SERVICE_NOT_COVERED")) return "Weight loss treatments are excluded from coverage.";
  if (reasons.includes("EXPERIMENTAL_TREATMENT")) return "Experimental or unproven treatments are not covered.";
  if (rejectedItems.length) return `Covered and non-covered services were separated: ${rejectedItems.join(", ")}.`;
  if (isAlternative) return "Alternative medicine covered under policy.";
  return "Treatment category is covered and no policy exclusion applies.";
}
