import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_PDF_BYTES } from "./validators";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Upload-Id, X-Upload-Token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
export const options = httpAction(
  async () => new Response(null, { status: 204, headers: cors }),
);
export const upload = httpAction(async (ctx, request) => {
  const respond = (message: string, status: number) =>
    new Response(message, { status, headers: cors });
  if (request.headers.get("Content-Type") !== "application/pdf")
    return respond("Only PDF files are accepted.", 415);
  const uploadId = request.headers.get("X-Upload-Id");
  const token = request.headers.get("X-Upload-Token");
  if (!uploadId || !token || !/^[a-f0-9]{64}$/.test(token))
    return respond("Invalid upload ticket.", 403);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const tokenHash = Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  try {
    if (
      !(await ctx.runMutation(internal.inspections.uploads.claim, {
        uploadId: uploadId as Id<"inspectionUploads">,
        tokenHash,
      }))
    )
      return respond("Upload expired or already used.", 403);
  } catch {
    return respond("Invalid upload ticket.", 403);
  }
  // Bound the stream, even if a caller lies about Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return respond("Empty PDF.", 400);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PDF_BYTES) {
      await reader.cancel();
      return respond("PDF must be 10 MB or smaller.", 413);
    }
    chunks.push(new Uint8Array(value));
  }
  const blob = new Blob(chunks, { type: "application/pdf" });
  if ((await blob.slice(0, 5).text()) !== "%PDF-")
    return respond("This file is not a PDF.", 415);
  const storageId = await ctx.storage.store(blob);
  try {
    const attached = await ctx.runMutation(
      internal.inspections.uploads.attach,
      { uploadId: uploadId as Id<"inspectionUploads">, storageId },
    );
    if (!attached) {
      await ctx.storage.delete(storageId);
      return respond("Upload expired. Please retry.", 409);
    }
  } catch {
    await ctx.storage.delete(storageId);
    return respond("Could not save upload. Please retry.", 500);
  }
  return respond("PDF uploaded.", 200);
});
