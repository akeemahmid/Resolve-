import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { editable } from "./validators";
import { EditableFinding } from "./contract";
import { event, requireFinding, requireInspection } from "./access";
import {
  appendEvent,
  MAX_GRAPHS,
  refreshReadiness,
} from "../remediation/engine";

export const review = mutation({
  args: {
    findingId: v.id("findings"),
    decision: v.union(v.literal("CONFIRMED"), v.literal("REJECTED")),
  },
  returns: v.null(),
  handler: async (ctx, { findingId, decision }) => {
    const { finding, userId } = await requireFinding(ctx, findingId);
    if (finding.reviewStatus === decision) return null;
    if (finding.reviewStatus !== "PROPOSED")
      throw new ConvexError("This finding has already been reviewed.");
    await ctx.db.patch("findings", findingId, {
      reviewStatus: decision,
      reviewedBy: userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await event(
      ctx,
      finding.inspectionId,
      decision === "CONFIRMED" ? "finding.confirmed" : "finding.rejected",
      { actorId: userId, findingId },
    );
    return null;
  },
});
export const edit = mutation({
  args: {
    findingId: v.id("findings"),
    fields: editable,
    expectedUpdatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { findingId, fields, expectedUpdatedAt }) => {
    const { finding, userId } = await requireFinding(ctx, findingId);
    if (finding.reviewStatus !== "PROPOSED")
      throw new ConvexError("Only proposals can be edited.");
    if (finding.updatedAt !== expectedUpdatedAt)
      throw new ConvexError(
        "This proposal changed in another tab. Reload your edit.",
      );
    const parsed = EditableFinding.safeParse(fields);
    if (!parsed.success || !fields.title.trim() || !fields.description.trim())
      throw new ConvexError("Check the finding fields and their lengths.");
    const before = EditableFinding.parse(
      Object.fromEntries(
        Object.keys(fields).map((key) => [
          key,
          finding[key as keyof typeof fields],
        ]),
      ),
    );
    await ctx.db.patch("findings", findingId, {
      ...parsed.data,
      editedBy: userId,
      editedAt: Date.now(),
      updatedAt: Math.max(Date.now(), finding.updatedAt + 1),
    });
    await ctx.db.insert("inspectionEvents", {
      inspectionId: finding.inspectionId,
      findingId,
      type: "finding.edited",
      actorId: userId,
      before,
      after: parsed.data,
      createdAt: Date.now(),
    });
    return null;
  },
});

async function createGraph(
  ctx: MutationCtx,
  finding: Doc<"findings">,
  userId: Id<"users">,
) {
  if (finding.ownerId !== userId || finding.reviewStatus !== "CONFIRMED")
    throw new ConvexError(
      "Only a confirmed finding can create a remediation workflow.",
    );
  if (finding.graphId) return finding.graphId;
  const existing = await ctx.db
    .query("remediationGraphs")
    .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
    .take(MAX_GRAPHS);
  if (existing.length >= MAX_GRAPHS)
    throw new ConvexError(
      "This workspace supports up to 100 remediation graphs.",
    );
  const now = Date.now();
  const graphId = await ctx.db.insert("remediationGraphs", {
    title: finding.title,
    inspectionId: finding.inspectionId,
    findingId: finding._id,
    isDemo: false,
    status: "ACTIVE",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  await appendEvent(ctx, graphId, "graph.created", {
    type: "USER",
    id: userId,
  });
  const definitions = [
    {
      title: "Review remediation requirement",
      type: "HUMAN_DECISION",
      description:
        "Review the confirmed finding, source evidence and corrective requirement before coordinating work.",
    },
    {
      title: "Coordinate corrective action",
      type: "ACTION",
      description:
        "Arrange corrective work outside Resolve and attest that the work has been performed. No vendor is contacted automatically.",
    },
    {
      title: "Collect completion evidence",
      type: "EVIDENCE",
      description:
        "Review and retain completion evidence outside Resolve, then attest it is available for verification. This phase does not upload repair evidence.",
    },
    {
      title: "Verify remediation",
      type: "VERIFICATION",
      description:
        "Personally verify the corrective work and evidence before resolving this finding. This does not certify regulatory compliance.",
    },
  ] as const;
  let previous: Id<"graphNodes"> | undefined;
  for (const definition of definitions) {
    const nodeId: Id<"graphNodes"> = await ctx.db.insert("graphNodes", {
      ...definition,
      graphId,
      executionPolicy: "HUMAN",
      status: "BLOCKED",
      createdAt: now,
    });
    await appendEvent(ctx, graphId, "node.created", { type: "SYSTEM" }, nodeId);
    if (previous)
      await ctx.db.insert("graphEdges", {
        graphId,
        fromNodeId: previous,
        toNodeId: nodeId,
        type: "REQUIRES",
        createdAt: now,
      });
    previous = nodeId;
  }
  await refreshReadiness(ctx, graphId);
  await ctx.db.patch("findings", finding._id, { graphId, updatedAt: now });
  await event(ctx, finding.inspectionId, "finding.workflow_created", {
    actorId: userId,
    findingId: finding._id,
  });
  return graphId;
}
export const createWorkflow = mutation({
  args: { findingId: v.id("findings") },
  returns: v.id("remediationGraphs"),
  handler: async (ctx, { findingId }) => {
    const { finding, userId } = await requireFinding(ctx, findingId);
    return await createGraph(ctx, finding, userId);
  },
});
export const createWorkflows = mutation({
  args: { inspectionId: v.id("inspections") },
  returns: v.array(v.id("remediationGraphs")),
  handler: async (ctx, { inspectionId }) => {
    const { inspection, userId } = await requireInspection(ctx, inspectionId);
    if (inspection.status !== "CONFIRMED")
      throw new ConvexError("Complete the inspection review first.");
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_inspectionId", (q) => q.eq("inspectionId", inspectionId))
      .take(41);
    if (findings.some((f) => f.reviewStatus === "PROPOSED"))
      throw new ConvexError("Review every proposal first.");
    const ids: Id<"remediationGraphs">[] = [];
    for (const finding of findings)
      if (finding.reviewStatus === "CONFIRMED")
        ids.push(await createGraph(ctx, finding, userId));
    return ids;
  },
});
