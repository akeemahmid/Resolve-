import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  assertCanComplete,
  assertTransition,
  getExecutableNodes,
  hasVerifiedResolution,
  type Actor,
} from "./transitions";

export const MAX_GRAPHS = 100;
const MAX_NODES = 100;
const MAX_EDGES = 300;
type EventType =
  | "graph.created"
  | "node.created"
  | "node.ready"
  | "node.blocked"
  | "node.completed"
  | "dependency.unblocked"
  | "graph.resolved";

export async function appendEvent(
  ctx: MutationCtx,
  graphId: Id<"remediationGraphs">,
  type: EventType,
  actor: Actor,
  nodeId?: Id<"graphNodes">,
  metadata?: Record<string, string | boolean>,
) {
  await ctx.db.insert("workflowEvents", {
    graphId,
    nodeId,
    type,
    actorType: actor.type,
    actorId: actor.type === "USER" ? actor.id : undefined,
    metadata: {
      ...metadata,
      ...(actor.type !== "USER" && actor.simulation
        ? { simulation: true, initiatedBy: actor.initiatedBy }
        : {}),
    },
    createdAt: Date.now(),
  });
}

export async function loadGraph(
  ctx: QueryCtx,
  graphId: Id<"remediationGraphs">,
) {
  const nodes = await ctx.db
    .query("graphNodes")
    .withIndex("by_graphId", (q) => q.eq("graphId", graphId))
    .take(MAX_NODES + 1);
  const edges = await ctx.db
    .query("graphEdges")
    .withIndex("by_graphId", (q) => q.eq("graphId", graphId))
    .take(MAX_EDGES + 1);
  // Never silently truncate the dependency set: that could unlock unsafe work.
  if (nodes.length > MAX_NODES || edges.length > MAX_EDGES)
    throw new ConvexError("Graph exceeds Phase 1 capacity.");
  const ids = new Set(nodes.map((node) => node._id));
  if (
    edges.some((edge) => !ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId))
  ) {
    throw new ConvexError("Invalid dependency graph.");
  }
  return { nodes, edges };
}

export async function refreshReadiness(
  ctx: MutationCtx,
  graphId: Id<"remediationGraphs">,
) {
  const { nodes, edges } = await loadGraph(ctx, graphId);
  const executable = new Set(
    getExecutableNodes(nodes, edges).map((node) => node._id),
  );
  for (const node of nodes) {
    if (node.status !== "BLOCKED" && node.status !== "READY") continue;
    const status = executable.has(node._id) ? "READY" : "BLOCKED";
    if (status === node.status) continue;
    assertTransition(node.status, status);
    await ctx.db.patch("graphNodes", node._id, { status });
    await appendEvent(
      ctx,
      graphId,
      status === "READY" ? "node.ready" : "node.blocked",
      { type: "SYSTEM" },
      node._id,
    );
    if (
      status === "READY" &&
      edges.some((edge) => edge.toNodeId === node._id)
    ) {
      await appendEvent(
        ctx,
        graphId,
        "dependency.unblocked",
        { type: "SYSTEM" },
        node._id,
      );
    }
    node.status = status;
  }
  return { nodes, edges };
}

export async function completeNode(
  ctx: MutationCtx,
  node: Doc<"graphNodes">,
  actor: Actor,
) {
  const graph = await ctx.db.get("remediationGraphs", node.graphId);
  if (!graph || graph.status !== "ACTIVE")
    throw new ConvexError("Remediation is not active.");
  if (actor.type === "USER" && actor.id !== graph.createdBy)
    throw new ConvexError("Remediation not found.");
  if (node.coordinationRole === "APPROVAL") {
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_graphId", (q) => q.eq("graphId", graph._id))
      .take(101);
    if (
      quotes.length > 100 ||
      actor.type !== "USER" ||
      !quotes.some(
        (quote) =>
          quote.status === "APPROVED" &&
          quote.decidedBy === actor.id &&
          quote.vendorId === graph.vendorId,
      )
    )
      throw new ConvexError("Explicit human quote approval is required.");
  }
  const { nodes, edges } = await loadGraph(ctx, graph._id);
  assertCanComplete(node, actor, nodes, edges);
  const now = Date.now();
  await ctx.db.patch("graphNodes", node._id, {
    status: "COMPLETED",
    startedAt: node.startedAt ?? now,
    completedAt: now,
  });
  await appendEvent(ctx, graph._id, "node.completed", actor, node._id);
  const refreshed = await refreshReadiness(ctx, graph._id);
  const resolved = hasVerifiedResolution(refreshed.nodes, refreshed.edges);
  await ctx.db.patch("remediationGraphs", graph._id, {
    updatedAt: now,
    ...(resolved ? { status: "RESOLVED" as const } : {}),
  });
  if (resolved) await appendEvent(ctx, graph._id, "graph.resolved", actor);
  return null;
}
