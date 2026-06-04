import type { AdjudicationResult, ClaimInput, ExtractedFields } from "../../server/types";

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as { errors?: string[]; error?: string };
      message = parsed.errors?.join(" ") ?? parsed.error ?? text;
    } catch {
      message = text;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type ClaimRecord = {
  id: string;
  claim: ClaimInput;
  result: AdjudicationResult;
};

export type DashboardSummary = {
  total: number;
  approved: number;
  rejected: number;
  partial: number;
  manualReview: number;
  averageConfidence: number;
  recent: ClaimRecord[];
};

export async function submitClaim(formData: FormData) {
  return apiJson<{ record: ClaimRecord }>("/api/claims", { method: "POST", body: formData });
}

export async function extractClaim(formData: FormData) {
  return apiJson<{ extracted: ExtractedFields }>("/api/extract", { method: "POST", body: formData });
}

export async function reviewClaim(
  id: string,
  payload: { action: "APPROVE" | "REJECT"; reviewed_by: string; review_notes: string }
) {
  return apiJson<{ record: ClaimRecord }>(`/api/claims/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
