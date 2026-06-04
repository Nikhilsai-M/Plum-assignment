import type { ClaimInput, ExtractedFields } from "../../../../server/types";

export function normalizeClaimForSubmission(claim: ClaimInput, extracted: ExtractedFields) {
  const normalized: ClaimInput = {
    ...claim,
    member_id: claim.member_id.trim(),
    member_name: claim.member_name.trim(),
    treatment_date: firstValidDate(claim.treatment_date, extracted.treatment_date) ?? "",
    claim_amount: claim.claim_amount || extracted.claim_amount || 0,
    extracted_fields: extracted
  };

  const errors: string[] = [];
  if (!normalized.member_id) errors.push("Member ID is required.");
  if (!normalized.member_name) errors.push("Member name is required.");
  if (!normalized.treatment_date) errors.push("Treatment date is required. Enter it manually or include it in the uploaded documents.");
  if (!Number.isFinite(normalized.claim_amount) || normalized.claim_amount <= 0) {
    errors.push("Claim amount must be greater than zero.");
  }
  const rawText = extracted.raw_text?.trim();
  const hasRawEvidence = Boolean(rawText && rawText !== "{}");
  if (!Object.keys(normalized.documents ?? {}).length && !normalized.uploaded_documents?.length && !hasRawEvidence) {
    errors.push("At least one supporting document, uploaded file, or pasted document text is required.");
  }
  if (!normalized.extracted_fields) {
    errors.push("Extraction review is required before adjudication.");
  }

  return { claim: normalized, errors };
}

function firstValidDate(...values: Array<string | undefined>) {
  return values.find((value) => value && isValidDate(value));
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
