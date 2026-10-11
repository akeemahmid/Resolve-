import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireUser } from "../remediation/access";

export async function requireInspection(
  ctx: QueryCtx,
  inspectionId: Id<"inspections">,
) {
  const userId = await requireUser(ctx);
  const inspection = await ctx.db.get("inspections", inspectionId);
  if (!inspection || inspection.ownerId !== userId)
    throw new ConvexError("Inspection not found.");
  return { inspection, userId };
}
export async function requireFinding(ctx: QueryCtx, findingId: Id<"findings">) {
  const userId = await requireUser(ctx);
  const finding = await ctx.db.get("findings", findingId);
  if (!finding || finding.ownerId !== userId)
    throw new ConvexError("Finding not found.");
  await requireInspection(ctx, finding.inspectionId);
  return { finding, userId };
}
export async function event(
  ctx: MutationCtx,
  inspectionId: Id<"inspections">,
  type: string,
  extra: {
    actorId?: Id<"users">;
    findingId?: Id<"findings">;
    run?: number;
  } = {},
) {
  await ctx.db.insert("inspectionEvents", {
    inspectionId,
    type,
    ...extra,
    createdAt: Date.now(),
  });
}
