# Interview Notes

## Architecture Decisions

The application separates document understanding from claim adjudication. Gemini extracts structured fields from documents, while deterministic TypeScript rules make the final decision. This keeps the system explainable, testable, and aligned with policy terms.

Next.js API routes keep the assignment compact while still providing a full-stack boundary between UI, extraction, rules, and storage. Supabase is supported for persistence, with memory fallback for evaluator demos.

## Why Rule Engine Over LLM Decisions

Insurance decisions need predictable policy enforcement. A rule engine provides:

- Reproducible outcomes for the same claim.
- Clear rejection reasons and triggered rules.
- Direct mapping to the deterministic rule modules under `server/rules`.
- Safer handling of exclusions, limits, waiting periods, and fraud flags.
- Testability against the official scenarios in `data/test_cases.json`.

The LLM remains useful for OCR and field extraction, but it does not decide approval, rejection, or payable amount.

## Tradeoffs

- The deterministic fallback is reliable for structured JSON/test-case data, but it is not a full replacement for OCR on arbitrary real-world scans.
- Memory fallback improves demo resilience but does not persist across server restarts.
- Manual review is intentionally lightweight: reviewer metadata is stored, but role-based access control is out of scope for the internship MVP.
- Policy configuration is read-only to demonstrate extensibility without introducing unsafe runtime policy edits.

## Scalability Considerations

- Move document binaries to Supabase Storage or S3 and store immutable file references.
- Run extraction asynchronously with a job queue for large PDFs or high upload volume.
- Add database indexes on member, status, treatment date, and reviewer fields.
- Version policy terms so historical claims are adjudicated against the correct policy snapshot.
- Add reviewer roles, audit immutability, and event sourcing for regulated workflows.

## Future Improvements

- Add real OCR pre-processing for low-quality images and handwritten prescriptions.
- Add appeal intake and re-adjudication flow.
- Add editable policy configuration with approvals and versioning.
- Add richer fraud analytics using historical provider/member patterns.
- Add CI with test/build gates and deployment checks.
- Persist extraction metrics for model-quality monitoring.

## Fraud Detection Strategy

The current system routes suspicious claims to `MANUAL_REVIEW` rather than automatically rejecting them. This keeps ambiguous fraud signals in a human-review workflow.

Current triggers include:

- Multiple claims from the same member on the same day.
- Suspicious frequency.
- Duplicate claim markers.
- Potentially altered documents.
- High-value claims over the manual-review threshold.
- System confidence below 70%.

## Manual Review Strategy

Manual review starts when adjudication returns `MANUAL_REVIEW`. A reviewer can approve or reject the claim, and the system stores:

- `reviewed_by`
- `reviewed_at`
- `review_notes`
- previous automated decision
- final status

The claim audit trail is updated with `MANUAL_REVIEW_COMPLETED`, preserving explainability for the demo and for future compliance workflows.
