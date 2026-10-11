import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { audit } from "./domain";
const deliveryTypes = [
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.failed",
  "email.suppressed",
];
export function deliveryState(previous: string | undefined, incoming: string) {
  if (["bounced", "failed", "suppressed"].includes(previous ?? ""))
    return previous!;
  if (previous === "delivered" && incoming === "sent") return previous;
  return incoming;
}
export async function recordDelivery(
  ctx: MutationCtx,
  event: Doc<"externalEvents">,
) {
  if (
    !deliveryTypes.includes(event.eventType) ||
    ["PROCESSED", "DUPLICATE"].includes(event.status)
  )
    return;
  const c = await ctx.db
    .query("communications")
    .withIndex("by_providerEmailId", (q) =>
      q.eq("providerEmailId", event.providerEmailId),
    )
    .unique();
  if (!c || c.direction !== "OUTBOUND") {
    await ctx.db.patch("externalEvents", event._id, {
      status: "UNMATCHED",
      error: "Provider ID not yet associated with an outbound message.",
    });
    return;
  }
  const incoming = event.eventType.replace("email.", "");
  await ctx.db.patch("communications", c._id, {
    deliveryStatus: deliveryState(c.deliveryStatus, incoming),
    ...(event.messageId ? { messageId: event.messageId } : {}),
    updatedAt: Date.now(),
  });
  await audit(ctx, c.graphId, `communication.delivery_${incoming}`, {
    communicationId: c._id,
  });
  await ctx.db.patch("externalEvents", event._id, {
    status: "PROCESSED",
    processedAt: Date.now(),
    error: undefined,
    correlatedGraphId: c.graphId,
    correlatedCommunicationId: c._id,
  });
}
// Provider callbacks may arrive before the sending action saves its response.
// The acceptance callback reconciles those events in the same transaction.
export async function reconcileDelivery(
  ctx: MutationCtx,
  providerEmailId: string,
) {
  for (const eventType of deliveryTypes) {
    const events = await ctx.db
      .query("externalEvents")
      .withIndex("by_eventType_and_providerEmailId", (q) =>
        q.eq("eventType", eventType).eq("providerEmailId", providerEmailId),
      )
      .take(20);
    for (const event of events) await recordDelivery(ctx, event);
  }
}
