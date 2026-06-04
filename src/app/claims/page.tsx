"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Search } from "lucide-react";
import { apiJson, type ClaimRecord } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DecisionBadge } from "@/components/decision-badge";

export default function ClaimsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const { data } = useQuery({
    queryKey: ["claims"],
    queryFn: () => apiJson<{ claims: ClaimRecord[] }>("/api/claims")
  });

  const claims = useMemo(() => {
    const filtered = (data?.claims ?? []).filter((record) => {
      const text = `${record.id} ${record.claim.member_name} ${record.claim.member_id}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || record.result.decision === status;
      return matchesQuery && matchesStatus;
    });
    return filtered.sort((a, b) =>
      sort === "amount"
        ? b.claim.claim_amount - a.claim.claim_amount
        : new Date(b.result.created_at).getTime() - new Date(a.result.created_at).getTime()
    );
  }, [data, query, sort, status]);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
        <p className="eyebrow">Records</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Claim History</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and inspect completed adjudications.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <label className="space-y-1.5">
              <span className="field-label">Search</span>
              <span className="relative block">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input className="pl-9" placeholder="Search claims" value={query} onChange={(e) => setQuery(e.target.value)} />
              </span>
            </label>
            <label className="space-y-1.5">
              <span className="field-label">Status</span>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter claims by status">
                <option value="ALL">All statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PARTIAL">Partial</option>
                <option value="MANUAL_REVIEW">Manual review</option>
              </Select>
            </label>
            <label className="space-y-1.5">
              <span className="field-label">Sort</span>
              <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort claims">
                <option value="newest">Newest first</option>
                <option value="amount">Highest amount</option>
              </Select>
            </label>
          </div>
          <div className="table-shell hidden md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Member</th>
                  <th>Treatment <ArrowDownUp className="sort-indicator" size={11} /></th>
                  <th>Claimed</th>
                  <th>Decision</th>
                  <th>Approved</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">
                      <Link href={`/claims/${record.id}`} className="text-primary hover:underline">{record.id}</Link>
                    </td>
                    <td>{record.claim.member_name}</td>
                    <td>{formatDate(record.claim.treatment_date)}</td>
                    <td>{formatCurrency(record.claim.claim_amount)}</td>
                    <td><DecisionBadge decision={record.result.decision} /></td>
                    <td className="font-medium">{formatCurrency(record.result.approved_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!claims.length && <div className="py-10 text-center text-sm text-muted-foreground">No matching claims.</div>}
          </div>
          <div className="grid gap-3 md:hidden">
            {claims.map((record) => (
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
                    <span className="block text-muted-foreground">Treatment</span>
                    <span className="font-semibold">{formatDate(record.claim.treatment_date)}</span>
                  </span>
                  <span>
                    <span className="block text-muted-foreground">Claimed</span>
                    <span className="font-semibold">{formatCurrency(record.claim.claim_amount)}</span>
                  </span>
                  <span>
                    <span className="block text-muted-foreground">Approved</span>
                    <span className="font-semibold">{formatCurrency(record.result.approved_amount)}</span>
                  </span>
                </div>
              </Link>
            ))}
            {!claims.length && <div className="rounded-md border bg-white py-10 text-center text-sm text-muted-foreground">No matching claims.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
