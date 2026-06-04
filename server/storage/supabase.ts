import { createClient } from "@supabase/supabase-js";
import type { AdjudicationResult, ClaimInput, ManualReviewAction } from "../types";
import { completeMemoryReview, getMemoryClaim, listMemoryClaims, saveMemoryClaim } from "./memory";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function saveClaim(claim: ClaimInput, result: AdjudicationResult) {
  const supabase = getSupabase();
  if (!supabase) return saveMemoryClaim(claim, result);

  const claimWrite = await supabase.from("claims").upsert({
    id: result.claim_id,
    member_id: claim.member_id,
    member_name: claim.member_name,
    treatment_date: claim.treatment_date,
    claim_amount: claim.claim_amount,
    status: result.decision,
    raw_payload: claim
  });
  if (claimWrite.error) return handleWriteError(claimWrite.error, claim, result);

  const extractionWrite = await supabase.from("extracted_fields").upsert({
    claim_id: result.claim_id,
    fields: result.extracted_fields,
    confidence_score: result.extracted_fields?.confidence_score ?? result.confidence_score
  });
  if (extractionWrite.error) return handleWriteError(extractionWrite.error, claim, result);

  const resultWrite = await supabase.from("adjudication_results").upsert({
    claim_id: result.claim_id,
    decision: result.decision,
    approved_amount: result.approved_amount,
    rejection_reasons: result.rejection_reasons,
    confidence_score: result.confidence_score,
    notes: result.notes,
    next_steps: result.next_steps,
    rule_explanations: result.rule_explanations,
    full_result: result
  });
  if (resultWrite.error) return handleWriteError(resultWrite.error, claim, result);

  const auditWrite = await supabase.from("audit_logs").insert({
    claim_id: result.claim_id,
    event_type: "ADJUDICATED",
    message: `Claim ${result.claim_id} adjudicated as ${result.decision}`,
    metadata: result
  });
  if (auditWrite.error) return handleWriteError(auditWrite.error, claim, result);

  return { id: result.claim_id, claim, result };
}

export async function listClaims() {
  const supabase = getSupabase();
  if (!supabase) return listMemoryClaims();

  const { data, error } = await supabase
    .from("adjudication_results")
    .select("claim_id, full_result, claims(raw_payload)")
    .order("created_at", { ascending: false });
  if (error) return handleReadError(error, listMemoryClaims());

  return (data ?? []).map((row) => ({
    id: row.claim_id as string,
    claim: claimPayload(row.claims),
    result: row.full_result as AdjudicationResult
  }));
}

export async function getClaim(id: string) {
  const supabase = getSupabase();
  if (!supabase) return getMemoryClaim(id);

  const { data, error } = await supabase
    .from("adjudication_results")
    .select("claim_id, full_result, claims(raw_payload)")
    .eq("claim_id", id)
    .single();
  if (error) return handleReadError(error, getMemoryClaim(id));

  return {
    id: data.claim_id as string,
    claim: claimPayload(data.claims),
    result: data.full_result as AdjudicationResult
  };
}

export async function completeReview(
  id: string,
  action: Omit<ManualReviewAction, "reviewed_at" | "previous_decision">
) {
  const supabase = getSupabase();
  if (!supabase) return completeMemoryReview(id, action);

  const current = await getClaim(id);
  if (!current?.claim) return undefined;
  const claim = current.claim;

  const reviewed_at = new Date().toISOString();
  const review: ManualReviewAction = {
    ...action,
    reviewed_at,
    previous_decision: current.result.decision
  };
  const approvedAmount =
    action.action === "APPROVE"
      ? current.result.rule_explanations.find((rule) => rule.rule === "Limit Validation")?.approvedAmount ??
        claim.claim_amount
      : 0;
  const result: AdjudicationResult = {
    ...current.result,
    decision: action.action === "APPROVE" ? "APPROVED" : "REJECTED",
    approved_amount: approvedAmount,
    notes: action.review_notes || `Manual reviewer ${action.action === "APPROVE" ? "approved" : "rejected"} this claim.`,
    next_steps:
      action.action === "APPROVE"
        ? "Manual review complete. Claim is ready for payout."
        : "Manual review complete. Claimant may appeal with additional documentation.",
    review,
    audit_trail: [
      ...(current.result.audit_trail ?? []),
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

  const claimWrite = await supabase.from("claims").update({ status: result.decision }).eq("id", id);
  if (claimWrite.error) return handleWriteError(claimWrite.error, claim, result);

  const resultWrite = await supabase
    .from("adjudication_results")
    .update({
      decision: result.decision,
      approved_amount: result.approved_amount,
      notes: result.notes,
      next_steps: result.next_steps,
      full_result: result
    })
    .eq("claim_id", id);
  if (resultWrite.error) return handleWriteError(resultWrite.error, claim, result);

  const auditWrite = await supabase.from("audit_logs").insert({
    claim_id: id,
    event_type: "MANUAL_REVIEW_COMPLETED",
    message: `Manual reviewer ${action.action === "APPROVE" ? "approved" : "rejected"} the claim.`,
    metadata: review
  });
  if (auditWrite.error) return handleWriteError(auditWrite.error, claim, result);

  return { id, claim, result };
}

function claimPayload(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  return (row as { raw_payload?: ClaimInput } | null)?.raw_payload;
}

function handleWriteError(error: { code?: string; message?: string }, claim: ClaimInput, result: AdjudicationResult) {
  if (isMissingSchemaError(error)) {
    warnMissingSchema(error);
    return saveMemoryClaim(claim, result);
  }
  throw new Error(`Supabase write failed: ${error.message ?? "unknown error"}`);
}

function handleReadError<T>(error: { code?: string; message?: string }, fallback: T) {
  if (isMissingSchemaError(error)) {
    warnMissingSchema(error);
    return fallback;
  }
  throw new Error(`Supabase read failed: ${error.message ?? "unknown error"}`);
}

function isMissingSchemaError(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || Boolean(error.message?.includes("Could not find the table"));
}

function warnMissingSchema(error: { code?: string; message?: string }) {
  console.warn(
    [
      "Supabase schema is not ready; using in-memory storage for this dev session.",
      "Run supabase/schema.sql in your Supabase SQL editor, then restart the dev server.",
      `Supabase error: ${error.code ?? "unknown"} ${error.message ?? ""}`.trim()
    ].join(" ")
  );
}
