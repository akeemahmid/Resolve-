import { ConvexError, v } from "convex/values";
import { mutation, query, env } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { requireGraph, requireUser } from "../remediation/access";
import {
  completeNode,
  loadGraph,
  refreshReadiness,
} from "../remediation/engine";
import { mailbox, MAX_MESSAGES } from "./validators";

export async function audit(
  ctx: MutationCtx,
  graphId: Id<"remediationGraphs">,
  type: string,
  extra: {
    actorId?: Id<"users">;
    communicationId?: Id<"communications">;
    quoteId?: Id<"quotes">;
    nodeId?: Id<"graphNodes">;
  } = {},
) {
  await ctx.db.insert("workflowEvents", {
    graphId,
    nodeId: extra.nodeId,
    type,
    actorType: extra.actorId ? "USER" : "SYSTEM",
    actorId: extra.actorId,
    metadata: {
      communicationId: extra.communicationId,
      quoteId: extra.quoteId,
    },
    createdAt: Date.now(),
  });
}
export function missingConfiguration() {
  return [
    !env.RESEND_API_KEY && "RESEND_API_KEY",
    !env.RESEND_WEBHOOK_SECRET && "RESEND_WEBHOOK_SECRET",
    !env.RESEND_FROM_EMAIL && "RESEND_FROM_EMAIL",
    !env.RESEND_INBOUND_DOMAIN && "RESEND_INBOUND_DOMAIN",
  ].filter((x): x is string => !!x);
}
export const saveVendor = mutation({
  args: { name: v.string(), email: v.string() },
  returns: v.id("vendors"),
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const email = mailbox(args.email);
    if (
      !email ||
      args.email.includes("<") ||
      !args.name.trim() ||
      args.name.trim().length > 100 ||
      /[\r\n]/.test(args.name)
    )
      throw new ConvexError("Enter a vendor name and valid email address.");
    const existing = await ctx.db
      .query("vendors")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(101);
    const same = existing.find((x) => x.email === email);
    if (same) return same._id;
    if (existing.length >= 100)
      throw new ConvexError("This workspace supports 100 vendor contacts.");
    return await ctx.db.insert("vendors", {
      ownerId,
      name: args.name.trim(),
      email,
      createdAt: Date.now(),
    });
  },
});
export const workspace = query({
  args: { graphId: v.id("remediationGraphs") },
  returns: v.object({
    vendors: v.array(schema.doc("vendors")),
    communications: v.array(schema.doc("communications")),
    quotes: v.array(schema.doc("quotes")),
    events: v.array(schema.doc("externalEvents")),
    missingConfiguration: v.array(v.string()),
  }),
  handler: async (ctx, { graphId }) => {
    const { userId } = await requireGraph(ctx, graphId);
    return {
      vendors: await ctx.db
        .query("vendors")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
        .take(100),
      communications: await ctx.db
        .query("communications")
        .withIndex("by_graphId", (q) => q.eq("graphId", graphId))
        .order("desc")
        .take(MAX_MESSAGES),
      quotes: await ctx.db
        .query("quotes")
        .withIndex("by_graphId", (q) => q.eq("graphId", graphId))
        .order("desc")
        .take(MAX_MESSAGES),
      events: await ctx.db
        .query("externalEvents")
        .withIndex("by_correlatedGraphId", (q) =>
          q.eq("correlatedGraphId", graphId),
        )
        .order("desc")
        .take(MAX_MESSAGES),
      missingConfiguration: missingConfiguration(),
    };
  },
});
export const enable = mutation({
  args: {
    graphId: v.id("remediationGraphs"),
    vendorId: v.id("vendors"),
    currency: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { graphId, vendorId, currency }) => {
    const { graph, userId } = await requireGraph(ctx, graphId);
    const vendor = await ctx.db.get("vendors", vendorId);
    if (!vendor || vendor.ownerId !== userId)
      throw new ConvexError("Vendor not found.");
    if (!["USD", "GBP", "EUR", "NGN", "CAD", "AUD"].includes(currency))
      throw new ConvexError("Choose a supported quote currency.");
    if (graph.coordinationEnabled)
      throw new ConvexError("Vendor coordination is already configured.");
    const finding = graph.findingId
      ? await ctx.db.get("findings", graph.findingId)
      : null;
    if (
      graph.status !== "ACTIVE" ||
      graph.isDemo ||
      !graph.inspectionId ||
      !finding ||
      finding.ownerId !== userId ||
      finding.reviewStatus !== "CONFIRMED" ||
      finding.graphId !== graphId
    )
      throw new ConvexError("Use an active inspection-derived graph.");
    const { nodes, edges } = await loadGraph(ctx, graphId);
    if (
      nodes.length !== 4 ||
      edges.length !== 3 ||
      nodes.some(
        (n) =>
          !["READY", "BLOCKED"].includes(n.status) ||
          n.executionPolicy !== "HUMAN",
      )
    )
      throw new ConvexError(
        "Enable coordination before starting this remediation.",
      );
    const review = nodes.find((n) => n.type === "HUMAN_DECISION");
    const repair = nodes.find((n) => n.type === "ACTION");
    const edge = edges.find(
      (e) => e.fromNodeId === review?._id && e.toNodeId === repair?._id,
    );
    if (!review || !repair || !edge)
      throw new ConvexError("Unsupported remediation template.");
    await ctx.db.delete("graphEdges", edge._id);
    let previous = review._id;
    const now = Date.now();
    for (const definition of [
      {
        coordinationRole: "CONTACT",
        title: "Contact contractor",
        type: "EXTERNAL_ACTION",
        executionPolicy: "EXTERNAL",
        description:
          "Send the reviewed request through Resend. Acceptance by the email service is not a vendor response.",
      },
      {
        coordinationRole: "RESPONSE",
        title: "Wait for vendor response",
        type: "WAIT",
        executionPolicy: "EXTERNAL",
        description:
          "Await a safely correlated vendor quote. Ambiguous replies require human follow-up.",
      },
      {
        coordinationRole: "QUOTE",
        title: "Receive quote",
        type: "WAIT",
        executionPolicy: "EXTERNAL",
        description:
          "A validated quote can satisfy this dependency; it cannot approve spending.",
      },
      {
        coordinationRole: "APPROVAL",
        title: "Approve quote",
        type: "HUMAN_DECISION",
        executionPolicy: "HUMAN",
        description:
          "Review the quoted amount and source reply. Only you can approve it.",
      },
    ] as const) {
      const nodeId = await ctx.db.insert("graphNodes", {
        ...definition,
        graphId,
        status: "BLOCKED",
        createdAt: now,
      });
      await ctx.db.insert("graphEdges", {
        graphId,
        fromNodeId: previous,
        toNodeId: nodeId,
        type: "REQUIRES",
        createdAt: now,
      });
      await audit(ctx, graphId, "node.created", { nodeId });
      previous = nodeId;
    }
    await ctx.db.insert("graphEdges", {
      graphId,
      fromNodeId: previous,
      toNodeId: repair._id,
      type: "REQUIRES",
      createdAt: now,
    });
    await ctx.db.patch("graphNodes", repair._id, {
      title: "Coordinate repair",
      description:
        "After approving the quote, coordinate the work with the vendor and confirm completion yourself. Approval does not send a purchase order or payment.",
    });
    await ctx.db.patch("remediationGraphs", graphId, {
      coordinationEnabled: true,
      vendorId,
      quoteCurrency: currency,
      updatedAt: now,
    });
    await audit(ctx, graphId, "vendor.assigned", { actorId: userId });
    await refreshReadiness(ctx, graphId);
    return null;
  },
});
export const decideQuote = mutation({
  args: {
    quoteId: v.id("quotes"),
    decision: v.union(v.literal("APPROVED"), v.literal("REJECTED")),
  },
  returns: v.null(),
  handler: async (ctx, { quoteId, decision }) => {
    const quote = await ctx.db.get("quotes", quoteId);
    if (!quote) throw new ConvexError("Quote not found.");
    const { graph, userId } = await requireGraph(ctx, quote.graphId);
    if (
      quote.ownerId !== userId ||
      quote.vendorId !== graph.vendorId ||
      quote.status !== "RECEIVED" ||
      graph.status !== "ACTIVE"
    )
      throw new ConvexError("Quote is not awaiting a decision.");
    const { nodes } = await loadGraph(ctx, graph._id);
    const node = nodes.find((n) => n.coordinationRole === "APPROVAL");
    if (!node || node.status !== "READY" || node.executionPolicy !== "HUMAN")
      throw new ConvexError("Quote approval is not executable.");
    await ctx.db.patch("quotes", quoteId, {
      status: decision,
      decidedBy: userId,
      decidedAt: Date.now(),
    });
    await audit(
      ctx,
      graph._id,
      decision === "APPROVED" ? "approval.approved" : "approval.rejected",
      { actorId: userId, quoteId, nodeId: node._id },
    );
    if (decision === "APPROVED")
      await completeNode(ctx, node, { type: "USER", id: userId });
    return null;
  },
});
