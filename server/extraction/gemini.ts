import type { ClaimInput, ExtractedFields, UploadedDocument } from "../types";
import { extractFromClaimInput } from "./fallback";

type ExtractionPayload = {
  claim: ClaimInput;
  files?: Array<UploadedDocument & { base64?: string }>;
  pastedText?: string;
};

const extractionPrompt = `You extract structured OPD insurance claim data from Indian medical documents.
Return only strict JSON matching this shape:
{
  "patient_name": "",
  "doctor_name": "",
  "doctor_registration": "",
  "diagnosis": "",
  "treatment_date": "YYYY-MM-DD",
  "medicines": [],
  "tests": [],
  "procedures": [],
  "hospital_name": "",
  "claim_amount": 0,
  "line_items": [{"label":"","amount":0,"category":"consultation|diagnostic|pharmacy|dental|vision|alternative_medicine|procedure|other"}],
  "document_types": [],
  "document_quality": "clear|partial|illegible",
  "confidence_score": 0
}
Do not decide approval or rejection. The deterministic rule engine makes final decisions.`;

export async function extractDocuments(payload: ExtractionPayload): Promise<ExtractedFields> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return enrichFallback(payload);

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const parts: Array<Record<string, unknown>> = [
    { text: extractionPrompt },
    { text: `Claim metadata: ${JSON.stringify(payload.claim)}` }
  ];

  if (payload.pastedText) {
    parts.push({ text: `Pasted OCR/document text:\n${payload.pastedText}` });
  }

  for (const file of payload.files ?? []) {
    if (file.base64) {
      parts.push({
        inlineData: {
          mimeType: file.type || "application/octet-stream",
          data: file.base64
        }
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 }
        })
      }
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      throw new Error(`Gemini extraction failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("Gemini extraction returned an empty response.");
    const parsed = JSON.parse(text) as ExtractedFields;
    return {
      ...extractFromClaimInput(payload.claim),
      ...parsed,
      raw_text: payload.pastedText ?? parsed.raw_text,
      extraction_source: "gemini",
      extraction_notice: undefined
    };
  } catch (error) {
    console.error(error);
    return enrichFallback(payload);
  }
}

function enrichFallback(payload: ExtractionPayload): ExtractedFields {
  const fallback = extractFromClaimInput(payload.claim);
  return {
    ...fallback,
    raw_text: payload.pastedText ?? fallback.raw_text,
    confidence_score: payload.files?.length ? 0.74 : fallback.confidence_score,
    extraction_source: "fallback",
    extraction_notice: "AI extraction unavailable. Using fallback extraction."
  };
}
