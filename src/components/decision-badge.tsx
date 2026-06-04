import { Badge } from "@/components/ui/badge";
import type { ClaimDecision } from "../../server/types";

const labels: Record<ClaimDecision, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PARTIAL: "Partial",
  MANUAL_REVIEW: "Manual review"
};

export function DecisionBadge({ decision }: { decision: ClaimDecision }) {
  return <Badge variant={decision}>{labels[decision]}</Badge>;
}
