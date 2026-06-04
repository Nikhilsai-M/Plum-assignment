# Repository Audit

## Existing Architecture Summary

The project is a Next.js 15 App Router application with React 19 and TypeScript strict mode. The frontend lives in `src/app` and uses small reusable UI primitives in `src/components/ui`.

The backend is implemented with Next.js API routes:

- `POST /api/extract` parses uploads and runs Gemini-backed extraction with deterministic fallback.
- `POST /api/claims` normalizes claim data, validates required fields, adjudicates, and stores the result.
- `GET /api/claims`, `GET /api/claims/:id`, and `PATCH /api/claims/:id` support history, result details, and manual review completion.
- `GET /api/dashboard` provides operational metrics.

Core adjudication is deterministic TypeScript under `server/rules`. The rule order matches `assignment/adjudication_rules.md`: eligibility, document validation, coverage, limits, medical necessity, process checks, and fraud detection. Gemini is used only for extraction, never as the final decision authority.

Storage is abstracted through `server/storage/supabase.ts`. Supabase is used when credentials and schema are available; otherwise the app falls back to in-memory storage for demos and local evaluation.

## Current Feature Inventory

- Claim dashboard with counts, recent claims, confidence summary, and manual-review workload.
- Guided new-claim workflow with upload, extraction preview, review/edit, adjudication, and result redirect.
- Official assignment test-case loader.
- Gemini multimodal extraction adapter with timeout and deterministic fallback.
- Rule-based adjudication for all official test scenarios.
- Claim history search, status filtering, and sorting.
- Claim result page with decision details, confidence, uploaded files, rule explanations, extracted JSON, and audit trail.
- Manual review queue and approve/reject completion actions.
- Policy explorer at `/policy`.
- Read-only admin policy configuration at `/admin/policy`.
- Supabase schema plus memory fallback.
- Automated Vitest coverage for `assignment/test_cases.json`.

## Missing Assignment Requirements

No blocking core requirements remain for the provided assignment scope. The app now accepts inputs, extracts structured fields, validates policy terms, stores data, and returns deterministic decisions with reasoning.

Remaining production-grade gaps:

- Real OCR quality depends on Gemini; the deterministic fallback can structure known JSON/test-case inputs but is not a full OCR engine.
- Supabase file storage is not implemented; uploaded file metadata is stored, but binary files are not persisted to object storage.
- Authentication/authorization is not implemented for admin or reviewer actions.
- There is no deployed URL in this repository checkout.

## Missing Bonus Features

Implemented bonus features:

- Confidence scores with high/medium/low presentation.
- Manual review workflow with stored reviewer action metadata.
- Admin policy configuration view.
- Evaluation coverage for official test cases.

Still not implemented:

- RAG/few-shot retrieval over historical claims.
- Fine-tuning or advanced model evaluation metrics beyond deterministic test-case validation.
- CI/CD pipeline configuration.

## Potential Demo Risks

- A real `GEMINI_API_KEY` may hit quota or network failures. This is now handled with the required message: "AI extraction unavailable. Using fallback extraction."
- If Supabase credentials point at a project without `supabase/schema.sql`, the app falls back to memory storage and logs the schema issue.
- Refreshing the dev server clears memory-mode claims.
- Real document uploads without useful OCR output may need manual edits in the extraction preview before adjudication.
- The app uses `.env` during build; evaluator machines should start from placeholder `.env.example` values.

## User Experience Weaknesses

Issues found before this hardening pass:

- New claim flow allowed users to think manual claim fields were the first step instead of document extraction.
- Fallback extraction was silent, making Gemini quota failures hard to explain in a demo.
- Users could attempt adjudication before reviewing extraction.
- Uploaded files were not visible enough in the submission flow.
- Rule explanations existed but lacked strong visual pass/fail structure.
- Manual review was a queue, not a complete approve/reject workflow.
- Policy terms were hidden in JSON rather than inspectable in the UI.

Improvements made:

- Added a five-step guided new-claim workflow.
- Added file visibility with filename, MIME type, size, and status.
- Added explicit fallback extraction messaging.
- Added review confirmation before adjudication.
- Strengthened validation for empty claims and missing required data.
- Added visual rule explanations with icons, status badges, triggered rules, and payable amount.
- Added audit trail events for claim creation, documents, extraction, decision, and manual review.
- Added policy explorer and admin policy pages.
- Removed real-looking secrets from `.env.example`.
