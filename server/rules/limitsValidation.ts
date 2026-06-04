import type { ClaimInput, PolicyTerms, RuleOutcome } from "../types";
import type { CoverageOutcome } from "./coverageValidation";

export type LimitsOutcome = RuleOutcome & {
  payableAmount: number;
  deductions: Record<string, number>;
  networkDiscount: number;
  cashlessApproved: boolean;
};

export function runLimitsValidation(
  claim: ClaimInput,
  policy: PolicyTerms,
  coverage: CoverageOutcome
): LimitsOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const deductions: Record<string, number> = {};
  const coverageBlocked = coverage.reasons.length > 0;
  let payableAmount = coverage.coveredAmount;
  let networkDiscount = 0;
  const isDentalPartial = coverage.hasDentalPartial && coverage.coveredAmount > 0;

  if (!coverageBlocked && claim.claim_amount < policy.claim_requirements.minimum_claim_amount) {
    reasons.push("BELOW_MIN_AMOUNT");
  }

  const ytd = claim.previous_claims_ytd ?? 0;
  if (!coverageBlocked && ytd + claim.claim_amount > policy.coverage_details.annual_limit) {
    reasons.push("ANNUAL_LIMIT_EXCEEDED");
  }

  if (!coverageBlocked && !isDentalPartial && claim.claim_amount > policy.coverage_details.per_claim_limit) {
    reasons.push("PER_CLAIM_EXCEEDED");
  }

  if (coverage.hasNetworkProvider) {
    networkDiscount = Math.round(payableAmount * (policy.coverage_details.consultation_fees.network_discount / 100));
    payableAmount -= networkDiscount;
  } else if (!coverage.isAlternativeMedicine && !isDentalPartial && payableAmount > 0) {
    deductions.copay = Math.round(payableAmount * (policy.coverage_details.consultation_fees.copay_percentage / 100));
    payableAmount -= deductions.copay;
  }

  const cashlessApproved =
    Boolean(claim.cashless_request) &&
    policy.cashless_facilities.available &&
    coverage.hasNetworkProvider &&
    payableAmount <= policy.cashless_facilities.instant_approval_limit;

  return {
    reasons,
    payableAmount: reasons.length ? 0 : Math.max(0, payableAmount),
    deductions,
    networkDiscount,
    cashlessApproved,
    explanation: {
      rule: "Limit Validation",
      status: reasons.length ? "failed" : "passed",
      reasons,
      approvedAmount: reasons.length ? 0 : Math.max(0, payableAmount),
      message: limitMessage(reasons, policy)
    }
  };
}

function limitMessage(reasons: RuleOutcome["reasons"], policy: PolicyTerms) {
  if (reasons.includes("PER_CLAIM_EXCEEDED")) {
    return `Claim amount exceeds per-claim limit of ₹${policy.coverage_details.per_claim_limit}.`;
  }
  if (reasons.includes("ANNUAL_LIMIT_EXCEEDED")) return "Annual OPD limit is exhausted for this member.";
  if (reasons.includes("BELOW_MIN_AMOUNT")) {
    return `Claim is below the minimum claim amount of ₹${policy.claim_requirements.minimum_claim_amount}.`;
  }
  return "Claim is within annual, per-claim, and applicable sub-limits after deductions.";
}
