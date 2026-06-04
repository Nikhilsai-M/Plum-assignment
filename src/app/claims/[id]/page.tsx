"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CircleDot, Clock, FileText, MinusCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { apiJson, reviewClaim, type ClaimRecord } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { DecisionBadge } from "@/components/decision-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RuleStatus } from "../../../../server/types";

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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{result.claim_id}</h1>
          <p className="text-sm text-muted-foreground">{claim.member_name} - {formatDate(claim.treatment_date)}</p>
        </div>
        <DecisionBadge decision={result.decision} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
              <CardDescription>Final output produced by deterministic rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Claimed</p>
                  <p className="text-lg font-semibold">{formatCurrency(claim.claim_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approved</p>
                  <p className="text-lg font-semibold">{formatCurrency(result.approved_amount)}</p>
                </div>
              </div>
              <ConfidenceBar value={result.confidence_score} />
              <div className="flex flex-wrap gap-2">
                {result.network_discount ? <Badge>Network discount {formatCurrency(result.network_discount)}</Badge> : null}
                {result.cashless_approved ? <Badge variant="APPROVED">Cashless approved</Badge> : null}
                {result.extracted_fields?.extraction_source === "fallback" ? <Badge variant="PARTIAL">Fallback extraction</Badge> : null}
              </div>
              {result.extracted_fields?.extraction_notice ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {result.extracted_fields.extraction_notice}
                </p>
              ) : null}
              <p className="rounded-md border bg-muted p-3 text-sm">{result.notes}</p>
              <p className="text-sm text-muted-foreground">{result.next_steps}</p>
            </CardContent>
          </Card>

          {result.decision === "MANUAL_REVIEW" && !result.review ? (
            <Card>
              <CardHeader>
                <CardTitle>Manual Review Action</CardTitle>
                <CardDescription>Complete the human decision and store reviewer accountability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Reviewed by" />
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Review notes" className="min-h-24" />
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => reviewMutation.mutate("APPROVE")} disabled={reviewMutation.isPending}>
                    <CheckCircle2 size={17} />
                    Approve
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => reviewMutation.mutate("REJECT")} disabled={reviewMutation.isPending}>
                    <XCircle size={17} />
                    Reject
                  </Button>
                </div>
                {reviewMutation.error ? <p className="text-sm text-destructive">{reviewMutation.error.message}</p> : null}
              </CardContent>
            </Card>
          ) : null}

          {result.review ? (
            <Card>
              <CardHeader>
                <CardTitle>Review Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Action:</span> {result.review.action}</p>
                <p><span className="text-muted-foreground">Reviewed by:</span> {result.review.reviewed_by}</p>
                <p><span className="text-muted-foreground">Reviewed at:</span> {formatDate(result.review.reviewed_at)}</p>
                <p className="rounded-md border bg-muted p-3">{result.review.review_notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{file.name}</p>
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
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(result.audit_trail ?? []).map((event) => (
                <TimelineItem
                  key={`${event.event_type}-${event.created_at}`}
                  icon={<Clock size={16} />}
                  label={event.event_type.replaceAll("_", " ")}
                  value={`${formatDate(event.created_at)} - ${event.message}`}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule-by-Rule Explanation</CardTitle>
              <CardDescription>Rules are evaluated in the assignment-specified order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.rule_explanations.map((rule) => (
                <div key={rule.rule} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <RuleIcon status={rule.status} />
                      <p className="font-medium">{rule.rule}</p>
                    </div>
                    <Badge variant={rule.status === "failed" ? "REJECTED" : rule.status === "manual_review" ? "MANUAL_REVIEW" : rule.status === "partial" ? "PARTIAL" : "APPROVED"}>
                      {rule.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{rule.message}</p>
                  {rule.reasons.length ? <p className="mt-2 text-xs font-medium text-rose-700">Triggered rule: {rule.reasons.join(", ")}</p> : null}
                  {rule.flags?.length ? <p className="mt-2 text-xs font-medium text-sky-700">Triggered rule: {rule.flags.join(", ")}</p> : null}
                  {rule.approvedAmount !== undefined ? <p className="mt-2 text-xs text-muted-foreground">Calculated payable: {formatCurrency(rule.approvedAmount)}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
                {JSON.stringify(result.extracted_fields, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RuleIcon({ status }: { status: RuleStatus }) {
  if (status === "passed") return <CheckCircle2 className="text-emerald-600" size={18} />;
  if (status === "failed") return <XCircle className="text-rose-600" size={18} />;
  if (status === "manual_review") return <AlertTriangle className="text-sky-700" size={18} />;
  if (status === "partial") return <MinusCircle className="text-amber-600" size={18} />;
  return <CircleDot className="text-muted-foreground" size={18} />;
}

function TimelineItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">{icon}</span>
      <span>
        <span className="block font-medium capitalize">{label.toLowerCase()}</span>
        <span className="text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}
