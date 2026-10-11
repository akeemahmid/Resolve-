import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { requireGraph } from "./access";
import { completeNode } from "./engine";

export const completeHuman = mutation({
  args: { nodeId: v.id("graphNodes") },
  returns: v.null(),
  handler: async (ctx, { nodeId }) => {
    const node = await ctx.db.get("graphNodes", nodeId);
    if (!node) throw new ConvexError("Remediation not found.");
    const { userId } = await requireGraph(ctx, node.graphId);
    return await completeNode(ctx, node, { type: "USER", id: userId });
  },
});

export const simulateDemo = mutation({
  args: { nodeId: v.id("graphNodes") },
  returns: v.null(),
  handler: async (ctx, { nodeId }) => {
    const node = await ctx.db.get("graphNodes", nodeId);
    if (!node) throw new ConvexError("Remediation not found.");
    const { graph, userId } = await requireGraph(ctx, node.graphId);
    if (!graph.isDemo)
      throw new ConvexError("Simulation is only available for demo graphs.");
    return await completeNode(ctx, node, {
      type: node.executionPolicy === "EXTERNAL" ? "EXTERNAL" : "SYSTEM",
      simulation: true,
      initiatedBy: userId,
    });
  },
});

// Trusted future system callers use the same policy checks as every other path.
export const completeSystem = internalMutation({
  args: { nodeId: v.id("graphNodes") },
  returns: v.null(),
  handler: async (ctx, { nodeId }) => {
    const node = await ctx.db.get("graphNodes", nodeId);
    if (!node) throw new ConvexError("Node not found.");
    return await completeNode(ctx, node, { type: "SYSTEM" });
  },
});
