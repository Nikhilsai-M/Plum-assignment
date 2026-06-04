import policyJson from "../assignment/policy_terms.json";
import type { CoveredMember, PolicyTerms } from "./types";

export const policyTerms = policyJson as PolicyTerms;

export const coveredMembers: CoveredMember[] = [
  "Rajesh Kumar",
  "Priya Singh",
  "Amit Verma",
  "Sneha Reddy",
  "Vikram Joshi",
  "Kavita Nair",
  "Suresh Patil",
  "Ravi Menon",
  "Anita Desai",
  "Deepak Shah"
].map((name, index) => ({
  member_id: `EMP${String(index + 1).padStart(3, "0")}`,
  name,
  join_date: index === 4 ? "2024-09-01" : "2024-01-01",
  relationship: "employee"
}));

export function findCoveredMember(memberId: string) {
  return coveredMembers.find((member) => member.member_id === memberId);
}
