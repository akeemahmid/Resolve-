import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    // Optional at deployment so missing configuration becomes a safe FAILED run.
    OPENAI_API_KEY: v.optional(v.string()),
    OPENAI_EXTRACTION_MODEL: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    RESEND_WEBHOOK_SECRET: v.optional(v.string()),
    RESEND_FROM_EMAIL: v.optional(v.string()),
    RESEND_INBOUND_DOMAIN: v.optional(v.string()),
  },
});
