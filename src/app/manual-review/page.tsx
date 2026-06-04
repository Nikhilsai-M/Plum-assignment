"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { apiJson, type ClaimRecord } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default function ManualReviewPage() {
  const { data } = useQuery({
    queryKey: ["claims"],
    queryFn: () => apiJson<{ claims: ClaimRecord[] }>("/api/claims")
  });
  const queue = (data?.claims ?? []).filter((record) => record.result.decision === "MANUAL_REVIEW");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Manual Review Queue</h1>
        <p className="text-sm text-muted-foreground">Fraud, low-confidence, high-value, and appeal cases waiting for human adjudication.</p>
      </div>
      <div className="grid gap-4">
        {queue.map((record) => (
          <Card key={record.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{record.id}</CardTitle>
                <CardDescription>{record.claim.member_name} · {formatCurrency(record.claim.claim_amount)}</CardDescription>
              </div>
              <Badge variant="MANUAL_REVIEW">Manual review</Badge>
            </CardHeader>
            <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 text-sky-700" size={18} />
                <span>{record.result.flags?.join(", ") ?? record.result.notes}</span>
              </div>
              <Link href={`/claims/${record.id}`} className={buttonVariants({ variant: "outline" })}>Open claim</Link>
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
