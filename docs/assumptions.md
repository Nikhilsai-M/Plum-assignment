# Assumptions

- The assignment provides policy terms and test cases, but no real member enrollment table. The app seeds covered members for `EMP001` through `EMP010` from the official cases.
- `policy_terms.json` has no explicit policy end date, so the policy is considered active for treatments on or after `2024-01-01`.
- The dental test case expects root canal approval above the generic per-claim limit, so dental item sub-limits are treated as category-specific limits for covered dental procedures.
- MRI and CT claims above the diagnostic sub-limit require pre-authorization because the covered-tests list marks them as pre-auth dependent.
- Gemini failures or missing API keys do not block local evaluation. The fallback extractor structures JSON claim/test-case data deterministically.
- Fraud indicators produce `MANUAL_REVIEW`, not a final rejection, matching the assignment instruction that suspicious cases require human review.
- Supabase is required for production persistence, but in-memory storage is available for quick evaluator demos.
