import type { ClaimInput, ClaimLineItem, ExtractedFields } from "../types";

export function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function daysBetween(start: string, end: string) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24));
}

export function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function containsAny(text: string, terms: string[]) {
  const normalized = normalize(text);
  return terms.some((term) => normalized.includes(normalize(term)));
}

export function extractArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function getPrescription(claim: ClaimInput) {
  return claim.documents.prescription as Record<string, unknown> | undefined;
}

export function getBill(claim: ClaimInput) {
  return claim.documents.bill as Record<string, unknown> | undefined;
}

export function mergedClaimText(claim: ClaimInput, extracted: ExtractedFields) {
  return [
    claim.member_name,
    claim.hospital,
    claim.provider,
    extracted.patient_name,
    extracted.doctor_name,
    extracted.doctor_registration,
    extracted.diagnosis,
    extracted.hospital_name,
    extracted.raw_text,
    ...(extracted.medicines ?? []),
    ...(extracted.tests ?? []),
    ...(extracted.procedures ?? []),
    JSON.stringify(claim.documents)
  ]
    .filter(Boolean)
    .join(" ");
}

export function amountFromBill(claim: ClaimInput, key: string) {
  const bill = getBill(claim);
  const value = bill?.[key];
  return typeof value === "number" ? value : 0;
}

export function inferLineItems(claim: ClaimInput, extracted: ExtractedFields): ClaimLineItem[] {
  if (extracted.line_items?.length) return extracted.line_items;
  const bill = getBill(claim) ?? {};
  const items: ClaimLineItem[] = [];

  const push = (label: string, amount: unknown, category: ClaimLineItem["category"]) => {
    if (typeof amount === "number" && amount > 0) items.push({ label, amount, category, covered: true });
  };

  push("Consultation fee", bill.consultation_fee, "consultation");
  push("Diagnostic tests", bill.diagnostic_tests, "diagnostic");
  push("Medicines", bill.medicines, "pharmacy");
  push("MRI scan", bill.mri_scan, "diagnostic");
  push("Root canal treatment", bill.root_canal, "dental");
  push("Teeth whitening", bill.teeth_whitening, "dental");
  push("Therapy charges", bill.therapy_charges, "alternative_medicine");
  push("Diet plan", bill.diet_plan, "other");

  if (!items.length && claim.claim_amount > 0) {
    items.push({ label: "Claim amount", amount: claim.claim_amount, category: "other", covered: true });
  }

  return items;
}

export function isDoctorRegistrationValid(reg?: string) {
  if (!reg) return false;
  return /^([A-Z]{2}|AYUR\/[A-Z]{2})\/\d{4,6}\/\d{4}$/i.test(reg.trim());
}
