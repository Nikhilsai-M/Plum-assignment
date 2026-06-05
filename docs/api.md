# API Documentation

## `POST /api/extract`

Accepts `multipart/form-data` with:

- `metadata`: JSON claim payload
- `pasted_text`: optional OCR or document text
- `files`: optional images, PDFs, text files, or JSON files

Returns extracted OPD fields:

```json
{
  "extracted": {
    "patient_name": "",
    "doctor_name": "",
    "doctor_registration": "",
    "diagnosis": "",
    "treatment_date": "",
    "medicines": [],
    "tests": [],
    "procedures": [],
    "hospital_name": "",
    "claim_amount": 0,
    "line_items": [],
    "document_types": [],
    "document_quality": "clear",
    "confidence_score": 0,
    "extraction_source": "gemini"
  }
}
```

If Gemini is unavailable, the response uses fallback extraction and includes an extraction notice.

## `POST /api/claims`

Accepts the same form payload as `/api/extract`. The route runs extraction when reviewed fields are not already supplied, normalizes the claim, adjudicates through deterministic rules, stores the claim, and returns:

```json
{
  "record": {
    "id": "CLM_XXXXX",
    "claim": {},
    "result": {}
  }
}
```

Validation failures return `400` with an `errors` array.

## `GET /api/claims`

Returns all stored claims in reverse chronological order:

```json
{
  "claims": []
}
```

## `GET /api/claims/:id`

Returns a single stored claim and adjudication result:

```json
{
  "record": {
    "id": "CLM_XXXXX",
    "claim": {},
    "result": {}
  }
}
```

Missing claims return `404`.

## `PATCH /api/claims/:id`

Completes a manual-review action.

Request:

```json
{
  "action": "APPROVE",
  "reviewed_by": "Claims Specialist",
  "review_notes": "Documents verified manually."
}
```

`action` must be `APPROVE` or `REJECT`. The response returns the updated claim record with final decision, reviewer metadata, and updated audit trail.

## `GET /api/dashboard`

Returns aggregate dashboard metrics:

```json
{
  "total": 0,
  "approved": 0,
  "rejected": 0,
  "partial": 0,
  "manualReview": 0,
  "averageConfidence": 0,
  "recent": []
}
```

## `GET /api/test-cases`

Returns the official reviewer scenarios from `data/test_cases.json` for the New Claim page scenario loader.

## UI Routes

- `/`: dashboard
- `/new-claim`: guided claim creation, extraction, review, and submission
- `/claims`: claim history
- `/claims/:id`: adjudication result details
- `/manual-review`: manual-review queue and completion workflow
- `/policy`: policy explorer loaded from `data/policy_terms.json`
