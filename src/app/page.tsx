"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDollarSign, ClipboardCheck, FilePlus2, Inbox, XCircle } from "lucide-react";
import { apiJson, type DashboardSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { DecisionBadge } from "@/components/decision-badge";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiJson<DashboardSummary>("/api/dashboard")
  });

  const stats = [
    { label: "Total claims", value: data?.total ?? 0, icon: ClipboardCheck },
    { label: "Approved", value: data?.approved ?? 0, icon: CheckCircle2 },
    { label: "Rejected", value: data?.rejected ?? 0, icon: XCircle },
    { label: "Partial", value: data?.partial ?? 0, icon: CircleDollarSign },
    { label: "Manual review", value: data?.manualReview ?? 0, icon: Inbox }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Claims Dashboard</h1>
          <p className="text-sm text-muted-foreground">Automated OPD adjudication results and review workload.</p>
        </div>
        <Link href="/new-claim" className={buttonVariants()}>
          <FilePlus2 size={17} />
          New claim
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{isLoading ? "..." : stat.value}</p>
                </div>
                <Icon className="text-primary" size={22} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Latest adjudication outcomes from API storage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 font-medium">Claim</th>
                    <th className="py-3 font-medium">Member</th>
                    <th className="py-3 font-medium">Decision</th>
                    <th className="py-3 font-medium">Approved</th>
                    <th className="py-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <Link className="text-primary hover:underline" href={`/claims/${record.id}`}>
                          {record.id}
                        </Link>
                      </td>
                      <td className="py-3">{record.claim.member_name}</td>
                      <td className="py-3"><DecisionBadge decision={record.result.decision} /></td>
                      <td className="py-3">{formatCurrency(record.result.approved_amount)}</td>
                      <td className="py-3">{Math.round(record.result.confidence_score * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.recent?.length && (
                <div className="py-10 text-center text-sm text-muted-foreground">No claims submitted yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Health</CardTitle>
            <CardDescription>Confidence mix for the adjudication queue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ConfidenceBar value={data?.averageConfidence ?? 0} />
            <div className="rounded-md border bg-accent p-4 text-sm text-accent-foreground">
              Manual-review cases are kept out of payout until a claims specialist validates fraud, document quality, or low-confidence flags.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
