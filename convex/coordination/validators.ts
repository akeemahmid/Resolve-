import { v } from "convex/values";

export const role = v.union(
  v.literal("CONTACT"),
  v.literal("RESPONSE"),
  v.literal("QUOTE"),
  v.literal("APPROVAL"),
);
export const interpretation = v.object({
  intent: v.union(
    ...(
      [
        "QUOTE",
        "AVAILABILITY",
        "CLARIFICATION",
        "DECLINE",
        "COMPLETION_CLAIM",
        "GENERAL_REPLY",
        "UNKNOWN",
      ] as const
    ).map((x) => v.literal(x)),
  ),
  quote: v.object({
    amount: v.union(v.number(), v.null()),
    currency: v.union(v.string(), v.null()),
    evidence: v.union(v.string(), v.null()),
  }),
  availability: v.object({ text: v.union(v.string(), v.null()) }),
  completionClaim: v.boolean(),
  questions: v.array(v.string()),
  summary: v.string(),
  confidence: v.union(v.literal("HIGH"), v.literal("MEDIUM"), v.literal("LOW")),
});
export const attachment = v.object({
  providerAttachmentId: v.string(),
  filename: v.string(),
  contentType: v.string(),
});
export const receivedEmail = v.object({
  providerEmailId: v.string(),
  from: v.string(),
  to: v.array(v.string()),
  subject: v.string(),
  textBody: v.string(),
  messageId: v.optional(v.string()),
  inReplyTo: v.optional(v.string()),
  references: v.array(v.string()),
  attachments: v.array(attachment),
  authenticationFailed: v.boolean(),
});
export const eventArgs = {
  eventId: v.id("externalEvents"),
  attempt: v.number(),
};
export const MAX_BODY = 24_000;
export const MAX_MESSAGES = 100;
export const SEND_WINDOW = 23 * 60 * 60 * 1000;
export function mailbox(value: string) {
  const text = value.trim();
  const match = text.match(/^[^<>\r\n]*<([^<>\r\n]+)>$/);
  const email = (match?.[1] ?? text).toLowerCase();
  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(
      email,
    )
  )
    return null;
  return email;
}
export function messageIds(value: string) {
  return [...new Set(value.match(/<[^<>\s]{1,250}>/g) ?? [])].slice(-30);
}
