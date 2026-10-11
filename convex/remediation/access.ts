import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId || !(await ctx.db.get("users", userId))) {
    throw new ConvexError("Sign in to access your remediations.");
  }
  return userId;
}

export async function requireGraph(
  ctx: QueryCtx,
  graphId: Id<"remediationGraphs">,
) {
  const userId = await requireUser(ctx);
  const graph = await ctx.db.get("remediationGraphs", graphId);
  if (!graph || graph.createdBy !== userId) {
    throw new ConvexError("Remediation not found.");
  }
  return { graph, userId };
}
