import { NextResponse } from "next/server";
import { listClaims } from "../../../../server/storage/supabase";

export async function GET() {
  const claims = await listClaims();
  const total = claims.length;
  const approved = claims.filter((item) => item.result.decision === "APPROVED").length;
  const rejected = claims.filter((item) => item.result.decision === "REJECTED").length;
  const partial = claims.filter((item) => item.result.decision === "PARTIAL").length;
  const manualReview = claims.filter((item) => item.result.decision === "MANUAL_REVIEW").length;
  const averageConfidence = total
    ? claims.reduce((sum, item) => sum + item.result.confidence_score, 0) / total
    : 0;

  return NextResponse.json({
    total,
    approved,
    rejected,
    partial,
    manualReview,
    averageConfidence,
    recent: claims.slice(0, 5)
  });
}
