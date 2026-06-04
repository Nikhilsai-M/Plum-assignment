"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Claim History</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and inspect completed adjudications.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <label className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input className="pl-9" placeholder="Search claims" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PARTIAL">Partial</option>
              <option value="MANUAL_REVIEW">Manual review</option>
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="amount">Highest amount</option>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 font-medium">Claim</th>
                  <th className="py-3 font-medium">Member</th>
                  <th className="py-3 font-medium">Treatment</th>
                  <th className="py-3 font-medium">Claimed</th>
                  <th className="py-3 font-medium">Decision</th>
                  <th className="py-3 font-medium">Approved</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((record) => (
                  <tr key={record.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      <Link href={`/claims/${record.id}`} className="text-primary hover:underline">{record.id}</Link>
                    </td>
                    <td className="py-3">{record.claim.member_name}</td>
                    <td className="py-3">{formatDate(record.claim.treatment_date)}</td>
                    <td className="py-3">{formatCurrency(record.claim.claim_amount)}</td>
                    <td className="py-3"><DecisionBadge decision={record.result.decision} /></td>
                    <td className="py-3">{formatCurrency(record.result.approved_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!claims.length && <div className="py-10 text-center text-sm text-muted-foreground">No matching claims.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
