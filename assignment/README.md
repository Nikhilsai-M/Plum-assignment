# Plum OPD Claim Adjudication Tool

AI-powered full-stack MVP for automating approval, rejection, partial approval, and manual-review decisions for OPD insurance claims.

## What It Does

- Accepts claim JSON, pasted OCR/document text, and text/JSON/PDF uploads.
- Uses Gemini for structured extraction from text and bill/prescription images when `GEMINI_API_KEY` is configured.
- Falls back to deterministic extraction so the app works locally without an LLM key.
- Applies the policy terms in `policy_terms.json` and the adjudication flow in `adjudication_rules.md`.
- Stores adjudicated claims in Supabase when credentials are configured, otherwise uses in-memory storage.
- Includes the official assignment test cases as one-click UI scenarios and automated tests.

## Tech Stack

- React + TypeScript + Vite
- Node.js + Express
- Supabase Postgres
- Optional Gemini multimodal extraction adapter
- Vitest for rule-engine verification

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Backend: `http://127.0.0.1:8787`

## Environment Variables

```bash
PORT=8787
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Supabase is optional for local demo mode. To enable it, create a project, run `supabase/schema.sql` in the SQL editor, and set `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`.

## Run Tests

```bash
npm test
```

The tests run every case from `assignment/test_cases.json` through `server/ruleEngine.ts`.

## Documentation

- Architecture and decision flow: `docs/architecture.md`
- API reference: `docs/api.md`
- Original assignment brief: `plum_intern_assignment.md`
- Policy terms: `assignment/policy_terms.json`
- Adjudication rules: `adjudication_rules.md`

## Notes and Assumptions

- The provided package does not include real member data, so `server/policy.ts` seeds covered members for the official test cases.
- Bill and prescription photos are sent to Gemini as multimodal inputs. Without `GEMINI_API_KEY`, the app still runs using text/JSON fallback extraction.
- The deterministic fallback is intentionally kept so evaluators can run the app without external API keys.
