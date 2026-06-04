# Test Report

The automated suite in `tests/adjudicator.test.ts` loads all ten cases from `assignment/test_cases.json`.

Expected coverage:

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

Run:

```bash
npm test
```

The final command output should show `10 passed` after dependency installation.
