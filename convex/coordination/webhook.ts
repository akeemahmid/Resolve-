import { Resend } from "resend";
import { z } from "zod";
import { httpAction, env } from "../_generated/server";
import { internal } from "../_generated/api";
import { messageIds } from "./validators";
const eventShape = z
  .object({
    type: z.string().max(100),
    data: z
      .object({
        email_id: z.string().min(1).max(200),
        message_id: z.string().max(300).optional(),
      })
      .passthrough(),
  })
  .passthrough();
export const webhook = httpAction(async (ctx, req) => {
  const webhookSecret = env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret)
    return new Response("Webhook not configured", { status: 503 });
  const id = req.headers.get("svix-id"),
    timestamp = req.headers.get("svix-timestamp"),
    signature = req.headers.get("svix-signature");
  if (!id || id.length > 200 || !timestamp || !signature) {
    console.warn("resend.webhook.rejected", "MISSING_OR_INVALID_HEADERS");
    return new Response("Invalid signature", { status: 400 });
  }
  // Bound the actual stream, not just the untrusted Content-Length header.
  const reader = req.body?.getReader();
  if (!reader) return new Response("Missing body", { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 128_000) {
      await reader.cancel();
      return new Response("Payload too large", { status: 413 });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const payload = new TextDecoder().decode(bytes);
  let verified: unknown;
  try {
    verified = new Resend("verification-only-no-api-call").webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch (error) {
    // Only fixed categories reach logs: never log the error object, request,
    // signature, or configured secret.
    let reason = "VERIFIER_ERROR";
    if (error instanceof Error) {
      switch (error.message) {
        case "No matching signature found":
          reason = "SIGNATURE_MISMATCH";
          break;
        case "Message timestamp too old":
        case "Message timestamp too new":
          reason = "TIMESTAMP_OUT_OF_WINDOW";
          break;
        case "Invalid Signature Headers":
        case "Missing required headers":
          reason = "MISSING_OR_INVALID_HEADERS";
          break;
        case "Base64Coder: incorrect characters for decoding":
        case "Base64Coder: incorrect padding":
        case "Secret can't be empty.":
          reason = "SECRET_FORMAT_INVALID";
          break;
      }
    }
    console.warn("resend.webhook.rejected", reason);
    return new Response("Invalid signature", { status: 400 });
  }
  const parsed = eventShape.safeParse(verified);
  if (!parsed.success)
    return new Response("Unsupported or malformed event", { status: 200 });
  if (
    ![
      "email.received",
      "email.sent",
      "email.delivered",
      "email.bounced",
      "email.failed",
      "email.suppressed",
    ].includes(parsed.data.type)
  )
    return new Response("Ignored", { status: 200 });
  await ctx.runMutation(internal.coordination.inbound.accept, {
    externalEventId: id,
    eventType: parsed.data.type,
    providerEmailId: parsed.data.data.email_id,
    messageId: messageIds(parsed.data.data.message_id ?? "")[0],
  });
  return new Response("Accepted", { status: 200 });
});
