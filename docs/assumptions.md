# Assumptions

- The provided policy terms and test cases are runtime fixtures for this evaluation and live in `data/policy_terms.json` and `data/test_cases.json`.
- No real member enrollment table is provided, so the app seeds covered members for `EMP001` through `EMP010` from the official scenarios.
- `policy_terms.json` has no explicit policy end date, so the policy is considered active for treatments on or after `2024-01-01`.
- The dental scenario expects covered dental procedures to use dental category limits, so dental item sub-limits are treated as category-specific limits.
- MRI and CT claims above the diagnostic sub-limit require pre-authorization because the policy marks those tests as pre-auth dependent.
- Gemini failures, missing keys, quota errors, or timeouts should not block local evaluation. Fallback extraction creates reviewable fields from claim metadata and pasted text.
- Fraud indicators produce `MANUAL_REVIEW`, not automatic rejection, so suspicious claims can be handled by a human reviewer.
- Supabase is required for durable production persistence. In-memory storage is available for local reviewer demos and resets when the server restarts.
