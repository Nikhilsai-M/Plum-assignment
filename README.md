# Plum OPD Claim Adjudication System

Production-quality MVP for the Plum AI Automation Engineer Internship Assignment. The app accepts OPD claims and document uploads, uses Gemini 2.5 Flash only for extraction, then applies deterministic TypeScript rules for the final adjudication decision.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict mode
- TailwindCSS with shadcn-style reusable components
- Next.js API routes
- Supabase Postgres with in-memory local fallback
- Gemini 2.5 Flash multimodal extraction adapter
- Vitest assignment test suite

## Run Locally

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://127.0.0.1:3000`.

## Environment

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Supabase is optional for local demo mode. Without Supabase credentials, claims are stored in memory. To enable database persistence, run [supabase/schema.sql](./supabase/schema.sql) in Supabase SQL editor.

The app does not auto-create Supabase tables because Supabase REST clients cannot safely run arbitrary DDL migrations. If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set but the schema is missing, the app logs the schema error and falls back to in-memory storage for local development.

## Tests

```bash
npm test
```

The test suite loads every case from [assignment/test_cases.json](./assignment/test_cases.json) and validates the expected decision, amount, rejection reasons, fraud flags, confidence score, and cashless/network outputs.

## Deliverables

- Architecture: [docs/architecture.md](./docs/architecture.md)
- API documentation: [docs/api.md](./docs/api.md)
- Assumptions: [docs/assumptions.md](./docs/assumptions.md)
- Database schema: [supabase/schema.sql](./supabase/schema.sql)
- Test report: [docs/test-report.md](./docs/test-report.md)
- Repository audit: [docs/repository-audit.md](./docs/repository-audit.md)
- Official test results: [docs/test-results.md](./docs/test-results.md)
- Interview notes: [docs/interview-notes.md](./docs/interview-notes.md)
