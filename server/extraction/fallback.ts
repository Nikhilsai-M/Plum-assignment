import type { ClaimInput, ExtractedFields } from "../types";
import { extractArray, getBill, getPrescription } from "../rules/helpers";

export function extractFromClaimInput(claim: ClaimInput): ExtractedFields {
  const prescription = getPrescription(claim) ?? {};
  const bill = getBill(claim) ?? {};
  const tests = [
    ...extractArray(prescription.tests_prescribed),
    ...extractArray(bill.test_names)
  ];
  const procedures = [
    ...extractArray(prescription.procedures),
    typeof prescription.treatment === "string" ? prescription.treatment : undefined
  ].filter((value): value is string => Boolean(value));

  return {
    patient_name: claim.member_name,
    doctor_name: typeof prescription.doctor_name === "string" ? prescription.doctor_name : undefined,
    doctor_registration: typeof prescription.doctor_reg === "string" ? prescription.doctor_reg : undefined,
    diagnosis: typeof prescription.diagnosis === "string" ? prescription.diagnosis : undefined,
    treatment_date: claim.treatment_date,
    medicines: extractArray(prescription.medicines_prescribed),
    tests,
    procedures,
    hospital_name: claim.hospital,
    claim_amount: claim.claim_amount,
    document_types: Object.keys(claim.documents),
    document_quality: "clear",
    confidence_score: claim.system_confidence ?? 0.9,
    raw_text: JSON.stringify(claim.documents)
  };
}
