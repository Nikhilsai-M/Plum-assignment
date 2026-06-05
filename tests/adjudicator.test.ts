import { describe, expect, it } from "vitest";
import testCases from "../data/test_cases.json";
import { adjudicateClaim } from "../server/rules/adjudicator";
import type { ClaimInput } from "../server/types";

describe("assignment OPD adjudication cases", () => {
  for (const testCase of testCases.test_cases) {
    it(`${testCase.case_id}: ${testCase.case_name}`, () => {
      const result = adjudicateClaim(testCase.input_data as ClaimInput);
      const expected = testCase.expected_output;

      expect(result.decision).toBe(expected.decision);
      if ("approved_amount" in expected) {
        expect(result.approved_amount).toBe(expected.approved_amount);
      }
      if ("rejection_reasons" in expected) {
        expect(result.rejection_reasons).toEqual(expected.rejection_reasons);
      }
      if ("confidence_score" in expected) {
        expect(result.confidence_score).toBe(expected.confidence_score);
      }
      if ("flags" in expected) {
        expect(result.flags).toEqual(expected.flags);
      }
      if ("cashless_approved" in expected) {
        expect(result.cashless_approved).toBe(expected.cashless_approved);
      }
      if ("network_discount" in expected) {
        expect(result.network_discount).toBe(expected.network_discount);
      }
    });
  }
});
