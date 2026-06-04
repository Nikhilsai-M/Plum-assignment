"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileSearch, FileText, Pencil, Play, UploadCloud, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { apiJson, extractClaim, submitClaim } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBar } from "@/components/confidence-bar";
import { Badge } from "@/components/ui/badge";
import type { ClaimInput, ExtractedFields } from "../../../server/types";

type AssignmentCases = {
  test_cases: Array<{ case_id: string; case_name: string; input_data: ClaimInput }>;
};

const emptyClaim: ClaimInput = {
  member_id: "",
  member_name: "",
  treatment_date: "",
  claim_amount: 0,
  hospital: "",
  documents: {}
};

const workflowSteps: Array<{ number: string; label: string; icon: LucideIcon }> = [
  { number: "1", label: "Upload Documents", icon: UploadCloud },
  { number: "2", label: "AI Extraction Preview", icon: FileSearch },
  { number: "3", label: "Review and Edit", icon: Pencil },
  { number: "4", label: "Adjudicate Claim", icon: Play },
  { number: "5", label: "View Decision", icon: CheckCircle2 }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">New OPD Claim</h1>
        <p className="text-sm text-muted-foreground">Upload documents, preview extraction, review the fields, and then adjudicate.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {workflowSteps.map(({ number, label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-md border bg-white p-3 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Icon size={16} />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Step {number}</p>
              <p className="font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {validationErrors.length ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
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
              <CardTitle>Step 1 - Upload Documents</CardTitle>
              <CardDescription>Start with bills, prescriptions, PDFs, images, or pasted OCR text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onChange={(event) => loadCase(event.target.value)} defaultValue="">
                <option value="" disabled>Load official test case</option>
                {selectedCaseOptions.map((item) => (
                  <option key={item.case_id} value={item.case_id}>
                    {item.case_id} - {item.case_name}
                  </option>
                ))}
              </Select>
              <Input type="file" multiple accept="image/*,application/pdf,.json,.txt" onChange={(e) => setFiles(e.target.files)} />
              <FileList files={selectedFiles} />
              <Textarea
                placeholder="Paste OCR text, document JSON, prescription text, or bill contents"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-36"
              />
              <Button type="button" variant="secondary" onClick={() => extractionMutation.mutate()} disabled={extractionMutation.isPending}>
                <FileSearch size={17} />
                {extractionMutation.isPending ? "Extracting" : "Extract preview"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3 - Review Claim Information</CardTitle>
              <CardDescription>Confirm member details and edit anything extraction could not infer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input required placeholder="Member ID" value={claim.member_id} onChange={(e) => updateClaim({ member_id: e.target.value })} />
                <Input required placeholder="Member name" value={claim.member_name} onChange={(e) => updateClaim({ member_name: e.target.value })} />
                <Input required type="date" value={claim.treatment_date} onChange={(e) => updateClaim({ treatment_date: e.target.value })} />
                <Input required type="number" min={1} placeholder="Claim amount" value={claim.claim_amount || ""} onChange={(e) => updateClaim({ claim_amount: Number(e.target.value) })} />
                <Input placeholder="Hospital/provider" value={claim.hospital ?? ""} onChange={(e) => updateClaim({ hospital: e.target.value })} />
                <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                  <input type="checkbox" checked={Boolean(claim.cashless_request)} onChange={(e) => updateClaim({ cashless_request: e.target.checked })} />
                  Cashless request
                </label>
              </div>
              <Textarea value={claimJson} onChange={(e) => setClaimJson(e.target.value)} className="min-h-44 font-mono text-xs" />
              <Button type="button" variant="outline" onClick={applyClaimJson}>Apply JSON</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 2 - AI Extraction Preview</CardTitle>
              <CardDescription>Gemini extracts fields when available; fallback extraction keeps the workflow moving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extracted?.extraction_notice ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {extracted.extraction_notice}
                </div>
              ) : null}
              {extracted?.confidence_score !== undefined && <ConfidenceBar value={extracted.confidence_score} />}
              <Textarea
                value={extractedJson}
                onChange={(e) => {
                  setExtractedJson(e.target.value);
                  setReviewConfirmed(false);
                }}
                placeholder="Run extraction to populate structured JSON"
                className="min-h-[28rem] font-mono text-xs"
              />
              <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
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
              <CardTitle>Step 4 - Adjudicate Claim</CardTitle>
              <CardDescription>The final decision is made by deterministic policy rules, not by the LLM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !canAdjudicate}>
                  <Play size={17} />
                  {submitMutation.isPending ? "Adjudicating" : "Adjudicate claim"}
                </Button>
                {!canAdjudicate ? <Badge>Extraction review required</Badge> : <Badge variant="APPROVED">Ready</Badge>}
              </div>
              {(extractionMutation.error || submitMutation.error) && (
                <p className="text-sm text-destructive">
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

function FileList({ files }: { files: File[] }) {
  if (!files.length) {
    return <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No files selected yet.</p>;
  }
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="shrink-0 text-primary" size={16} />
            <div className="min-w-0">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.type || "Unknown type"} - {Math.max(1, Math.round(file.size / 1024))} KB</p>
            </div>
          </div>
          <Badge variant="APPROVED">Ready</Badge>
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

function buildFormData(claim: ClaimInput, pastedText: string, files: FileList | null, extracted?: ExtractedFields) {
  const formData = new FormData();
  formData.append("metadata", JSON.stringify({ ...claim, extracted_fields: extracted }));
  formData.append("pasted_text", pastedText);
  Array.from(files ?? []).forEach((file) => formData.append("files", file));
  return formData;
}
