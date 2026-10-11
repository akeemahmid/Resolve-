"use node";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { v } from "convex/values";
import { action, internalAction, env } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { MAX_BODY, messageIds } from "./validators";
import { interpretReply } from "./provider";

function resend() {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_NOT_CONFIGURED");
  return new Resend(env.RESEND_API_KEY);
}
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), 45_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export const contact = action({
  args: { graphId: v.id("remediationGraphs"), nodeId: v.id("graphNodes") },
  returns: v.id("communications"),
  handler: async (ctx, args): Promise<Id<"communications">> => {
    return await ctx.runMutation(internal.coordination.outbound.prepare, {
      ...args,
      token: randomBytes(24).toString("hex"),
    });
  },
});
export const send = internalAction({
  args: { communicationId: v.id("communications") },
  returns: v.null(),
  handler: async (ctx, { communicationId }) => {
    const c: Doc<"communications"> | null = await ctx.runMutation(
      internal.coordination.outbound.claim,
      { communicationId },
    );
    if (!c) return null;
    try {
      const provider = resend();
      const result = await bounded(
        provider.emails.send(
          {
            from: c.from,
            to: c.to,
            subject: c.subject,
            text: c.textBody,
            replyTo: c.replyTo,
            headers: {
              "X-Resolve-Conversation": c.correlationToken!,
              ...(c.inReplyTo
                ? {
                    "In-Reply-To": c.inReplyTo,
                    References: c.references.join(" "),
                  }
                : {}),
            },
          },
          { idempotencyKey: `resolve-contact-${c._id}` },
        ),
      );
      if (result.error || !result.data) throw new Error("SEND_FAILED");
      await ctx.runMutation(internal.coordination.outbound.sent, {
        communicationId,
        providerEmailId: result.data.id,
        attempt: c.attempts,
      });
      // Failure to fetch metadata must never change an accepted send into a retry.
      try {
        const { data } = await bounded(provider.emails.get(result.data.id));
        if (data)
          await ctx.runMutation(internal.coordination.outbound.metadata, {
            communicationId,
            messageId: messageIds(data.message_id ?? "")[0],
            deliveryStatus: data.last_event,
          });
      } catch {
        /* later delivery webhooks can fill metadata */
      }
    } catch {
      await ctx.runMutation(internal.coordination.outbound.fail, {
        communicationId,
        attempt: c.attempts,
        error:
          "Resend send failed or outcome is uncertain. Check configuration/delivery logs; retry keeps the same request identity.",
      });
    }
    return null;
  },
});
export const receive = internalAction({
  args: { eventId: v.id("externalEvents") },
  returns: v.null(),
  handler: async (ctx, { eventId }) => {
    const event: Doc<"externalEvents"> | null = await ctx.runMutation(
      internal.coordination.inbound.claim,
      { eventId },
    );
    if (!event) return null;
    let stage = "retrieval";
    try {
      const { data, error } = await bounded(
        resend().emails.receiving.get(event.providerEmailId),
      );
      if (error || !data || data.id !== event.providerEmailId)
        throw new Error("RETRIEVAL_FAILED");
      const headers = Object.fromEntries(
        Object.entries(data.headers ?? {}).map(([k, val]) => [
          k.toLowerCase(),
          val,
        ]),
      );
      // Avoid quoted history being mistaken for a fresh offer. HTML-only and large
      // messages remain visible as review blockers, not guessed text.
      const raw = data.text ?? "";
      const text = raw
        .split(
          /\n(?:On .{0,300}wrote:|[-]{2,}\s*Original Message\s*[-]{2,}|>)/i,
        )[0]
        .trim();
      const communication: Doc<"communications"> | null = await ctx.runMutation(
        internal.coordination.inbound.store,
        {
          eventId,
          attempt: event.attempt,
          email: {
            providerEmailId: data.id,
            from: data.from.slice(0, 500),
            to: [...new Set([...(data.received_for ?? []), ...data.to])].slice(
              0,
              30,
            ),
            subject: data.subject.slice(0, 300),
            textBody: text.length <= MAX_BODY ? text : "",
            messageId: messageIds(data.message_id ?? "")[0],
            inReplyTo: messageIds(headers["in-reply-to"] ?? "")[0],
            references: messageIds(headers.references ?? ""),
            attachments: data.attachments.slice(0, 30).map((a) => ({
              providerAttachmentId: a.id,
              filename: (a.filename ?? "attachment").slice(0, 250),
              contentType: a.content_type.slice(0, 150),
            })),
            authenticationFailed:
              /\b(?:dmarc|dkim|spf)=(?:fail|softfail|permerror)\b/i.test(
                headers["authentication-results"] ?? "",
              ),
          },
        },
      );
      if (!communication) return null;
      stage = "interpretation";
      const result = await interpretReply(
        communication.textBody,
        communication.subject,
      );
      await ctx.runMutation(internal.coordination.inbound.apply, {
        eventId,
        attempt: event.attempt,
        ...result,
      });
    } catch {
      await ctx.runMutation(internal.coordination.inbound.fail, {
        eventId,
        attempt: event.attempt,
        error:
          stage === "retrieval"
            ? "Received email could not be retrieved. Replay the signed webhook to retry."
            : "OpenAI interpretation unavailable or invalid. No graph transition occurred; retry from the timeline.",
      });
    }
    return null;
  },
});
