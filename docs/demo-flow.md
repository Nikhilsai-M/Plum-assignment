# Demo Flow

## 1. Open Dashboard

Start the app and open `http://127.0.0.1:3000`. The dashboard shows total claims, decision counts, average confidence, manual-review workload, and recent claims.

## 2. Create Claim

Open `/new-claim`. Either fill the claim fields manually or choose a provided scenario from the test-case selector.

## 3. Upload Documents

Attach supporting files or paste OCR/document text. Uploaded file metadata is shown in the submission flow so reviewers can confirm what was provided.

## 4. Extract Information

Run extraction. If Gemini is configured, the app attempts AI extraction. If Gemini is unavailable, the fallback extractor produces structured fields and shows a fallback notice.

## 5. Review Extracted Data

Review patient, doctor, diagnosis, treatment date, medicines, tests, procedures, line items, document types, quality, and confidence score. Edit any field before submission.

## 6. Submit Claim

Submit the reviewed claim. The API normalizes the payload, validates required fields, applies deterministic adjudication rules, and stores the result.

## 7. View Adjudication Result

After submission, open the claim result page. Review the decision, approved amount, rejection reasons, confidence, next steps, rule explanations, extracted fields, uploaded documents, and audit trail.

## 8. View Claim History

Open `/claims` to review submitted claims. Use filtering and sorting to inspect previous approvals, rejections, partial approvals, and manual-review cases.

## 9. Review Manual-Review Workflow

Open `/manual-review` for claims routed to human review. Select a claim, enter reviewer name and notes, then approve or reject the claim. The updated decision and manual-review metadata appear on the result page.
