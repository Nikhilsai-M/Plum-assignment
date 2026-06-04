"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CircleDollarSign, UserRound } from "lucide-react";
import { apiJson, type ClaimRecord } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function ManualReviewPage() {
  const { data } = useQuery({
    queryKey: ["claims"],
    queryFn: () => apiJson<{ claims: ClaimRecord[] }>("/api/claims")
  });
  const queue = (data?.claims ?? []).filter((record) => record.result.decision === "MANUAL_REVIEW");

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Human review</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Manual Review Queue</h1>
          <p className="text-sm text-muted-foreground">Fraud, low-confidence, high-value, and appeal cases waiting for human adjudication.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {queue.map((record) => (
          <Card key={record.id} className="transition-colors hover:border-sky-200">
            <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="break-all text-sm">{record.id}</CardTitle>
                  <Badge variant="MANUAL_REVIEW">Manual review</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(record.result.created_at)}</span>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <UserRound size={15} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{record.claim.member_name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CircleDollarSign size={15} className="shrink-0" aria-hidden="true" />
                    {formatCurrency(record.claim.claim_amount)}
                  </span>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="shrink-0 text-sky-700" size={15} aria-hidden="true" />
                    Recommended action: review evidence
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {record.result.flags?.join(", ") ?? record.result.notes}
                </p>
              </div>
              <Link href={`/claims/${record.id}`} className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
                Open claim
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
        {!queue.length && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">No claims are waiting for manual review.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
