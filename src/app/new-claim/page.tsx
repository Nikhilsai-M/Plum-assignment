"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileSearch,
  FileText,
  Loader2,
  Pencil,
  Play,
  UploadCloud,
  type LucideIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { apiJson, extractClaim, submitClaim } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ClaimInput, ExtractedFields } from "../../../server/types";

type AssignmentCases = {
  test_cases: Array<{ case_id: string; case_name: string; input_data: ClaimInput }>;
};

type WorkflowStep = {
  number: number;
  label: string;
  description: string;
  icon: LucideIcon;
};

const emptyClaim: ClaimInput = {
  member_id: "",
  member_name: "",
  treatment_date: "",
  claim_amount: 0,
  hospital: "",
  documents: {}
};

const workflowSteps: WorkflowStep[] = [
  { number: 1, label: "Upload Documents", description: "Load evidence", icon: UploadCloud },
  { number: 2, label: "Extraction Preview", description: "Verify AI output", icon: FileSearch },
  { number: 3, label: "Review", description: "Correct claim data", icon: Pencil },
  { number: 4, label: "Adjudication", description: "Run rules", icon: Play }
];

export default function NewClaimPage() {
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimInput>(emptyClaim);
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [extractedJson, setExtractedJson] = useState("");
  const [claimJson, setClaimJson] = useState(JSON.stringify(emptyClaim, null, 2));
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { data: cases } = useQuery({
    queryKey: ["test-cases"],
    queryFn: () => apiJson<AssignmentCases>("/api/test-cases")
  });

  const selectedCaseOptions = useMemo(() => cases?.test_cases ?? [], [cases]);
  const selectedFiles = Array.from(files ?? []);
  const canAdjudicate = Boolean(extractedJson && reviewConfirmed);
  const hasEvidence = Boolean(selectedFiles.length || pastedText.trim() || Object.keys(claim.documents ?? {}).length);
  const currentStep = reviewConfirmed ? 4 : extractedJson ? 3 : hasEvidence ? 2 : 1;

  const extractionMutation = useMutation({
    mutationFn: () => {
      const errors = validateIntake(claim, pastedText, selectedFiles);
      setValidationErrors(errors);
      if (errors.length) throw new Error("Resolve validation errors before extraction.");
      return extractClaim(buildFormData(claim, pastedText, files, undefined));
    },
    onSuccess: ({ extracted: value }) => {
      setExtracted(value);
      setExtractedJson(JSON.stringify(value, null, 2));
      setReviewConfirmed(false);
      setValidationErrors([]);
    }
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const errors = validateSubmission(claim, extractedJson, reviewConfirmed);
      setValidationErrors(errors);
      if (errors.length) throw new Error("Resolve validation errors before adjudication.");
      const edited = JSON.parse(extractedJson) as ExtractedFields;
      return submitClaim(buildFormData(claim, pastedText, files, edited));
    },
    onSuccess: ({ record }) => router.push(`/claims/${record.id}`)
  });

  const updateClaim = (patch: Partial<ClaimInput>) => {
    const next = { ...claim, ...patch };
    setClaim(next);
    setClaimJson(JSON.stringify(next, null, 2));
  };

  const loadCase = (caseId: string) => {
    const found = selectedCaseOptions.find((item) => item.case_id === caseId);
    if (!found) return;
    setClaim(found.input_data);
    setClaimJson(JSON.stringify(found.input_data, null, 2));
    setPastedText(JSON.stringify(found.input_data.documents, null, 2));
    setExtracted(null);
    setExtractedJson("");
    setReviewConfirmed(false);
    setValidationErrors([]);
  };

  const applyClaimJson = () => {
    try {
      const parsed = JSON.parse(claimJson) as ClaimInput;
      setClaim(parsed);
      setValidationErrors([]);
    } catch {
      setValidationErrors(["Claim JSON is not valid JSON."]);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Claim intake</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">New OPD Claim</h1>
          <p className="text-sm text-muted-foreground">Upload documents, preview extraction, review fields, and run adjudication.</p>
        </div>
        <Badge variant={canAdjudicate ? "APPROVED" : "MANUAL_REVIEW"}>
          {canAdjudicate ? "Ready for adjudication" : "Review required"}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workflowSteps.map((step) => (
          <WorkflowStepCard
            key={step.number}
            step={step}
            status={step.number < currentStep ? "complete" : step.number === currentStep ? "active" : "pending"}
          />
        ))}
      </div>

      {validationErrors.length ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
            <div className="space-y-1">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepMark value="1" />
                <div>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>Start with bills, prescriptions, PDFs, images, pasted OCR text, or an official test case.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField label="Official test case" help="Optional. Loading a case fills the claim and document payload.">
                <Select onChange={(event) => loadCase(event.target.value)} defaultValue="" aria-label="Load official test case">
                  <option value="" disabled>Load official test case</option>
                  {selectedCaseOptions.map((item) => (
                    <option key={item.case_id} value={item.case_id}>
                      {item.case_id} - {item.case_name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Document upload" help="Supported: images, PDF, JSON, and text files.">
                <div className="rounded-md border border-dashed bg-slate-50 p-4">
                  <Input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.json,.txt"
                    onChange={(e) => setFiles(e.target.files)}
                    aria-label="Upload claim documents"
                  />
                </div>
              </FormField>

              <UploadFileList files={selectedFiles} />

              <FormField label="Pasted document text" help="Use this for OCR text, bill contents, prescription notes, or document JSON.">
                <Textarea
                  placeholder="Paste OCR text, document JSON, prescription text, or bill contents"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="min-h-36"
                />
              </FormField>

              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => extractionMutation.mutate()} disabled={extractionMutation.isPending}>
                {extractionMutation.isPending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <FileSearch size={17} aria-hidden="true" />}
                {extractionMutation.isPending ? "Extracting" : "Extract preview"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepMark value="3" />
                <div>
                  <CardTitle>Review Claim Information</CardTitle>
                  <CardDescription>Confirm member details and edit anything extraction could not infer.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Member ID">
                  <Input required value={claim.member_id} onChange={(e) => updateClaim({ member_id: e.target.value })} aria-label="Member ID" />
                </FormField>
                <FormField label="Member name">
                  <Input required value={claim.member_name} onChange={(e) => updateClaim({ member_name: e.target.value })} aria-label="Member name" />
                </FormField>
                <FormField label="Treatment date">
                  <Input required type="date" value={claim.treatment_date} onChange={(e) => updateClaim({ treatment_date: e.target.value })} aria-label="Treatment date" />
                </FormField>
                <FormField label="Claim amount">
                  <Input
                    required
                    type="number"
                    min={1}
                    value={claim.claim_amount || ""}
                    onChange={(e) => updateClaim({ claim_amount: Number(e.target.value) })}
                    aria-label="Claim amount"
                  />
                </FormField>
                <FormField label="Hospital/provider">
                  <Input value={claim.hospital ?? ""} onChange={(e) => updateClaim({ hospital: e.target.value })} aria-label="Hospital or provider" />
                </FormField>
                <label className="flex h-10 items-center gap-2 self-end rounded-md border bg-background px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <input type="checkbox" checked={Boolean(claim.cashless_request)} onChange={(e) => updateClaim({ cashless_request: e.target.checked })} />
                  Cashless request
                </label>
              </div>

              <FormField label="Claim JSON" help="Advanced edit area for the claim payload. Apply JSON to sync the structured form above.">
                <Textarea value={claimJson} onChange={(e) => setClaimJson(e.target.value)} className="min-h-40 font-mono text-xs leading-5 sm:min-h-44" />
              </FormField>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={applyClaimJson}>Apply JSON</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepMark value="2" />
                <div>
                  <CardTitle>Extraction Preview</CardTitle>
                  <CardDescription>Gemini extracts fields when available; fallback extraction keeps the workflow moving.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {extracted?.extraction_notice ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {extracted.extraction_notice}
                </div>
              ) : null}
              {extracted?.confidence_score !== undefined && <ConfidenceBar value={extracted.confidence_score} />}
              <FormField label="Extracted fields JSON" help="Review, correct, and confirm before adjudication.">
                <Textarea
                  value={extractedJson}
                  onChange={(e) => {
                    setExtractedJson(e.target.value);
                    setReviewConfirmed(false);
                  }}
                  placeholder="Run extraction to populate structured JSON"
                  className="min-h-72 border-slate-800 bg-slate-950 font-mono text-xs leading-5 text-slate-100 placeholder:text-slate-500 sm:min-h-[28rem]"
                  aria-label="Extracted fields JSON"
                />
              </FormField>
              <label className="flex items-start gap-3 rounded-md border bg-slate-50 p-3 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={reviewConfirmed}
                  onChange={(e) => setReviewConfirmed(e.target.checked)}
                  disabled={!extractedJson}
                />
                <span>I reviewed the extracted fields and corrected missing or inaccurate information.</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <StepMark value="4" />
                <div>
                  <CardTitle>Adjudication</CardTitle>
                  <CardDescription>The final decision is made by deterministic policy rules, not by the LLM.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" className="w-full sm:w-auto" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !canAdjudicate}>
                  {submitMutation.isPending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                  {submitMutation.isPending ? "Adjudicating" : "Adjudicate claim"}
                </Button>
                {!canAdjudicate ? <Badge>Extraction review required</Badge> : <Badge variant="APPROVED">Ready</Badge>}
              </div>
              {(extractionMutation.error || submitMutation.error) && (
                <p className="text-sm text-destructive" role="alert">
                  {(extractionMutation.error ?? submitMutation.error)?.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WorkflowStepCard({ step, status }: { step: WorkflowStep; status: "complete" | "active" | "pending" }) {
  const Icon = step.icon;
  const StatusIcon = status === "complete" ? CheckCircle2 : status === "active" ? Circle : Circle;

  return (
    <div
      className={cn(
        "flex min-h-24 items-start gap-3 rounded-md border bg-white p-4 text-sm shadow-sm transition-colors",
        status === "active" && "border-primary/40 bg-accent/60",
        status === "complete" && "border-emerald-200 bg-emerald-50/70"
      )}
      aria-current={status === "active" ? "step" : undefined}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-white text-primary">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {step.number}</p>
          <StatusIcon className={status === "complete" ? "text-emerald-600" : "text-muted-foreground"} size={13} aria-hidden="true" />
        </div>
        <p className="mt-1 font-semibold">{step.label}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
    </div>
  );
}

function StepMark({ value }: { value: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
      {value}
    </span>
  );
}

function FormField({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="field-label">{label}</span>
      {children}
      {help ? <span className="field-help">{help}</span> : null}
    </label>
  );
}

function UploadFileList({ files }: { files: File[] }) {
  if (!files.length) {
    return <p className="rounded-md border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">No files selected yet.</p>;
  }
  return (
    <div className="space-y-2" aria-label="Selected files">
      {files.map((file) => (
        <div key={`${file.name}-${file.size}`} className="flex flex-col gap-3 rounded-md border bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="shrink-0 text-primary" size={16} aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.type || "Unknown type"} - {Math.max(1, Math.round(file.size / 1024))} KB</p>
            </div>
          </div>
          <Badge variant="APPROVED">
            <ClipboardCheck size={13} aria-hidden="true" />
            Ready
          </Badge>
        </div>
      ))}
    </div>
  );
}

function validateIntake(claim: ClaimInput, pastedText: string, files: File[]) {
  const errors: string[] = [];
  if (!files.length && !pastedText.trim() && !Object.keys(claim.documents ?? {}).length) {
    errors.push("Upload at least one document, paste OCR text, or load a test case before extraction.");
  }
  return errors;
}

function validateSubmission(claim: ClaimInput, extractedJson: string, reviewConfirmed: boolean) {
  const errors: string[] = [];
  if (!extractedJson.trim()) errors.push("Run extraction before adjudication.");
  if (!reviewConfirmed) errors.push("Review and confirm extracted fields before adjudication.");
  if (!claim.member_id.trim()) errors.push("Member ID is required.");
  if (!claim.member_name.trim()) errors.push("Member name is required.");
  if (!claim.treatment_date) errors.push("Treatment date is required.");
  if (!Number.isFinite(claim.claim_amount) || claim.claim_amount <= 0) errors.push("Claim amount must be greater than zero.");
  try {
    JSON.parse(extractedJson);
  } catch {
    errors.push("Extraction JSON is not valid JSON.");
  }
  return errors;
}

function buildFormData(claim: ClaimInput, pastedText: string, files: globalThis.FileList | null, extracted?: ExtractedFields) {
  const formData = new FormData();
  formData.append("metadata", JSON.stringify({ ...claim, extracted_fields: extracted }));
  formData.append("pasted_text", pastedText);
  Array.from(files ?? []).forEach((file) => formData.append("files", file));
  return formData;
}
