import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import schema from "../schema";
import { requireUser } from "../remediation/access";
import { event, requireInspection } from "./access";
import { extraction, runArgs, usage } from "./validators";
import { validateExtraction, EXTRACTION_VERSION } from "./contract";

export const list = query({
  args: {},
  returns: v.array(schema.doc("inspections")),
  handler: async (ctx) => {
    const ownerId = await requireUser(ctx);
    return await ctx.db
      .query("inspections")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(100);
  },
});
export const detail = query({
  args: { inspectionId: v.id("inspections") },
  returns: v.object({
    inspection: schema.doc("inspections"),
    findings: v.array(schema.doc("findings")),
    events: v.array(schema.doc("inspectionEvents")),
  }),
  handler: async (ctx, { inspectionId }) => {
    const { inspection } = await requireInspection(ctx, inspectionId);
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_inspectionId", (q) => q.eq("inspectionId", inspectionId))
      .take(41);
    const events = await ctx.db
      .query("inspectionEvents")
      .withIndex("by_inspectionId", (q) => q.eq("inspectionId", inspectionId))
      .order("desc")
      .take(100);
    return { inspection, findings, events };
  },
});
export const analyze = mutation({
  args: { inspectionId: v.id("inspections") },
  returns: v.null(),
  handler: async (ctx, { inspectionId }) => {
    const { inspection, userId } = await requireInspection(ctx, inspectionId);
    if (inspection.status === "ANALYZING") return null;
    if (inspection.status !== "UPLOADED" && inspection.status !== "FAILED")
      throw new ConvexError("This inspection has already been analyzed.");
    const run = inspection.run + 1;
    await ctx.db.patch("inspections", inspectionId, {
      status: "ANALYZING",
      run,
      error: undefined,
      processingRun: undefined,
      updatedAt: Date.now(),
    });
    await event(ctx, inspectionId, "inspection.analysis_started", {
      actorId: userId,
      run,
    });
    await ctx.scheduler.runAfter(0, internal.inspections.analyze.run, {
      inspectionId,
      run,
    });
    // Independent watchdog also covers action crashes / deployment interruptions.
    await ctx.scheduler.runAfter(
      5 * 60_000,
      internal.inspections.documents.fail,
      { inspectionId, run, reason: "TIMEOUT" },
    );
    return null;
  },
});
export const claimRun = internalMutation({
  args: { ...runArgs, model: v.string() },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, { inspectionId, run, model }) => {
    const inspection = await ctx.db.get("inspections", inspectionId);
    if (
      !inspection ||
      inspection.status !== "ANALYZING" ||
      inspection.run !== run ||
      inspection.processingRun === run
    )
      return null;
    await ctx.db.patch("inspections", inspectionId, {
      processingRun: run,
      model,
      extractionVersion: EXTRACTION_VERSION,
    });
    return inspection.documentStorageId;
  },
});
export const persist = internalMutation({
  args: { ...runArgs, result: extraction, usage: v.optional(usage) },
  returns: v.null(),
  handler: async (ctx, { inspectionId, run, result, usage }) => {
    const inspection = await ctx.db.get("inspections", inspectionId);
    if (
      !inspection ||
      inspection.status !== "ANALYZING" ||
      inspection.run !== run ||
      inspection.processingRun !== run
    )
      return null;
    const parsed = validateExtraction(result);
    const now = Date.now();
    for (const proposal of parsed.findings) {
      const findingId = await ctx.db.insert("findings", {
        ...proposal,
        inspectionId,
        ownerId: inspection.ownerId,
        run,
        originalProposal: proposal,
        reviewStatus: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
      await event(ctx, inspectionId, "finding.proposed", { findingId, run });
    }
    await ctx.db.patch("inspections", inspectionId, {
      status: "REVIEW_REQUIRED",
      updatedAt: now,
      usage,
      siteName: parsed.document.siteName ?? undefined,
      inspectionType: parsed.document.inspectionType ?? undefined,
      inspectionDate: parsed.document.inspectionDate ?? undefined,
      summary: parsed.document.summary ?? undefined,
    });
    await event(ctx, inspectionId, "inspection.analysis_completed", { run });
    return null;
  },
});
export const fail = internalMutation({
  args: {
    ...runArgs,
    reason: v.union(
      v.literal("TIMEOUT"),
      v.literal("KEY"),
      v.literal("FILE"),
      v.literal("REFUSAL"),
      v.literal("OUTPUT"),
      v.literal("PROVIDER"),
      v.literal("QUOTA"),
      v.literal("RATE"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { inspectionId, run, reason }) => {
    const inspection = await ctx.db.get("inspections", inspectionId);
    if (
      !inspection ||
      inspection.status !== "ANALYZING" ||
      inspection.run !== run
    )
      return null;
    const messages = {
      QUOTA:
        "The analysis service has reached its account usage limit. Ask your workspace operator to check OpenAI billing and credits, then retry.",
      RATE: "The analysis service is temporarily rate limited. Wait a moment, then retry.",
      TIMEOUT: "Analysis timed out. You can safely retry.",
      KEY: "Analysis is not configured. Ask your workspace operator to set the OpenAI API key.",
      FILE: "The stored PDF is missing or invalid. Upload a readable PDF again.",
      REFUSAL:
        "The document could not be analyzed. Try a clearer or smaller inspection report.",
      OUTPUT: "The analysis did not return valid findings. You can retry.",
      PROVIDER:
        "The analysis service is unavailable or could not read this PDF. Retry, or upload a readable PDF.",
    };
    await ctx.db.patch("inspections", inspectionId, {
      status: "FAILED",
      error: messages[reason],
      updatedAt: Date.now(),
    });
    await event(ctx, inspectionId, "inspection.analysis_failed", { run });
    return null;
  },
});
export const finishReview = mutation({
  args: { inspectionId: v.id("inspections") },
  returns: v.null(),
  handler: async (ctx, { inspectionId }) => {
    const { inspection, userId } = await requireInspection(ctx, inspectionId);
    if (inspection.status === "CONFIRMED") return null;
    if (inspection.status !== "REVIEW_REQUIRED")
      throw new ConvexError("Analysis must finish first.");
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_inspectionId", (q) => q.eq("inspectionId", inspectionId))
      .take(41);
    if (findings.some((f) => f.reviewStatus === "PROPOSED"))
      throw new ConvexError("Review every proposal first.");
    await ctx.db.patch("inspections", inspectionId, {
      status: "CONFIRMED",
      updatedAt: Date.now(),
    });
    await event(ctx, inspectionId, "inspection.review_completed", {
      actorId: userId,
    });
    return null;
  },
});
