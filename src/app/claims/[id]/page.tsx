"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock,
  FileJson,
  FileText,
  MinusCircle,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { apiJson, reviewClaim, type ClaimRecord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { DecisionBadge } from "@/components/decision-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { RuleExplanation, RuleStatus } from "../../../../server/types";

export default function ClaimResultPage() {
  const params = useParams<{ id: string }>();
  const [reviewer, setReviewer] = useState("Claims Specialist");
  const [notes, setNotes] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["claim", params.id],
    queryFn: () => apiJson<{ record: ClaimRecord }>(`/api/claims/${params.id}`)
  });
  const reviewMutation = useMutation({
    mutationFn: (action: "APPROVE" | "REJECT") =>
      reviewClaim(params.id, {
        action,
        reviewed_by: reviewer,
        review_notes: notes
      }),
    onSuccess: () => refetch()
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading claim...</div>;
  if (!data?.record) return <div className="text-sm text-muted-foreground">Claim not found.</div>;

  const { claim, result } = data.record;
  const files = claim.uploaded_documents ?? [];

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-4">
        <Link href="/claims" className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}>
          <ArrowLeft size={15} aria-hidden="true" />
          History
        </Link>
        <div className="page-header">
          <div className="min-w-0">
            <p className="eyebrow">Claim result</p>
            <h1 className="mt-1 break-all text-2xl font-semibold tracking-normal sm:text-3xl">{result.claim_id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{claim.member_name} - {formatDate(claim.treatment_date)}</p>
          </div>
          <DecisionBadge decision={result.decision} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Decision</p>
                <h2 className="text-lg font-semibold sm:text-xl">Final adjudication outcome</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Deterministic rules evaluated this claim after extraction review.
                </p>
              </div>
            </div>
            <div className="md:text-right">
              <DecisionBadge decision={result.decision} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Claimed" value={formatCurrency(claim.claim_amount)} />
            <SummaryMetric label="Approved" value={formatCurrency(result.approved_amount)} emphasis />
            <SummaryMetric label="Confidence" value={`${Math.round(result.confidence_score * 100)}%`} />
            <SummaryMetric label="Created" value={formatDate(result.created_at)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Context</CardTitle>
              <CardDescription>Core claim and member information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <FieldRow label="Member" value={claim.member_name} />
              <FieldRow label="Member ID" value={claim.member_id} />
              <FieldRow label="Treatment date" value={formatDate(claim.treatment_date)} />
              <FieldRow label="Hospital/provider" value={claim.hospital ?? claim.provider ?? "Not provided"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reasoning</CardTitle>
              <CardDescription>Decision notes and recommended next step.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoPanel>{result.notes}</InfoPanel>
              <InfoPanel tone="blue">{result.next_steps}</InfoPanel>
              <div className="flex flex-wrap gap-2">
                {result.network_discount ? <Badge>Network discount {formatCurrency(result.network_discount)}</Badge> : null}
                {result.cashless_approved ? <Badge variant="APPROVED">Cashless approved</Badge> : null}
                {result.extracted_fields?.extraction_source === "fallback" ? <Badge variant="PARTIAL">Fallback extraction</Badge> : null}
              </div>
              {result.extracted_fields?.extraction_notice ? <InfoPanel tone="amber">{result.extracted_fields.extraction_notice}</InfoPanel> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Score</CardTitle>
              <CardDescription>Readable confidence band with the raw percentage.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConfidenceBar value={result.confidence_score} />
            </CardContent>
          </Card>

          {result.decision === "MANUAL_REVIEW" && !result.review ? (
            <Card>
              <CardHeader>
                <CardTitle>Manual Review Action</CardTitle>
                <CardDescription>Complete the human decision and store reviewer accountability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="field-label">Reviewed by</span>
                  <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="field-label">Review notes</span>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24" />
                </label>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <Button type="button" onClick={() => reviewMutation.mutate("APPROVE")} disabled={reviewMutation.isPending}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    Approve
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => reviewMutation.mutate("REJECT")} disabled={reviewMutation.isPending}>
                    <XCircle size={17} aria-hidden="true" />
                    Reject
                  </Button>
                </div>
                {reviewMutation.error ? <p className="text-sm text-destructive" role="alert">{reviewMutation.error.message}</p> : null}
              </CardContent>
            </Card>
          ) : null}

          {result.review ? (
            <Card>
              <CardHeader>
                <CardTitle>Review Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <FieldRow label="Action" value={result.review.action} />
                <FieldRow label="Reviewed by" value={result.review.reviewed_by} />
                <FieldRow label="Reviewed at" value={formatDate(result.review.reviewed_at)} />
                <InfoPanel>{result.review.review_notes}</InfoPanel>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Evaluation</CardTitle>
              <CardDescription>Policy rules evaluated in deterministic order.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {result.rule_explanations.map((rule) => (
                <RuleCard key={rule.rule} rule={rule} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Uploaded binary files attached to this claim.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex flex-col gap-3 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="break-all font-medium sm:truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type || "Unknown type"} - {Math.max(1, Math.round(file.size / 1024))} KB</p>
                    </div>
                  </div>
                  <Badge variant="APPROVED">{file.status ?? "processed"}</Badge>
                </div>
              ))}
              {!files.length && <p className="text-sm text-muted-foreground">No binary files uploaded for this claim.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Audit trail for intake, extraction, adjudication, and review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(result.audit_trail ?? []).map((event) => (
                <TimelineItem
                  key={`${event.event_type}-${event.created_at}`}
                  icon={<Clock size={16} aria-hidden="true" />}
                  label={event.event_type.replaceAll("_", " ")}
                  value={`${formatDate(event.created_at)} - ${event.message}`}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson size={18} aria-hidden="true" />
                Extracted Data
              </CardTitle>
              <CardDescription>Structured fields used by policy rules.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="code-panel">{JSON.stringify(result.extracted_fields, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0 rounded-md border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 break-words text-xl font-semibold", emphasis && "text-primary")}>{value}</p>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function InfoPanel({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "amber" }) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm leading-6",
        tone === "neutral" && "bg-muted/50",
        tone === "blue" && "border-sky-200 bg-sky-50 text-sky-900",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      {children}
    </div>
  );
}

function RuleCard({ rule }: { rule: RuleExplanation }) {
  const variant = rule.status === "failed" ? "REJECTED" : rule.status === "manual_review" ? "MANUAL_REVIEW" : rule.status === "partial" ? "PARTIAL" : "APPROVED";

  return (
    <div className="min-w-0 rounded-md border bg-white p-4 transition-colors hover:bg-slate-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <RuleIcon status={rule.status} />
          <div className="min-w-0">
            <p className="break-words font-semibold">{rule.rule}</p>
            <p className="text-xs capitalize text-muted-foreground">{rule.status.replace("_", " ")}</p>
          </div>
        </div>
        <Badge variant={variant}>{rule.status.replace("_", " ")}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{rule.message}</p>
      {rule.reasons.length ? <p className="mt-2 break-words text-xs font-medium text-rose-700">Triggered reason: {rule.reasons.join(", ")}</p> : null}
      {rule.flags?.length ? <p className="mt-2 break-words text-xs font-medium text-sky-700">Review flag: {rule.flags.join(", ")}</p> : null}
      {rule.approvedAmount !== undefined ? <p className="mt-2 text-xs text-muted-foreground">Calculated payable: {formatCurrency(rule.approvedAmount)}</p> : null}
    </div>
  );
}

function RuleIcon({ status }: { status: RuleStatus }) {
  if (status === "passed") return <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} aria-hidden="true" />;
  if (status === "failed") return <XCircle className="mt-0.5 shrink-0 text-rose-600" size={18} aria-hidden="true" />;
  if (status === "manual_review") return <AlertTriangle className="mt-0.5 shrink-0 text-sky-700" size={18} aria-hidden="true" />;
  if (status === "partial") return <MinusCircle className="mt-0.5 shrink-0 text-amber-600" size={18} aria-hidden="true" />;
  return <CircleDot className="mt-0.5 shrink-0 text-muted-foreground" size={18} aria-hidden="true" />;
}

function TimelineItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium capitalize">{label.toLowerCase()}</span>
        <span className="break-words text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}
