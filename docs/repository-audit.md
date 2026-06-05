# Repository Audit

## Current Architecture Summary

The project is a Next.js 15 App Router application with React 19 and TypeScript strict mode. The frontend lives in `src/app` and uses small reusable UI primitives in `src/components/ui`.

The backend is implemented with Next.js API routes:

- `POST /api/extract` parses uploads and runs Gemini-backed extraction with deterministic fallback.
- `POST /api/claims` normalizes claim data, validates required fields, adjudicates, and stores the result.
- `GET /api/claims`, `GET /api/claims/:id`, and `PATCH /api/claims/:id` support history, result details, and manual-review completion.
- `GET /api/dashboard` provides operational metrics.
- `GET /api/test-cases` serves reviewer scenarios from `data/test_cases.json`.

Core adjudication is deterministic TypeScript under `server/rules`. Gemini is used only for extraction and does not influence final decision authority.

Storage is abstracted through `server/storage/supabase.ts`. Supabase is used when credentials and schema are available; otherwise the app falls back to in-memory storage for local demos and evaluator runs.

## Runtime Assets

- `data/policy_terms.json`: policy terms used by `server/policy.ts` and policy UI pages.
- `data/test_cases.json`: official scenarios used by automated tests and the New Claim scenario loader.

Assignment handout/reference markdown files were removed from the runtime repository surface because they were not required by the app or tests.

## Feature Inventory

- Claim dashboard with counts, recent claims, confidence summary, and manual-review workload.
- Guided new-claim workflow with upload, extraction preview, review/edit, adjudication, and result redirect.
- Official test-case loader.
- Gemini multimodal extraction adapter with timeout and deterministic fallback.
- Rule-based adjudication for all official test scenarios.
- Claim history search, status filtering, and sorting.
- Claim result page with decision details, confidence, uploaded files, rule explanations, extracted JSON, and audit trail.
- Manual review queue and approve/reject completion actions.
- Policy explorer at `/policy`.
- Supabase schema plus memory fallback.
- Automated Vitest coverage for `data/test_cases.json`.

## Potential Demo Risks

- A real `GEMINI_API_KEY` can hit quota, network, or API failures. The app handles this with the notice: `AI extraction unavailable. Using fallback extraction.`
- If Supabase credentials point at a project without `supabase/schema.sql`, the app falls back to memory storage and logs the schema issue.
- Refreshing the dev server clears memory-mode claims.
- Real document uploads without useful OCR output may need manual edits in the extraction preview before adjudication.
- Authentication and authorization are not implemented, so production use would require access control before handling real claims.

## Cleanup Findings

- `documentation/` was an untracked duplicate of the requested `docs/` path and has been normalized back to `docs/`.
- Assignment reference markdown files were not imported by code or tests and have been removed.
- Runtime JSON assets were moved from `assignment/` to `data/`.
- Generated logs are ignored by `.gitignore`; existing local log files should not be submitted.
- `.env` is ignored by `.gitignore`; `.env.example` contains placeholders only.
