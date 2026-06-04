import { NextResponse } from "next/server";
import { completeReview, getClaim } from "../../../../../server/storage/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getClaim(id);
  if (!record) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  return NextResponse.json({ record });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    action?: string;
    reviewed_by?: string;
    review_notes?: string;
  };
  const errors: string[] = [];
  if (body.action !== "APPROVE" && body.action !== "REJECT") {
    errors.push("Review action must be APPROVE or REJECT.");
  }
  if (!body.reviewed_by?.trim()) errors.push("Reviewer name is required.");
  if (!body.review_notes?.trim()) errors.push("Review notes are required.");
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });
  const reviewedBy = body.reviewed_by?.trim() ?? "";
  const reviewNotes = body.review_notes?.trim() ?? "";

  const record = await completeReview(id, {
    action: body.action as "APPROVE" | "REJECT",
    reviewed_by: reviewedBy,
    review_notes: reviewNotes
  });
  if (!record) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  return NextResponse.json({ record });
}
