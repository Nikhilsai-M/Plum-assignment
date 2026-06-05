# Test Report

Generated on 2026-06-05 from `data/test_cases.json`.

## Commands Run

```bash
npm test
npm run build
```

## Automated Test Result

Result: PASS

Vitest summary:

- Test files: 1 passed
- Tests: 10 passed
- Duration: 965ms

The suite in `tests/adjudicator.test.ts` runs all ten official scenarios through `server/rules/adjudicator.ts`.

| Case | Scenario | Expected |
| --- | --- | --- |
| TC001 | Simple consultation | APPROVED |
| TC002 | Dental treatment with cosmetic item | PARTIAL |
| TC003 | Per-claim limit exceeded | REJECTED |
| TC004 | Missing prescription | REJECTED |
| TC005 | Diabetes waiting period | REJECTED |
| TC006 | Alternative medicine | APPROVED |
| TC007 | MRI without pre-auth | REJECTED |
| TC008 | Multiple same-day claims | MANUAL_REVIEW |
| TC009 | Weight loss treatment | REJECTED |
| TC010 | Network hospital cashless | APPROVED |

## Build Result

Result: PASS

Build summary:

- Next.js 15.5.18 production compile succeeded.
- TypeScript validation succeeded.
- Static page generation completed for 13 routes.
- Dynamic API routes and claim detail routes were recognized by Next.js.

## Notes

- Vitest emitted a Vite CJS Node API deprecation warning. This does not fail tests or block submission.
- The build loaded local `.env` values during validation. Production secrets must be configured in Vercel, not committed.
