import { Lock, Settings2 } from "lucide-react";
import { policyTerms } from "../../../../server/policy";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPolicyPage() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Admin Policy Configuration</h1>
          <p className="text-sm text-muted-foreground">Read-only control view for the active OPD policy configuration.</p>
        </div>
        <Badge><Lock size={13} /> Read only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 size={18} /> Active Policy</CardTitle>
          <CardDescription>Editing can be layered on this config-backed view without changing adjudication rules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Policy ID" value={policyTerms.policy_id} />
          <Field label="Policy name" value={policyTerms.policy_name} />
          <Field label="Effective date" value={formatDate(policyTerms.effective_date)} />
          <Field label="Company" value={policyTerms.policy_holder.company} />
          <Field label="Employees covered" value={String(policyTerms.policy_holder.employees_covered)} />
          <Field label="Dependents covered" value={policyTerms.policy_holder.dependents_covered ? "Yes" : "No"} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Annual limit" value={formatCurrency(policyTerms.coverage_details.annual_limit)} />
            <Field label="Per-claim limit" value={formatCurrency(policyTerms.coverage_details.per_claim_limit)} />
            <Field label="Family floater limit" value={formatCurrency(policyTerms.coverage_details.family_floater_limit)} />
            <Field label="Minimum claim amount" value={formatCurrency(policyTerms.claim_requirements.minimum_claim_amount)} />
            <Field label="Submission timeline" value={`${policyTerms.claim_requirements.submission_timeline_days} days`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cashless Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Available" value={policyTerms.cashless_facilities.available ? "Yes" : "No"} />
            <Field label="Network only" value={policyTerms.cashless_facilities.network_only ? "Yes" : "No"} />
            <Field label="Pre-approval required" value={policyTerms.cashless_facilities.pre_approval_required ? "Yes" : "No"} />
            <Field label="Instant approval limit" value={formatCurrency(policyTerms.cashless_facilities.instant_approval_limit)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw Configuration</CardTitle>
          <CardDescription>Source of truth imported by server/policy.ts.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="code-panel">{JSON.stringify(policyTerms, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-white p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
