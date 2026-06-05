# Plum OPD Claim Adjudication System

## Project Overview

Plum OPD Claim Adjudication System is a full-stack claims evaluation app for outpatient insurance claims. Users can create a claim, upload or paste supporting document content, run AI-assisted extraction, review extracted fields, submit the claim, and inspect the deterministic adjudication result.

The project is built for technical review: AI is used only for document extraction, while final claim decisions are made by auditable TypeScript rules.

## Features

- Dashboard with claim totals, decision breakdown, average confidence, and recent activity.
- Guided claim submission flow with document upload, pasted text support, extraction preview, review, and adjudication.
- Gemini-backed multimodal extraction with deterministic fallback for local evaluation.
- Deterministic OPD adjudication rules for eligibility, documents, coverage, limits, medical necessity, process checks, and fraud review.
- Claim history with result details, uploaded document metadata, extracted fields, rule explanations, audit trail, and manual-review outcomes.
- Manual-review queue with approve/reject completion workflow.
- Policy explorer for reviewer visibility into active OPD terms.
- Supabase persistence with in-memory fallback for local demos.
- Vitest coverage for the official claim scenarios stored in `data/test_cases.json`.

## Architecture

The application uses Next.js App Router for both UI and API routes. Claim form data is parsed by API handlers, optionally enriched through Gemini extraction, normalized, adjudicated by deterministic rule modules, and persisted through the storage abstraction.

Core boundaries:

- `src/app`: application routes, pages, API handlers, and global styling.
- `src/components`: reusable UI components.
- `server/extraction`: Gemini adapter and deterministic fallback extraction.
- `server/rules`: deterministic adjudication rule engine.
- `server/storage`: Supabase-backed storage with in-memory fallback.
- `data`: runtime policy terms and test-case fixtures.
- `supabase/schema.sql`: database schema for persistent deployments.

See [docs/architecture.md](./docs/architecture.md) for the flow diagram and rule-module breakdown.

## Technology Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS
- Supabase Postgres
- Gemini 2.5 Flash API
- Vitest

## Installation

```bash
npm install
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

## Environment Variables

Create `.env` from `.env.example` and set values as needed:

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- `GEMINI_API_KEY` enables AI document extraction. If omitted or unavailable, the app uses deterministic fallback extraction.
- `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` enable persistent storage. Without them, claims are stored in memory for the current server session.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only and must not be exposed with a `NEXT_PUBLIC_` prefix.

## Running Locally

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

For Supabase persistence, run [supabase/schema.sql](./supabase/schema.sql) in the Supabase SQL editor, then restart the dev server with Supabase environment variables set. If Supabase credentials are present but the schema is missing, the app logs the schema issue and falls back to in-memory storage for local evaluation.

## Running Tests

```bash
npm test
```

The test suite runs every case in [data/test_cases.json](./data/test_cases.json) through the deterministic adjudicator and validates expected decisions, amounts, rejection reasons, fraud flags, confidence scores, cashless approval, and network discounts.

## Deployment

Recommended Vercel setup:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Use the default Next.js build settings.
4. Add production environment variables in Vercel Project Settings.
5. Run [supabase/schema.sql](./supabase/schema.sql) in the target Supabase project before using persistent claim storage.

Build command:

```bash
npm run build
```

Output mode: standard Next.js deployment on Vercel.

## Adjudication Flow

1. The user submits claim metadata and reviewed extracted fields.
2. The API normalizes required fields and rejects incomplete submissions with validation errors.
3. `server/rules/adjudicator.ts` executes deterministic rule modules.
4. The result includes decision, approved amount, rejection reasons, confidence score, notes, next steps, deductions, flags, rule explanations, extracted fields, uploaded document metadata, and audit events.
5. Claims with fraud-pattern indicators route to `MANUAL_REVIEW` for human action.

AI does not make the final approval, rejection, partial approval, or manual-review decision.

## AI Extraction Flow

1. The user uploads documents or pastes OCR/document text.
2. `/api/extract` parses the multipart form payload.
3. If `GEMINI_API_KEY` is configured, Gemini extracts structured OPD fields from metadata, pasted text, and supported file content.
4. If Gemini is unavailable, times out, or returns an invalid response, deterministic fallback extraction produces reviewable fields.
5. The user reviews and can edit extracted fields before final submission.

## Screenshots (placeholder section)

Screenshots can be added before final submission:

- Dashboard
- New claim extraction and review
- Adjudication result
- Claim history
- Manual-review queue

## Assumptions

- Policy terms and test scenarios live in `data/` as runtime fixtures for this technical assignment.
- The app seeds covered members from the provided scenarios because no external enrollment table is supplied.
- Supabase is required for durable production persistence, while memory mode is acceptable for local reviewer demos.
- Gemini extraction is best-effort and never controls the final adjudication decision.

See [docs/assumptions.md](./docs/assumptions.md) for the full list.

## Future Improvements

- Add authentication and role-based access for claim reviewers and admins.
- Store uploaded document binaries in Supabase Storage.
- Add CI workflow for test and build validation.
- Add reviewer-facing screenshot assets to the README.
- Add production observability for extraction failures and rule outcomes.
