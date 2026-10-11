import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

export type Actor =
  | { type: "USER"; id: Id<"users"> }
  | ({
      type: "SYSTEM" | "EXTERNAL";
    } & (
      { simulation: true; initiatedBy: Id<"users"> } | { simulation?: false }
    ));
type Node = Doc<"graphNodes">;

export function dependenciesCompleted(
  node: Node,
  nodes: Node[],
  edges: Doc<"graphEdges">[],
) {
  const byId = new Map(nodes.map((item) => [item._id, item]));
  return edges
    .filter((edge) => edge.toNodeId === node._id)
    .every((edge) => byId.get(edge.fromNodeId)?.status === "COMPLETED");
}

export function getExecutableNodes(nodes: Node[], edges: Doc<"graphEdges">[]) {
  return nodes.filter(
    (node) =>
      (node.status === "BLOCKED" || node.status === "READY") &&
      dependenciesCompleted(node, nodes, edges),
  );
}

export function assertTransition(from: Node["status"], to: Node["status"]) {
  // Phase 1 deliberately exposes no start/retry/cancel/approval shortcuts.
  const allowed =
    (from === "BLOCKED" && to === "READY") ||
    (from === "READY" && (to === "BLOCKED" || to === "COMPLETED"));
  if (!allowed) throw new ConvexError(`Invalid transition: ${from} → ${to}.`);
}

export function assertCanComplete(
  node: Node,
  actor: Actor,
  nodes: Node[],
  edges: Doc<"graphEdges">[],
) {
  if (
    (node.type === "HUMAN_DECISION" || node.type === "VERIFICATION") &&
    (node.executionPolicy !== "HUMAN" || actor.type !== "USER")
  ) {
    throw new ConvexError(
      "Human approval and verification require a human action.",
    );
  }
  const permitted =
    (node.executionPolicy === "HUMAN" && actor.type === "USER") ||
    (node.executionPolicy === "SYSTEM" && actor.type === "SYSTEM") ||
    (node.executionPolicy === "EXTERNAL" && actor.type === "EXTERNAL");
  // SYSTEM_WITH_APPROVAL stays closed until durable approval semantics exist.
  if (!permitted)
    throw new ConvexError(
      `Execution policy ${node.executionPolicy} does not permit ${actor.type} completion.`,
    );
  assertTransition(node.status, "COMPLETED");
  if (!dependenciesCompleted(node, nodes, edges)) {
    throw new ConvexError("Required dependencies are incomplete.");
  }
}

export function hasVerifiedResolution(
  nodes: Node[],
  edges: Doc<"graphEdges">[],
) {
  const terminals = nodes.filter(
    (node) => !edges.some((edge) => edge.fromNodeId === node._id),
  );
  return (
    nodes.length > 0 &&
    nodes.every((node) => node.status === "COMPLETED") &&
    terminals.length > 0 &&
    terminals.every(
      (node) =>
        node.executionPolicy === "HUMAN" &&
        (node.type === "VERIFICATION" || node.type === "MILESTONE"),
    )
  );
}
