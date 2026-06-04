import { NextResponse } from "next/server";
import { extractDocuments } from "../../../../server/extraction/gemini";
import { parseClaimForm } from "../_lib/form";

export async function POST(request: Request) {
  const parsed = await parseClaimForm(request);
  const extracted = await extractDocuments(parsed);
  return NextResponse.json({ extracted });
}
