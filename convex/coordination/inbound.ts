import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import schema from "../schema";
import { requireGraph } from "../remediation/access";
import { completeNode, loadGraph } from "../remediation/engine";
import { audit } from "./domain";
import { recordDelivery } from "./delivery";
import {
  eventArgs,
  receivedEmail,
  interpretation,
  mailbox,
  MAX_MESSAGES,
} from "./validators";
import { usage } from "../inspections/validators";
import { Interpretation } from "./provider";
import { quoteDecision } from "./policy";

export const accept = internalMutation({
  args: {
    externalEventId: v.string(),
    eventType: v.string(),
    providerEmailId: v.string(),
    messageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("externalEvents")
      .withIndex("by_externalEventId", (q) =>
        q.eq("externalEventId", args.externalEventId),
      )
      .unique();
    if (existing) {
      if (
        existing.status === "FAILED" &&
        existing.attempt < 3 &&
        existing.eventType === "email.received"
      ) {
        await ctx.db.patch("externalEvents", existing._id, {
          status: "PENDING",
          error: undefined,
        });
        await ctx.scheduler.runAfter(
          0,
          internal.coordination.transport.receive,
          { eventId: existing._id },
        );
      }
      return null;
    }
    const canonical = await ctx.db
      .query("externalEvents")
      .withIndex("by_eventType_and_providerEmailId", (q) =>
        q
          .eq("eventType", args.eventType)
          .eq("providerEmailId", args.providerEmailId),
      )
      .first();
    const fields = args;
    const eventId = await ctx.db.insert("externalEvents", {
      ...fields,
      provider: "RESEND",
      status: canonical ? "DUPLICATE" : "PENDING",
      attempt: 0,
      receivedAt: Date.now(),
    });
    if (canonical) return null;
    if (args.eventType === "email.received") {
      await ctx.scheduler.runAfter(0, internal.coordination.transport.receive, {
        eventId,
      });
      return null;
    }
    const delivery = await ctx.db.get("externalEvents", eventId);
    if (delivery) await recordDelivery(ctx, delivery);
    return null;
  },
});
export const claim = internalMutation({
  args: { eventId: v.id("externalEvents") },
  returns: v.union(schema.doc("externalEvents"), v.null()),
  handler: async (ctx, { eventId }) => {
    const e = await ctx.db.get("externalEvents", eventId);
    if (!e || e.status !== "PENDING") return null;
    const attempt = e.attempt + 1;
    await ctx.db.patch("externalEvents", eventId, {
      status: "PROCESSING",
      attempt,
    });
    await ctx.scheduler.runAfter(180_000, internal.coordination.inbound.fail, {
      eventId,
      attempt,
      error:
        "Inbound processing timed out. Retry requires an explicit replay or owner action.",
    });
    return { ...e, status: "PROCESSING" as const, attempt };
  },
});
export const store = internalMutation({
  args: { ...eventArgs, email: receivedEmail },
  returns: v.union(schema.doc("communications"), v.null()),
  handler: async (ctx, { eventId, attempt, email }) => {
    const event = await ctx.db.get("externalEvents", eventId);
    if (
      !event ||
      event.status !== "PROCESSING" ||
      event.attempt !== attempt ||
      event.providerEmailId !== email.providerEmailId
    )
      return null;
    if (event.correlatedCommunicationId) {
      const old = await ctx.db.get(
        "communications",
        event.correlatedCommunicationId,
      );
      return old?.interpretation ? null : old;
    }
    const duplicate = await ctx.db
      .query("communications")
      .withIndex("by_providerEmailId", (q) =>
        q.eq("providerEmailId", email.providerEmailId),
      )
      .unique();
    if (duplicate) {
      await ctx.db.patch("externalEvents", eventId, {
        status: "DUPLICATE",
        processedAt: Date.now(),
      });
      return null;
    }
    const candidates = new Map<Id<"communications">, Doc<"communications">>();
    // Recipient addresses come from the provider's envelope received_for + To.
    for (const to of email.to) {
      const address = mailbox(to);
      if (!address) continue;
      const c = await ctx.db
        .query("communications")
        .withIndex("by_replyTo", (q) => q.eq("replyTo", address))
        .unique();
      if (c) candidates.set(c._id, c);
    }
    const recipientIds = new Set(candidates.keys());
    const suppliedTokens = email.to
      .map(mailbox)
      .filter(
        (address): address is string =>
          !!address && /^reply-[a-f0-9]{48}@/.test(address),
      );
    const unknownToken = suppliedTokens.some(
      (address) => ![...candidates.values()].some((c) => c.replyTo === address),
    );
    for (const id of [
      ...email.references,
      ...(email.inReplyTo ? [email.inReplyTo] : []),
    ]) {
      const matches = await ctx.db
        .query("communications")
        .withIndex("by_messageId", (q) => q.eq("messageId", id))
        .take(3);
      for (const match of matches) {
        const c =
          match.direction === "OUTBOUND"
            ? match
            : match.parentOutboundId
              ? await ctx.db.get("communications", match.parentOutboundId)
              : null;
        if (c) candidates.set(c._id, c);
      }
    }
    const outbound = candidates.size === 1 ? [...candidates.values()][0] : null;
    const vendor = outbound
      ? await ctx.db.get("vendors", outbound.vendorId)
      : null;
    const graph = outbound
      ? await ctx.db.get("remediationGraphs", outbound.graphId)
      : null;
    // No subject matching. Conflicting token/thread identifiers and extra unknown
    // senders fail closed. Sender headers alone are not cryptographic identity.
    const valid =
      outbound &&
      outbound.direction === "OUTBOUND" &&
      outbound.status === "SENT" &&
      vendor &&
      vendor.email === mailbox(email.from) &&
      vendor.ownerId === outbound.ownerId &&
      graph &&
      graph.createdBy === outbound.ownerId &&
      graph.vendorId === vendor._id &&
      graph.findingId === outbound.findingId &&
      !email.authenticationFailed;
    const tokenConflict =
      recipientIds.size > 0 && (!outbound || !recipientIds.has(outbound._id));
    if (!valid || tokenConflict || unknownToken) {
      await ctx.db.patch("externalEvents", eventId, {
        status: "UNMATCHED",
        processedAt: Date.now(),
        error:
          "No single safe conversation match, unexpected sender, or failed sender authentication.",
      });
      return null;
    }
    // If the reply supplies a parent Message-ID, do not silently disregard a
    // conflicting/unknown parent once the outbound Message-ID is known.
    if (
      email.inReplyTo &&
      outbound.messageId &&
      email.inReplyTo !== outbound.messageId
    ) {
      const parents = await ctx.db
        .query("communications")
        .withIndex("by_messageId", (q) => q.eq("messageId", email.inReplyTo))
        .take(3);
      if (!parents.some((p) => p.parentOutboundId === outbound._id)) {
        await ctx.db.patch("externalEvents", eventId, {
          status: "UNMATCHED",
          processedAt: Date.now(),
          error: "Reply parent conflicts with the known conversation.",
        });
        return null;
      }
    }
    const messages = await ctx.db
      .query("communications")
      .withIndex("by_graphId", (q) => q.eq("graphId", graph._id))
      .take(MAX_MESSAGES);
    if (messages.length >= MAX_MESSAGES) {
      await ctx.db.patch("externalEvents", eventId, {
        status: "UNMATCHED",
        processedAt: Date.now(),
        error: "Conversation capacity reached; operator review required.",
      });
      return null;
    }
    const now = Date.now();
    const supported = !!email.textBody.trim();
    const content = {
      providerEmailId: email.providerEmailId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      textBody: email.textBody,
      messageId: email.messageId,
      inReplyTo: email.inReplyTo,
      references: email.references,
      attachments: email.attachments,
    };
    const id = await ctx.db.insert("communications", {
      ...content,
      ownerId: outbound.ownerId,
      graphId: graph._id,
      inspectionId: outbound.inspectionId,
      findingId: outbound.findingId,
      nodeId: outbound.nodeId,
      vendorId: vendor._id,
      parentOutboundId: outbound._id,
      direction: "INBOUND",
      channel: "EMAIL",
      provider: "RESEND",
      status: supported ? "RECEIVED" : "NEEDS_REVIEW",
      ...(supported
        ? {}
        : {
            policyNote:
              "Plain-text reply missing or oversized; review in Resend. No automatic transition.",
          }),
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("externalEvents", eventId, {
      correlatedGraphId: graph._id,
      correlatedCommunicationId: id,
      ...(supported ? {} : { status: "PROCESSED", processedAt: now }),
    });
    await audit(ctx, graph._id, "communication.received", {
      communicationId: id,
    });
    return supported ? await ctx.db.get("communications", id) : null;
  },
});
export const apply = internalMutation({
  args: {
    ...eventArgs,
    result: interpretation,
    model: v.string(),
    version: v.string(),
    usage: v.optional(usage),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("externalEvents", args.eventId);
    if (
      !event ||
      event.status !== "PROCESSING" ||
      event.attempt !== args.attempt ||
      !event.correlatedCommunicationId
    )
      return null;
    const c = await ctx.db.get(
      "communications",
      event.correlatedCommunicationId,
    );
    if (!c || c.interpretation) return null;
    const result = Interpretation.parse(args.result);
    const graph = await ctx.db.get("remediationGraphs", c.graphId);
    let note =
      "Graph is no longer waiting for this vendor; human review required.";
    let applied = false;
    await audit(ctx, c.graphId, "communication.interpreted", {
      communicationId: c._id,
    });
    if (
      graph?.status === "ACTIVE" &&
      graph.vendorId === c.vendorId &&
      graph.createdBy === c.ownerId &&
      graph.findingId === c.findingId
    ) {
      const decision = quoteDecision(
        result,
        c.textBody,
        graph.quoteCurrency ?? "",
      );
      note = decision.reason;
      if (result.intent === "DECLINE")
        await audit(ctx, c.graphId, "vendor.declined", {
          communicationId: c._id,
        });
      if (result.completionClaim || result.intent === "COMPLETION_CLAIM")
        await audit(ctx, c.graphId, "completion.reported", {
          communicationId: c._id,
        });
      if (
        decision.amount !== undefined &&
        decision.currency &&
        decision.evidence
      ) {
        const { nodes } = await loadGraph(ctx, graph._id);
        const response = nodes.find((n) => n.coordinationRole === "RESPONSE");
        const quoteNode = nodes.find((n) => n.coordinationRole === "QUOTE");
        const approval = nodes.find((n) => n.coordinationRole === "APPROVAL");
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_graphId", (q) => q.eq("graphId", graph._id))
          .take(101);
        const canReceive =
          response &&
          quoteNode &&
          approval &&
          ["READY", "COMPLETED"].includes(response.status) &&
          ["BLOCKED", "READY", "COMPLETED"].includes(quoteNode.status) &&
          ["BLOCKED", "READY"].includes(approval.status) &&
          quotes.length < 100 &&
          !quotes.some((q) => q.status !== "REJECTED");
        if (canReceive) {
          if (response.status === "READY")
            await completeNode(ctx, response, { type: "EXTERNAL" });
          const refreshed = await ctx.db.get("graphNodes", quoteNode._id);
          if (refreshed?.status === "READY")
            await completeNode(ctx, refreshed, { type: "EXTERNAL" });
          else if (refreshed?.status !== "COMPLETED")
            throw new ConvexError("Quote dependencies are not executable.");
          const quoteId = await ctx.db.insert("quotes", {
            ownerId: c.ownerId,
            graphId: c.graphId,
            findingId: c.findingId,
            vendorId: c.vendorId,
            communicationId: c._id,
            amount: decision.amount,
            currency: decision.currency,
            evidence: decision.evidence,
            availability: result.availability.text,
            status: "RECEIVED",
            createdAt: Date.now(),
          });
          await audit(ctx, c.graphId, "quote.received", {
            communicationId: c._id,
            quoteId,
          });
          await audit(ctx, c.graphId, "approval.requested", {
            communicationId: c._id,
            quoteId,
            nodeId: approval._id,
          });
          applied = true;
        } else
          note =
            "A quote is already pending/approved or the graph is not waiting for a quote. Review this additional reply.";
      }
    }
    await ctx.db.patch("communications", c._id, {
      interpretation: result,
      model: args.model,
      interpretationVersion: args.version,
      usage: args.usage,
      status: applied ? "INTERPRETED" : "NEEDS_REVIEW",
      policyNote: note,
      error: undefined,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("externalEvents", event._id, {
      status: "PROCESSED",
      processedAt: Date.now(),
      error: undefined,
    });
    return null;
  },
});
export const fail = internalMutation({
  args: { ...eventArgs, error: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("externalEvents", args.eventId);
    if (event?.status !== "PROCESSING" || event.attempt !== args.attempt)
      return null;
    await ctx.db.patch("externalEvents", event._id, {
      status: "FAILED",
      error: args.error,
    });
    if (event.correlatedCommunicationId)
      await ctx.db.patch("communications", event.correlatedCommunicationId, {
        status: "NEEDS_REVIEW",
        error: args.error,
      });
    return null;
  },
});
export const retry = mutation({
  args: { eventId: v.id("externalEvents") },
  returns: v.null(),
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get("externalEvents", eventId);
    if (!event?.correlatedGraphId) throw new ConvexError("Reply not found.");
    await requireGraph(ctx, event.correlatedGraphId);
    if (event.status !== "FAILED" || event.attempt >= 3)
      throw new ConvexError(
        "Reply is not retryable; operator review required.",
      );
    await ctx.db.patch("externalEvents", eventId, {
      status: "PENDING",
      error: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.coordination.transport.receive, {
      eventId,
    });
    return null;
  },
});
