# Official Test Results

Generated on 2026-06-05 from `data/test_cases.json`.

Command:

```bash
npm test
```

Result: PASS

Vitest summary:

- Test files: 1 passed
- Tests: 10 passed
- Duration: 965ms

| Case | Scenario | Expected | Actual | Result | Reason |
| --- | --- | --- | --- | --- | --- |
| TC001 | Simple Consultation - Approved | APPROVED | APPROVED | PASS | Consultation and diagnostic bill passed eligibility, document, coverage, limit, and medical checks. |
| TC002 | Dental Treatment - Partial Approval | PARTIAL | PARTIAL | PASS | Root canal is covered; cosmetic whitening is separated as a rejected item. |
| TC003 | Limit Exceeded - Rejected | REJECTED | REJECTED | PASS | Claim amount exceeds the per-claim limit and returns `PER_CLAIM_EXCEEDED`. |
| TC004 | Missing Documents - Rejected | REJECTED | REJECTED | PASS | Missing prescription triggers `MISSING_DOCUMENTS`. |
| TC005 | Pre-existing Condition - Waiting Period | REJECTED | REJECTED | PASS | Diabetes-specific waiting period triggers `WAITING_PERIOD`. |
| TC006 | Alternative Medicine - Approved | APPROVED | APPROVED | PASS | Ayurveda/Panchakarma is covered under the alternative medicine policy terms. |
| TC007 | Diagnostic Tests - Pre-auth Required | REJECTED | REJECTED | PASS | MRI claim above diagnostic sub-limit without pre-auth triggers `PRE_AUTH_MISSING`. |
| TC008 | Fraud Detection - Manual Review | MANUAL_REVIEW | MANUAL_REVIEW | PASS | Multiple same-day high-pattern claims trigger manual review flags. |
| TC009 | Excluded Treatment - Rejected | REJECTED | REJECTED | PASS | Weight-loss treatment is excluded and rejected as not covered. |
| TC010 | Network Hospital - Cashless Approved | APPROVED | APPROVED | PASS | Network hospital discount and cashless approval are calculated as expected. |

Additional validation:

```bash
npm run build
```

Result: PASS

Build summary:

- Next.js production compile succeeded.
- TypeScript validation succeeded.
- Static and dynamic routes generated successfully.
