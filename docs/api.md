# API Documentation

## `POST /api/extract`

Accepts `multipart/form-data` with:

- `metadata`: JSON claim payload
- `pasted_text`: optional OCR or document text
- `files`: optional images, PDFs, text, or JSON files

Returns:

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
    "hospital_name": "",
    "claim_amount": 0,
    "confidence_score": 0
  }
}
```

## `POST /api/claims`

Accepts the same form payload as `/api/extract`, runs extraction if needed, adjudicates deterministically, stores the claim, and returns:

```json
{
  "record": {
    "id": "CLM_XXXXX",
    "claim": {},
    "result": {}
  }
}
```

## `GET /api/claims`

Returns all stored claims in reverse chronological order.

## `GET /api/claims/:id`

Returns a single stored claim and adjudication result.

## `PATCH /api/claims/:id`

Completes a manual review action for a claim.

Request:

```json
{
  "action": "APPROVE",
  "reviewed_by": "Claims Specialist",
  "review_notes": "Documents verified manually."
}
```

Returns the updated claim record with final status, reviewer metadata, and an updated audit trail.

## `GET /api/dashboard`

Returns aggregate counts, average confidence, and recent claims:

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

Returns the official assignment test cases for the New Claim page scenario loader.

## UI Routes

- `/policy`: policy explorer loaded from `assignment/policy_terms.json`
- `/admin/policy`: read-only admin policy configuration view
