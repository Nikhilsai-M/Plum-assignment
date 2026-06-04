import type { AdjudicationResult, ClaimInput, ManualReviewAction } from "../types";

export type StoredClaim = {
  id: string;
  claim: ClaimInput;
  result: AdjudicationResult;
};

const globalStore = globalThis as typeof globalThis & {
  plumClaims?: StoredClaim[];
};

export const memoryClaims = globalStore.plumClaims ?? [];
globalStore.plumClaims = memoryClaims;

export function saveMemoryClaim(claim: ClaimInput, result: AdjudicationResult) {
  const existingIndex = memoryClaims.findIndex((item) => item.id === result.claim_id);
  const record = { id: result.claim_id, claim, result };
  if (existingIndex >= 0) memoryClaims[existingIndex] = record;
  else memoryClaims.unshift(record);
  return record;
}

export function listMemoryClaims() {
  return memoryClaims;
}

export function getMemoryClaim(id: string) {
  return memoryClaims.find((item) => item.id === id);
}

export function completeMemoryReview(
  id: string,
  action: Omit<ManualReviewAction, "reviewed_at" | "previous_decision">
) {
  const record = getMemoryClaim(id);
  if (!record) return undefined;
  const reviewed_at = new Date().toISOString();
  const previous_decision = record.result.decision;
  const review: ManualReviewAction = { ...action, reviewed_at, previous_decision };
  record.result = {
    ...record.result,
    decision: action.action === "APPROVE" ? "APPROVED" : "REJECTED",
    approved_amount: action.action === "APPROVE" ? payableAmount(record.result, record.claim.claim_amount) : 0,
    notes: action.review_notes || `Manual reviewer ${action.action === "APPROVE" ? "approved" : "rejected"} this claim.`,
    next_steps:
      action.action === "APPROVE"
        ? "Manual review complete. Claim is ready for payout."
        : "Manual review complete. Claimant may appeal with additional documentation.",
    review,
    audit_trail: [
      ...(record.result.audit_trail ?? []),
      {
        event_type: "MANUAL_REVIEW_COMPLETED",
        message: `Manual reviewer ${action.action === "APPROVE" ? "approved" : "rejected"} the claim.`,
        created_at: reviewed_at,
        metadata: {
          reviewed_by: action.reviewed_by,
          review_notes: action.review_notes
        }
      }
    ]
  };
  return record;
}

function payableAmount(result: AdjudicationResult, fallbackAmount: number) {
  return result.rule_explanations.find((rule) => rule.rule === "Limit Validation")?.approvedAmount ?? fallbackAmount;
}
