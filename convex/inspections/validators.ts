import { v } from "convex/values";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_FINDINGS = 40;
export const severity = v.union(
  v.literal("LOW"),
  v.literal("MEDIUM"),
  v.literal("HIGH"),
  v.literal("CRITICAL"),
  v.literal("UNKNOWN"),
);
export const confidence = v.union(
  v.literal("HIGH"),
  v.literal("MEDIUM"),
  v.literal("LOW"),
);
const nullableText = v.union(v.string(), v.null());
export const editable = v.object({
  title: v.string(),
  description: v.string(),
  category: nullableText,
  severity,
  location: nullableText,
  requirement: nullableText,
  recommendedAction: nullableText,
});
export const proposal = editable.extend({
  confidence,
  source: v.object({
    page: v.union(v.number(), v.null()),
    section: nullableText,
    excerpt: v.string(),
  }),
});
export const extraction = v.object({
  document: v.object({
    inspectionType: nullableText,
    siteName: nullableText,
    inspectionDate: nullableText,
    summary: nullableText,
  }),
  findings: v.array(proposal),
});
export const reviewStatus = v.union(
  v.literal("PROPOSED"),
  v.literal("CONFIRMED"),
  v.literal("REJECTED"),
);
export const inspectionStatus = v.union(
  v.literal("UPLOADED"),
  v.literal("ANALYZING"),
  v.literal("REVIEW_REQUIRED"),
  v.literal("CONFIRMED"),
  v.literal("FAILED"),
);
export const runArgs = { inspectionId: v.id("inspections"), run: v.number() };
export const usage = v.object({
  inputTokens: v.number(),
  outputTokens: v.number(),
});
