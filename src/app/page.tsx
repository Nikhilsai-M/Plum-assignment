"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, CheckCircle2, CircleDollarSign, ClipboardCheck, FilePlus2, Inbox, XCircle } from "lucide-react";
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
    { label: "Total Claims", value: data?.total ?? 0, icon: ClipboardCheck, tone: "border-slate-200 bg-slate-50 text-slate-700" },
    { label: "Approved", value: data?.approved ?? 0, icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { label: "Rejected", value: data?.rejected ?? 0, icon: XCircle, tone: "border-rose-200 bg-rose-50 text-rose-700" },
    { label: "Partial", value: data?.partial ?? 0, icon: CircleDollarSign, tone: "border-amber-200 bg-amber-50 text-amber-800" },
    { label: "Manual Review", value: data?.manualReview ?? 0, icon: Inbox, tone: "border-sky-200 bg-sky-50 text-sky-800" }
  ];

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Claims Dashboard</h1>
          <p className="text-sm text-muted-foreground">Automated OPD adjudication results and review workload.</p>
        </div>
        <Link href="/new-claim" className={buttonVariants({ className: "w-full sm:w-auto" })}>
          <FilePlus2 size={17} />
          New claim
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="min-h-32">
              <CardContent className="flex h-full items-start justify-between gap-4 p-5 sm:p-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-normal">{isLoading ? "..." : stat.value}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${stat.tone}`}>
                  <Icon size={20} />
                </span>
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
            <div className="table-shell hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim <ArrowUpDown className="sort-indicator" size={11} /></th>
                    <th>Member</th>
                    <th>Decision</th>
                    <th>Approved</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium">
                        <Link className="text-primary hover:underline" href={`/claims/${record.id}`}>
                          {record.id}
                        </Link>
                      </td>
                      <td>{record.claim.member_name}</td>
                      <td><DecisionBadge decision={record.result.decision} /></td>
                      <td className="font-medium">{formatCurrency(record.result.approved_amount)}</td>
                      <td>{Math.round(record.result.confidence_score * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.recent?.length && (
                <div className="py-10 text-center text-sm text-muted-foreground">No claims submitted yet.</div>
              )}
            </div>
            <div className="mt-3 grid gap-3 md:hidden">
              {(data?.recent ?? []).map((record) => (
                <Link
                  key={record.id}
                  href={`/claims/${record.id}`}
                  className="rounded-md border bg-white p-4 text-sm shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-primary">{record.id}</p>
                      <p className="mt-1 text-muted-foreground">{record.claim.member_name}</p>
                    </div>
                    <DecisionBadge decision={record.result.decision} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <span>
                      <span className="block text-muted-foreground">Approved</span>
                      <span className="font-semibold">{formatCurrency(record.result.approved_amount)}</span>
                    </span>
                    <span>
                      <span className="block text-muted-foreground">Confidence</span>
                      <span className="font-semibold">{Math.round(record.result.confidence_score * 100)}%</span>
                    </span>
                  </div>
                </Link>
              ))}
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
            <div className="rounded-md border bg-accent p-4 text-sm leading-6 text-accent-foreground">
              Manual-review cases are kept out of payout until a claims specialist validates fraud, document quality, or low-confidence flags.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
