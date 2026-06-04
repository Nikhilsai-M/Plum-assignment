import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ClaimDecision } from "../../server/types";

const labels: Record<ClaimDecision, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PARTIAL: "Partial",
  MANUAL_REVIEW: "Manual review"
};

export function DecisionBadge({ decision }: { decision: ClaimDecision }) {
  const Icon =
    decision === "APPROVED"
      ? CheckCircle2
      : decision === "REJECTED"
        ? XCircle
        : decision === "PARTIAL"
          ? MinusCircle
          : AlertTriangle;

  return (
    <Badge variant={decision}>
      <Icon size={13} aria-hidden="true" />
      {labels[decision]}
    </Badge>
  );
}
