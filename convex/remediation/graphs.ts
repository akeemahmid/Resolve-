import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";
import { requireGraph, requireUser } from "./access";
import { appendEvent, loadGraph, MAX_GRAPHS, refreshReadiness } from "./engine";

const demoNodes = [
  {
    title: "Contact electrical contractor",
    type: "ACTION",
    executionPolicy: "SYSTEM",
    description: "Demo: simulate contacting a contractor. No message is sent.",
  },
  {
    title: "Receive quote",
    type: "WAIT",
    executionPolicy: "EXTERNAL",
    description: "Demo: simulate receipt of a contractor quote.",
  },
  {
    title: "Approve quote",
    type: "HUMAN_DECISION",
    executionPolicy: "HUMAN",
    description:
      "Review and approve this demo quote. No purchase or payment occurs.",
  },
  {
    title: "Perform repair",
    type: "EXTERNAL_ACTION",
    executionPolicy: "EXTERNAL",
    description: "Demo: simulate the contractor completing the repair.",
  },
  {
    title: "Collect completion evidence",
    type: "EVIDENCE",
    executionPolicy: "HUMAN",
    description:
      "Attest that you have reviewed the completion evidence for this demo. File upload is a later phase.",
  },
  {
    title: "Confirm emergency lighting test",
    type: "HUMAN_DECISION",
    executionPolicy: "HUMAN",
    description:
      "Confirm the functional test for this demo. Both evidence and this check are required before verification.",
  },
  {
    title: "Verify repair",
    type: "VERIFICATION",
    executionPolicy: "HUMAN",
    description:
      "Verify the evidence and test result, then explicitly confirm remediation. This demo is not compliance certification.",
  },
] satisfies Pick<
  Doc<"graphNodes">,
  "title" | "type" | "executionPolicy" | "description"
>[];

export const createDemo = mutation({
  args: {},
  returns: v.id("remediationGraphs"),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("remediationGraphs")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .take(MAX_GRAPHS);
    if (existing.length >= MAX_GRAPHS)
      throw new ConvexError("Phase 1 supports up to 100 graphs per user.");
    const now = Date.now();
    const graphId = await ctx.db.insert("remediationGraphs", {
      title: "Emergency Lighting Failure",
      isDemo: true,
      status: "ACTIVE",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    await appendEvent(ctx, graphId, "graph.created", {
      type: "USER",
      id: userId,
    });
    const ids: Id<"graphNodes">[] = [];
    for (const definition of demoNodes) {
      const nodeId = await ctx.db.insert("graphNodes", {
        ...definition,
        graphId,
        status: "BLOCKED",
        createdAt: now,
      });
      ids.push(nodeId);
      await appendEvent(
        ctx,
        graphId,
        "node.created",
        { type: "SYSTEM" },
        nodeId,
      );
    }
    for (const [from, to] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [4, 6],
      [5, 6],
    ]) {
      await ctx.db.insert("graphEdges", {
        graphId,
        fromNodeId: ids[from],
        toNodeId: ids[to],
        type: "REQUIRES",
        createdAt: now,
      });
    }
    await refreshReadiness(ctx, graphId);
    return graphId;
  },
});

export const overview = query({
  args: {},
  returns: v.object({
    graphs: v.array(schema.doc("remediationGraphs")),
    metrics: v.object({
      active: v.number(),
      open: v.number(),
      needsYou: v.number(),
      resolved: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const graphs = await ctx.db
      .query("remediationGraphs")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .order("desc")
      .take(MAX_GRAPHS + 1);
    if (graphs.length > MAX_GRAPHS)
      throw new ConvexError("Graph count exceeds Phase 1 capacity.");
    const metrics = { active: 0, open: 0, needsYou: 0, resolved: 0 };
    for (const graph of graphs) {
      if (graph.status === "RESOLVED") metrics.resolved++;
      if (graph.status !== "ACTIVE") continue;
      metrics.active++;
      const { nodes } = await loadGraph(ctx, graph._id);
      metrics.open += nodes.filter(
        (node) => node.status !== "COMPLETED" && node.status !== "CANCELLED",
      ).length;
      metrics.needsYou += nodes.filter(
        (node) => node.status === "READY" && node.executionPolicy === "HUMAN",
      ).length;
    }
    return { graphs, metrics };
  },
});

export const detail = query({
  args: { graphId: v.id("remediationGraphs") },
  returns: v.object({
    graph: schema.doc("remediationGraphs"),
    nodes: v.array(schema.doc("graphNodes")),
    edges: v.array(schema.doc("graphEdges")),
    events: v.array(schema.doc("workflowEvents")),
  }),
  handler: async (ctx, { graphId }) => {
    const { graph } = await requireGraph(ctx, graphId);
    const { nodes, edges } = await loadGraph(ctx, graphId);
    const events = await ctx.db
      .query("workflowEvents")
      .withIndex("by_graphId_createdAt", (q) => q.eq("graphId", graphId))
      .order("desc")
      .take(100);
    return { graph, nodes, edges, events };
  },
});
