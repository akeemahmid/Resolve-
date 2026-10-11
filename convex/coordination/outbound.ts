import { ConvexError, v } from "convex/values";
import { internalMutation, env } from "../_generated/server";
import { internal } from "../_generated/api";
import schema from "../schema";
import { requireGraph } from "../remediation/access";
import { assertCanComplete } from "../remediation/transitions";
import { completeNode, loadGraph } from "../remediation/engine";
import { audit, missingConfiguration } from "./domain";
import { reconcileDelivery, deliveryState } from "./delivery";
import { mailbox, SEND_WINDOW } from "./validators";

export const prepare = internalMutation({
  args: {
    graphId: v.id("remediationGraphs"),
    nodeId: v.id("graphNodes"),
    token: v.string(),
  },
  returns: v.id("communications"),
  handler: async (ctx, { graphId, nodeId, token }) => {
    const { graph, userId } = await requireGraph(ctx, graphId);
    const node = await ctx.db.get("graphNodes", nodeId);
    if (
      !node ||
      node.graphId !== graphId ||
      node.coordinationRole !== "CONTACT" ||
      !graph.coordinationEnabled ||
      !graph.vendorId ||
      !graph.findingId ||
      !graph.inspectionId ||
      graph.status !== "ACTIVE"
    )
      throw new ConvexError("Contact is not available for this graph.");
    const vendor = await ctx.db.get("vendors", graph.vendorId);
    const finding = await ctx.db.get("findings", graph.findingId);
    const inspection = await ctx.db.get("inspections", graph.inspectionId);
    if (
      !vendor ||
      vendor.ownerId !== userId ||
      !mailbox(vendor.email) ||
      !finding ||
      finding.ownerId !== userId ||
      finding.reviewStatus !== "CONFIRMED" ||
      !inspection ||
      inspection.ownerId !== userId
    )
      throw new ConvexError("Vendor or confirmed finding not found.");
    const old = await ctx.db
      .query("communications")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", nodeId))
      .take(2);
    const existing = old.find((c) => c.direction === "OUTBOUND");
    if (existing && ["SENT", "SENDING", "QUEUED"].includes(existing.status))
      return existing._id;
    const { nodes, edges } = await loadGraph(ctx, graphId);
    assertCanComplete(node, { type: "EXTERNAL" }, nodes, edges);
    if (missingConfiguration().length)
      throw new ConvexError(
        "Configure Resend sender, receiving domain and webhook before contacting a vendor.",
      );
    const from = env.RESEND_FROM_EMAIL!.trim();
    const domain = env.RESEND_INBOUND_DOMAIN!.trim().toLowerCase();
    if (
      !mailbox(from) ||
      !mailbox(`reply@${domain}`) ||
      !/^\w{48}$/.test(token)
    )
      throw new ConvexError("Invalid email configuration.");
    if (existing) {
      if (
        Date.now() - existing.createdAt >= SEND_WINDOW ||
        existing.attempts >= 3
      )
        throw new ConvexError(
          "Send outcome needs operator review; automatic resend is disabled.",
        );
      await ctx.db.patch("communications", existing._id, {
        status: "QUEUED",
        error: undefined,
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.coordination.transport.send, {
        communicationId: existing._id,
      });
      return existing._id;
    }
    const subject = `Remediation request — ${finding.title.replace(/[\r\n]/g, " ")}`;
    const textBody = `Hello ${vendor.name},\n\nWe are coordinating remediation for an inspection finding at ${inspection.siteName ?? "the inspected site"}.\n\nFinding:\n${finding.title}\n\nDetails:\n${finding.description}\n\nCould you please reply with:\n- whether you can perform the work\n- estimated cost / quote in ${graph.quoteCurrency} (please include the currency code)\n- earliest availability\n- any clarification you need\n\nPlease reply directly to this email. This is a request for a quote, not authorization to start work.\n\nThank you,\nResolve`;
    const now = Date.now();
    const id = await ctx.db.insert("communications", {
      ownerId: userId,
      graphId,
      inspectionId: inspection._id,
      findingId: finding._id,
      nodeId,
      vendorId: vendor._id,
      direction: "OUTBOUND",
      channel: "EMAIL",
      provider: "RESEND",
      from,
      to: [vendor.email],
      subject,
      textBody,
      replyTo: `reply-${token}@${domain}`,
      correlationToken: token,
      references: [],
      attachments: [],
      status: "QUEUED",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    await audit(ctx, graphId, "communication.outbound_requested", {
      actorId: userId,
      communicationId: id,
      nodeId,
    });
    await ctx.scheduler.runAfter(0, internal.coordination.transport.send, {
      communicationId: id,
    });
    return id;
  },
});
export const claim = internalMutation({
  args: { communicationId: v.id("communications") },
  returns: v.union(schema.doc("communications"), v.null()),
  handler: async (ctx, { communicationId }) => {
    const c = await ctx.db.get("communications", communicationId);
    if (!c || c.direction !== "OUTBOUND" || c.status !== "QUEUED") return null;
    const graph = await ctx.db.get("remediationGraphs", c.graphId);
    const node = await ctx.db.get("graphNodes", c.nodeId);
    const vendor = await ctx.db.get("vendors", c.vendorId);
    if (
      !graph ||
      graph.status !== "ACTIVE" ||
      graph.vendorId !== c.vendorId ||
      !node ||
      node.status !== "READY" ||
      node.graphId !== graph._id ||
      !vendor ||
      vendor.ownerId !== c.ownerId ||
      graph.createdBy !== c.ownerId ||
      Date.now() - c.createdAt >= SEND_WINDOW
    ) {
      await ctx.db.patch("communications", c._id, {
        status: "FAILED",
        error: "Contact no longer executable; operator review required.",
      });
      return null;
    }
    const { nodes, edges } = await loadGraph(ctx, graph._id);
    assertCanComplete(node, { type: "EXTERNAL" }, nodes, edges);
    const attempts = c.attempts + 1;
    await ctx.db.patch("communications", c._id, {
      status: "SENDING",
      attempts,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(180_000, internal.coordination.outbound.fail, {
      communicationId,
      attempt: attempts,
      error: "Send timed out; retry uses the same provider idempotency key.",
    });
    return { ...c, status: "SENDING" as const, attempts };
  },
});
export const sent = internalMutation({
  args: {
    communicationId: v.id("communications"),
    providerEmailId: v.string(),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { communicationId, providerEmailId, attempt }) => {
    const c = await ctx.db.get("communications", communicationId);
    if (!c || c.attempts !== attempt || c.status !== "SENDING") return null;
    const graph = await ctx.db.get("remediationGraphs", c.graphId);
    const node = await ctx.db.get("graphNodes", c.nodeId);
    await ctx.db.patch("communications", c._id, {
      status: "SENT",
      providerEmailId,
      error: undefined,
      updatedAt: Date.now(),
    });
    await reconcileDelivery(ctx, providerEmailId);
    await audit(ctx, c.graphId, "communication.sent", {
      communicationId: c._id,
      nodeId: c.nodeId,
    });
    if (
      graph?.status === "ACTIVE" &&
      graph.vendorId === c.vendorId &&
      node?.status === "READY"
    )
      await completeNode(ctx, node, { type: "EXTERNAL" });
    return null;
  },
});
export const metadata = internalMutation({
  args: {
    communicationId: v.id("communications"),
    messageId: v.optional(v.string()),
    deliveryStatus: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const c = await ctx.db.get("communications", args.communicationId);
    if (!c || c.direction !== "OUTBOUND") return null;
    await ctx.db.patch("communications", c._id, {
      ...(args.messageId ? { messageId: args.messageId } : {}),
      deliveryStatus: deliveryState(c.deliveryStatus, args.deliveryStatus),
    });
    return null;
  },
});
export const fail = internalMutation({
  args: {
    communicationId: v.id("communications"),
    attempt: v.number(),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const c = await ctx.db.get("communications", args.communicationId);
    if (c?.status === "SENDING" && c.attempts === args.attempt) {
      await ctx.db.patch("communications", c._id, {
        status: "FAILED",
        error: args.error,
        updatedAt: Date.now(),
      });
      await audit(ctx, c.graphId, "communication.send_failed", {
        communicationId: c._id,
      });
    }
    return null;
  },
});
