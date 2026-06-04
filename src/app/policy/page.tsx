import { Building2, CircleDollarSign, ClipboardList, FileWarning, Hourglass, Network } from "lucide-react";
import { policyTerms } from "../../../server/policy";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PolicyPage() {
  const coverage = policyTerms.coverage_details;
  const categories = [
    { name: "Consultation fees", limit: coverage.consultation_fees.sub_limit, details: `${coverage.consultation_fees.copay_percentage}% co-pay` },
    { name: "Diagnostic tests", limit: coverage.diagnostic_tests.sub_limit, details: "MRI and CT may require pre-auth" },
    { name: "Pharmacy", limit: coverage.pharmacy.sub_limit, details: `${coverage.pharmacy.branded_drugs_copay}% branded-drug co-pay` },
    { name: "Dental", limit: coverage.dental.sub_limit, details: coverage.dental.procedures_covered.join(", ") },
    { name: "Vision", limit: coverage.vision.sub_limit, details: "Eye tests, glasses, and contact lenses covered" },
    { name: "Alternative medicine", limit: coverage.alternative_medicine.sub_limit, details: coverage.alternative_medicine.covered_treatments.join(", ") }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Policy Explorer</h1>
        <p className="text-sm text-muted-foreground">{policyTerms.policy_name} - values loaded directly from policy_terms.json.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={<CircleDollarSign size={20} />} label="Annual limit" value={formatCurrency(coverage.annual_limit)} />
        <Metric icon={<ClipboardList size={20} />} label="Per-claim limit" value={formatCurrency(coverage.per_claim_limit)} />
        <Metric icon={<Building2 size={20} />} label="Family floater" value={formatCurrency(coverage.family_floater_limit)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage Categories</CardTitle>
          <CardDescription>Covered OPD categories and category-specific limits.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.name} className="rounded-md border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{category.name}</p>
                <Badge variant="APPROVED">{formatCurrency(category.limit)}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{category.details}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hourglass size={18} /> Waiting Periods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Initial waiting" value={`${policyTerms.waiting_periods.initial_waiting} days`} />
            <Row label="Pre-existing diseases" value={`${policyTerms.waiting_periods.pre_existing_diseases} days`} />
            <Row label="Maternity" value={`${policyTerms.waiting_periods.maternity} days`} />
            {Object.entries(policyTerms.waiting_periods.specific_ailments).map(([name, days]) => (
              <Row key={name} label={name} value={`${days} days`} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network size={18} /> Network Hospitals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {policyTerms.network_hospitals.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileWarning size={18} /> Exclusions</CardTitle>
          <CardDescription>Claims matching these exclusions are rejected or routed for review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {policyTerms.exclusions.map((item) => (
            <div key={item} className="rounded-md border bg-muted/40 p-3 text-sm">{item}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <span className="capitalize text-muted-foreground">{label.replaceAll("_", " ")}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
