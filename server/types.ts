export type ClaimDecision = "APPROVED" | "REJECTED" | "PARTIAL" | "MANUAL_REVIEW";

export type RejectionReason =
  | "POLICY_INACTIVE"
  | "WAITING_PERIOD"
  | "MEMBER_NOT_COVERED"
  | "MISSING_DOCUMENTS"
  | "ILLEGIBLE_DOCUMENTS"
  | "INVALID_PRESCRIPTION"
  | "DOCTOR_REG_INVALID"
  | "DATE_MISMATCH"
  | "PATIENT_MISMATCH"
  | "SERVICE_NOT_COVERED"
  | "EXCLUDED_CONDITION"
  | "PRE_AUTH_MISSING"
  | "ANNUAL_LIMIT_EXCEEDED"
  | "SUB_LIMIT_EXCEEDED"
  | "PER_CLAIM_EXCEEDED"
  | "NOT_MEDICALLY_NECESSARY"
  | "EXPERIMENTAL_TREATMENT"
  | "COSMETIC_PROCEDURE"
  | "LATE_SUBMISSION"
  | "DUPLICATE_CLAIM"
  | "BELOW_MIN_AMOUNT";

export type RuleStatus = "passed" | "failed" | "partial" | "manual_review";

export type UploadedDocument = {
  id?: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  status?: "uploaded" | "processed";
};

export type ClaimInput = {
  claim_id?: string;
  member_id: string;
  member_name: string;
  member_age?: number;
  member_gender?: string;
  member_join_date?: string;
  treatment_date: string;
  submitted_at?: string;
  claim_amount: number;
  hospital?: string;
  provider?: string;
  cashless_request?: boolean;
  pre_authorization?: boolean;
  previous_claims_same_day?: number;
  previous_claims_ytd?: number;
  suspicious_frequency?: boolean;
  duplicate_claim?: boolean;
  altered_documents?: boolean;
  system_confidence?: number;
  documents: Record<string, unknown>;
  uploaded_documents?: UploadedDocument[];
  extracted_fields?: ExtractedFields;
};

export type ExtractedFields = {
  patient_name?: string;
  doctor_name?: string;
  doctor_registration?: string;
  diagnosis?: string;
  treatment_date?: string;
  medicines?: string[];
  tests?: string[];
  procedures?: string[];
  hospital_name?: string;
  claim_amount?: number;
  line_items?: ClaimLineItem[];
  document_types?: string[];
  document_quality?: "clear" | "partial" | "illegible";
  confidence_score?: number;
  extraction_source?: "gemini" | "fallback";
  extraction_notice?: string;
  raw_text?: string;
};

export type ClaimLineItem = {
  label: string;
  amount: number;
  category: ClaimCategory;
  covered?: boolean;
  reason?: string;
};

export type ClaimCategory =
  | "consultation"
  | "diagnostic"
  | "pharmacy"
  | "dental"
  | "vision"
  | "alternative_medicine"
  | "procedure"
  | "other";

export type RuleExplanation = {
  rule: string;
  status: RuleStatus;
  reasons: RejectionReason[];
  message: string;
  approvedAmount?: number;
  flags?: string[];
};

export type AdjudicationResult = {
  claim_id: string;
  decision: ClaimDecision;
  approved_amount: number;
  rejection_reasons: RejectionReason[];
  confidence_score: number;
  notes: string;
  next_steps: string;
  deductions?: Record<string, number>;
  rejected_items?: string[];
  flags?: string[];
  cashless_approved?: boolean;
  network_discount?: number;
  rule_explanations: RuleExplanation[];
  extracted_fields?: ExtractedFields;
  audit_trail?: AuditEvent[];
  review?: ManualReviewAction;
  created_at: string;
};

export type AuditEvent = {
  event_type:
    | "CLAIM_CREATED"
    | "DOCUMENTS_UPLOADED"
    | "EXTRACTION_COMPLETED"
    | "DECISION_GENERATED"
    | "MANUAL_REVIEW_COMPLETED";
  message: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

export type ManualReviewAction = {
  action: "APPROVE" | "REJECT";
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string;
  previous_decision: ClaimDecision;
};

export type CoveredMember = {
  member_id: string;
  name: string;
  join_date: string;
  age?: number;
  gender?: string;
  relationship?: string;
};

export type PolicyTerms = {
  policy_id: string;
  policy_name: string;
  effective_date: string;
  policy_holder: {
    company: string;
    employees_covered: number;
    dependents_covered: boolean;
  };
  coverage_details: {
    annual_limit: number;
    per_claim_limit: number;
    family_floater_limit: number;
    consultation_fees: {
      covered: boolean;
      sub_limit: number;
      copay_percentage: number;
      network_discount: number;
    };
    diagnostic_tests: {
      covered: boolean;
      sub_limit: number;
      pre_authorization_required: boolean;
      covered_tests: string[];
    };
    pharmacy: {
      covered: boolean;
      sub_limit: number;
      generic_drugs_mandatory: boolean;
      branded_drugs_copay: number;
    };
    dental: {
      covered: boolean;
      sub_limit: number;
      routine_checkup_limit: number;
      procedures_covered: string[];
      cosmetic_procedures: boolean;
    };
    vision: {
      covered: boolean;
      sub_limit: number;
      eye_test_covered: boolean;
      glasses_contact_lenses: boolean;
      lasik_surgery: boolean;
    };
    alternative_medicine: {
      covered: boolean;
      sub_limit: number;
      covered_treatments: string[];
      therapy_sessions_limit: number;
    };
  };
  waiting_periods: {
    initial_waiting: number;
    pre_existing_diseases: number;
    maternity: number;
    specific_ailments: Record<string, number>;
  };
  exclusions: string[];
  claim_requirements: {
    documents_required: string[];
    submission_timeline_days: number;
    minimum_claim_amount: number;
  };
  network_hospitals: string[];
  cashless_facilities: {
    available: boolean;
    network_only: boolean;
    pre_approval_required: boolean;
    instant_approval_limit: number;
  };
};

export type RuleContext = {
  claim: ClaimInput;
  extracted: ExtractedFields;
  policy: PolicyTerms;
  members: CoveredMember[];
};

export type RuleOutcome = {
  reasons: RejectionReason[];
  explanation: RuleExplanation;
};
