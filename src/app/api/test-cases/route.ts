import { NextResponse } from "next/server";
import testCases from "../../../../data/test_cases.json";

export async function GET() {
  return NextResponse.json(testCases);
}
