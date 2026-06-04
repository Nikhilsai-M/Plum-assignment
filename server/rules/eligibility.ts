import type { RuleContext, RuleOutcome } from "../types";
import { addDays, containsAny, daysBetween } from "./helpers";

export function runEligibility(ctx: RuleContext): RuleOutcome {
  const reasons: RuleOutcome["reasons"] = [];
  const { claim, policy, members, extracted } = ctx;
  const member = members.find((item) => item.member_id === claim.member_id);

  if (new Date(claim.treatment_date) < new Date(policy.effective_date)) {
    reasons.push("POLICY_INACTIVE");
  }

  if (!member) {
    reasons.push("MEMBER_NOT_COVERED");
  } else {
    const joinDate = claim.member_join_date ?? member.join_date;
    const waitingDays = waitingPeriodForDiagnosis(extracted.diagnosis, policy.waiting_periods);
    if (daysBetween(joinDate, claim.treatment_date) < waitingDays) {
      reasons.push("WAITING_PERIOD");
    }
  }

  return {
    reasons,
    explanation: {
      rule: "Basic Eligibility Check",
      status: reasons.length ? "failed" : "passed",
      reasons,
      message: reasons.length
        ? eligibilityMessage(reasons, ctx)
        : "Policy is active, claimant is covered, and waiting periods are satisfied."
    }
  };
}

function waitingPeriodForDiagnosis(
  diagnosis: string | undefined,
  waitingPeriods: RuleContext["policy"]["waiting_periods"]
) {
  const text = diagnosis ?? "";
  for (const [ailment, days] of Object.entries(waitingPeriods.specific_ailments)) {
    if (containsAny(text, [ailment])) return days;
  }
  return waitingPeriods.initial_waiting;
}

function eligibilityMessage(reasons: RuleOutcome["reasons"], ctx: RuleContext) {
  if (reasons.includes("WAITING_PERIOD")) {
    const member = ctx.members.find((item) => item.member_id === ctx.claim.member_id);
    const joinDate = ctx.claim.member_join_date ?? member?.join_date ?? ctx.policy.effective_date;
    const waitingDays = waitingPeriodForDiagnosis(ctx.extracted.diagnosis, ctx.policy.waiting_periods);
    return `${ctx.extracted.diagnosis ?? "Treatment"} has a ${waitingDays}-day waiting period. Eligible from ${addDays(joinDate, waitingDays)}.`;
  }
  if (reasons.includes("MEMBER_NOT_COVERED")) return "Claimant was not found in covered member records.";
  return "Policy was not active on the treatment date.";
}
