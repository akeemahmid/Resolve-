import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  editable,
  proposal,
  inspectionStatus,
  reviewStatus,
  usage,
} from "./inspections/validators";
import { authTables } from "@convex-dev/auth/server";
import { coordinationTables } from "./coordination/tables";
import { role } from "./coordination/validators";

/**
 * Resolve
 *
 * Core principle:
 * remediation is represented as an executable dependency graph,
 * not as a simple task/status list.
 */
export default defineSchema({
  // Required by Convex Auth.
  ...authTables,
  ...coordinationTables,

  inspectionUploads: defineTable({
    ownerId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    claimed: v.boolean(),
    pdfValidated: v.optional(v.boolean()),
    storageId: v.optional(v.id("_storage")),
    inspectionId: v.optional(v.id("inspections")),
  }).index("by_ownerId", ["ownerId"]),
  inspections: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    status: inspectionStatus,
    documentStorageId: v.id("_storage"),
    originalFilename: v.string(),
    contentType: v.literal("application/pdf"),
    fileSize: v.number(),
    siteName: v.optional(v.string()),
    inspectionType: v.optional(v.string()),
    inspectionDate: v.optional(v.string()),
    summary: v.optional(v.string()),
    run: v.number(),
    processingRun: v.optional(v.number()),
    model: v.optional(v.string()),
    extractionVersion: v.optional(v.string()),
    error: v.optional(v.string()),
    usage: v.optional(usage),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),
  findings: defineTable(
    proposal.extend({
      inspectionId: v.id("inspections"),
      ownerId: v.id("users"),
      run: v.number(),
      originalProposal: proposal,
      reviewStatus,
      editedBy: v.optional(v.id("users")),
      editedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.id("users")),
      reviewedAt: v.optional(v.number()),
      graphId: v.optional(v.id("remediationGraphs")),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ).index("by_inspectionId", ["inspectionId"]),
  inspectionEvents: defineTable({
    inspectionId: v.id("inspections"),
    findingId: v.optional(v.id("findings")),
    type: v.string(),
    actorId: v.optional(v.id("users")),
    run: v.optional(v.number()),
    before: v.optional(editable),
    after: v.optional(editable),
    createdAt: v.number(),
  }).index("by_inspectionId", ["inspectionId"]),

  /**
   * One remediation graph represents the workflow required
   * to resolve a finding.
   *
   * Inspection-derived graphs link to a human-confirmed finding.
   * The deterministic engine remains independent of extraction.
   */
  remediationGraphs: defineTable({
    title: v.string(),
    inspectionId: v.optional(v.id("inspections")),
    findingId: v.optional(v.id("findings")),
    vendorId: v.optional(v.id("vendors")),
    coordinationEnabled: v.optional(v.boolean()),
    quoteCurrency: v.optional(v.string()),
    // Only explicitly created demo graphs permit simulated external/system work.
    isDemo: v.optional(v.boolean()),

    status: v.union(
      v.literal("ACTIVE"),
      v.literal("RESOLVED"),
      v.literal("CANCELLED"),
    ),

    createdBy: v.id("users"),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"]),

  /**
   * A node is one unit of work or state in a remediation graph.
   *
   * Examples:
   * - Contact electrician
   * - Receive quote
   * - Approve quote
   * - Perform repair
   * - Collect evidence
   * - Verify repair
   */
  graphNodes: defineTable({
    graphId: v.id("remediationGraphs"),
    coordinationRole: v.optional(role),

    type: v.union(
      v.literal("ACTION"),
      v.literal("EXTERNAL_ACTION"),
      v.literal("HUMAN_DECISION"),
      v.literal("WAIT"),
      v.literal("EVIDENCE"),
      v.literal("VERIFICATION"),
      v.literal("MILESTONE"),
    ),

    status: v.union(
      v.literal("BLOCKED"),
      v.literal("READY"),
      v.literal("RUNNING"),
      v.literal("WAITING_EXTERNAL"),
      v.literal("WAITING_HUMAN"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("CANCELLED"),
    ),

    title: v.string(),
    description: v.optional(v.string()),

    /**
     * Defines who is allowed to execute/satisfy this node.
     *
     * This becomes one of our primary safety boundaries.
     */
    executionPolicy: v.union(
      v.literal("SYSTEM"),
      v.literal("HUMAN"),
      v.literal("EXTERNAL"),
      v.literal("SYSTEM_WITH_APPROVAL"),
    ),

    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_graphId", ["graphId"]),

  /**
   * Directed dependency:
   *
   * fromNodeId ─────► toNodeId
   *
   * means:
   *
   * toNodeId cannot become READY until fromNodeId
   * has been COMPLETED.
   */
  graphEdges: defineTable({
    graphId: v.id("remediationGraphs"),

    fromNodeId: v.id("graphNodes"),
    toNodeId: v.id("graphNodes"),

    type: v.literal("REQUIRES"),

    createdAt: v.number(),
  })
    .index("by_graphId", ["graphId"])
    .index("by_fromNodeId", ["fromNodeId"])
    .index("by_toNodeId", ["toNodeId"]),

  /**
   * Append-only audit trail.
   *
   * We will use this to explain exactly why Resolve
   * changed workflow state.
   */
  workflowEvents: defineTable({
    graphId: v.id("remediationGraphs"),
    nodeId: v.optional(v.id("graphNodes")),

    type: v.string(),

    actorType: v.union(
      v.literal("SYSTEM"),
      v.literal("USER"),
      v.literal("AI"),
      v.literal("EXTERNAL"),
      v.literal("WEBHOOK"),
    ),

    actorId: v.optional(v.string()),

    /**
     * Keep Phase 1 metadata deliberately simple.
     * Later we'll replace/extend this with structured
     * domain-specific event data where appropriate.
     */
    metadata: v.optional(v.any()),

    createdAt: v.number(),
  })
    .index("by_nodeId", ["nodeId"])
    .index("by_graphId_createdAt", ["graphId", "createdAt"]),
});
