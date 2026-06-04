import type { ClaimInput, UploadedDocument } from "../../../../server/types";

export async function parseClaimForm(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const body = (await request.json()) as ClaimInput;
    return { claim: body, files: [], pastedText: body.extracted_fields?.raw_text };
  }

  const formData = await request.formData();
  const metadata = formData.get("metadata");
  const claim = metadata
    ? (JSON.parse(String(metadata)) as ClaimInput)
    : ({
        member_id: String(formData.get("member_id") ?? ""),
        member_name: String(formData.get("member_name") ?? ""),
        treatment_date: String(formData.get("treatment_date") ?? ""),
        claim_amount: Number(formData.get("claim_amount") ?? 0),
        documents: {}
      } satisfies ClaimInput);
  const pastedText = String(formData.get("pasted_text") ?? "");
  const files: Array<UploadedDocument & { base64?: string }> = [];

  for (const value of formData.getAll("files")) {
    if (!(value instanceof File)) continue;
    const bytes = Buffer.from(await value.arrayBuffer());
    files.push({
      name: value.name,
      type: value.type,
      size: value.size,
      status: "processed",
      base64: bytes.toString("base64")
    });
  }

  claim.uploaded_documents = files.map(({ base64: _base64, ...file }) => file);
  return { claim, files, pastedText };
}
