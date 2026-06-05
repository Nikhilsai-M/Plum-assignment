import type { RuleContext, RuleOutcome } from "../types";
import { getPrescription, isDoctorRegistrationValid, normalize } from "./helpers";

export function runDocumentValidation(ctx: RuleContext): RuleOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const { claim, extracted } = ctx;

  const prescription = getPrescription(claim);

  const documentTypes =
    extracted.document_types?.map((type) =>
      type.toLowerCase().trim()
    ) ?? [];

  const hasPrescriptionDocument =
    documentTypes.includes("prescription") ||
    documentTypes.some((type) => type.includes("prescription"));

  const hasPrescriptionEvidence = Boolean(
    extracted.doctor_registration ||
    extracted.doctor_name ||
    extracted.diagnosis ||
    (Array.isArray(extracted.medicines) &&
      extracted.medicines.length > 0)
  );

  const hasPrescription = Boolean(
    prescription ||
      hasPrescriptionDocument ||
      hasPrescriptionEvidence
  );

  if (!hasPrescription) {
    reasons.push("MISSING_DOCUMENTS");
  }

  if (extracted.document_quality === "illegible") {
    reasons.push("ILLEGIBLE_DOCUMENTS");
  }

  if (hasPrescription && !extracted.diagnosis) {
    reasons.push("INVALID_PRESCRIPTION");
  }

  if (
    hasPrescription &&
    !reasons.includes("MISSING_DOCUMENTS") &&
    !isDoctorRegistrationValid(extracted.doctor_registration)
  ) {
    reasons.push("DOCTOR_REG_INVALID");
  }

  if (
    extracted.treatment_date &&
    extracted.treatment_date !== claim.treatment_date
  ) {
    reasons.push("DATE_MISMATCH");
  }

  if (
    extracted.patient_name &&
    !namesMatch(extracted.patient_name, claim.member_name)
  ) {
    reasons.push("PATIENT_MISMATCH");
  }

  return {
    reasons,
    explanation: {
      rule: "Document Validation",
      status: reasons.length ? "failed" : "passed",
      reasons,
      message: reasons.length
        ? documentMessage(reasons)
        : "Required OPD documents are complete, readable, and internally consistent."
    }
  };
}

function namesMatch(left: string, right: string) {
  const a = normalize(left).split(" ").filter(Boolean);
  const b = normalize(right).split(" ").filter(Boolean);

  if (!a.length || !b.length) {
    return false;
  }

  return (
    a.every((part) => b.includes(part)) ||
    b.every((part) => a.includes(part))
  );
}

function documentMessage(reasons: RuleOutcome["reasons"]) {
  if (reasons.includes("MISSING_DOCUMENTS")) {
    return "Prescription from registered doctor is required.";
  }

  if (reasons.includes("DOCTOR_REG_INVALID")) {
    return "Doctor registration number is missing or does not match the required format.";
  }

  if (reasons.includes("DATE_MISMATCH")) {
    return "Treatment dates across submitted documents do not match.";
  }

  if (reasons.includes("PATIENT_MISMATCH")) {
    return "Patient details do not match policy records.";
  }

  if (reasons.includes("ILLEGIBLE_DOCUMENTS")) {
    return "Submitted documents are not readable enough for automated adjudication.";
  }

  return "Prescription is incomplete or invalid.";
}