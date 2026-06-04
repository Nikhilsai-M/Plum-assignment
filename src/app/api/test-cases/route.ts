import { NextResponse } from "next/server";
import testCases from "../../../../assignment/test_cases.json";

export async function GET() {
  return NextResponse.json(testCases);
}
