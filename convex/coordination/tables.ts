import { defineTable } from "convex/server";
import { v } from "convex/values";
import { attachment, interpretation } from "./validators";
import { usage } from "../inspections/validators";

export const coordinationTables = {
  vendors: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),
  communications: defineTable({
    ownerId: v.id("users"),
    graphId: v.id("remediationGraphs"),
    inspectionId: v.id("inspections"),
    findingId: v.id("findings"),
    nodeId: v.id("graphNodes"),
    vendorId: v.id("vendors"),
    direction: v.union(v.literal("OUTBOUND"), v.literal("INBOUND")),
    channel: v.literal("EMAIL"),
    provider: v.literal("RESEND"),
    providerEmailId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    inReplyTo: v.optional(v.string()),
    references: v.array(v.string()),
    parentOutboundId: v.optional(v.id("communications")),
    replyTo: v.optional(v.string()),
    correlationToken: v.optional(v.string()),
    from: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    textBody: v.string(),
    attachments: v.array(attachment),
    status: v.union(
      ...(
        [
          "QUEUED",
          "SENDING",
          "SENT",
          "FAILED",
          "RECEIVED",
          "INTERPRETED",
          "NEEDS_REVIEW",
        ] as const
      ).map((x) => v.literal(x)),
    ),
    deliveryStatus: v.optional(v.string()),
    error: v.optional(v.string()),
    policyNote: v.optional(v.string()),
    interpretation: v.optional(interpretation),
    model: v.optional(v.string()),
    interpretationVersion: v.optional(v.string()),
    usage: v.optional(usage),
    attempts: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_providerEmailId", ["providerEmailId"])
    .index("by_messageId", ["messageId"])
    .index("by_graphId", ["graphId"])
    .index("by_findingId", ["findingId"])
    .index("by_nodeId", ["nodeId"])
    .index("by_replyTo", ["replyTo"]),
  externalEvents: defineTable({
    provider: v.literal("RESEND"),
    externalEventId: v.string(),
    eventType: v.string(),
    providerEmailId: v.string(),
    messageId: v.optional(v.string()),
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
    attempt: v.number(),
    status: v.union(
      ...(
        [
          "PENDING",
          "PROCESSING",
          "PROCESSED",
          "FAILED",
          "UNMATCHED",
          "DUPLICATE",
        ] as const
      ).map((x) => v.literal(x)),
    ),
    correlatedGraphId: v.optional(v.id("remediationGraphs")),
    correlatedCommunicationId: v.optional(v.id("communications")),
    error: v.optional(v.string()),
  })
    .index("by_externalEventId", ["externalEventId"])
    .index("by_eventType_and_providerEmailId", ["eventType", "providerEmailId"])
    .index("by_correlatedGraphId", ["correlatedGraphId"]),
  quotes: defineTable({
    ownerId: v.id("users"),
    graphId: v.id("remediationGraphs"),
    findingId: v.id("findings"),
    vendorId: v.id("vendors"),
    communicationId: v.id("communications"),
    amount: v.number(),
    currency: v.string(),
    evidence: v.string(),
    availability: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("RECEIVED"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
    ),
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
    decidedBy: v.optional(v.id("users")),
  })
    .index("by_graphId", ["graphId"])
    .index("by_communicationId", ["communicationId"]),
};
