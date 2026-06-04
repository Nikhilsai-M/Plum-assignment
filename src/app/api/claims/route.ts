import { NextResponse } from "next/server";
import { adjudicateClaim } from "../../../../server/rules/adjudicator";
import { extractDocuments } from "../../../../server/extraction/gemini";
import { listClaims, saveClaim } from "../../../../server/storage/supabase";
import { parseClaimForm } from "../_lib/form";
import { normalizeClaimForSubmission } from "../_lib/claim-validation";

export async function GET() {
  const claims = await listClaims();
  return NextResponse.json({ claims });
}

export async function POST(request: Request) {
  const parsed = await parseClaimForm(request);
  const extracted =
    parsed.claim.extracted_fields ?? (await extractDocuments(parsed));
  const normalized = normalizeClaimForSubmission(parsed.claim, extracted);
  if (normalized.errors.length) {
    return NextResponse.json({ errors: normalized.errors }, { status: 400 });
  }

  const result = adjudicateClaim(normalized.claim);
  const record = await saveClaim(normalized.claim, result);
  return NextResponse.json({ record });
}
