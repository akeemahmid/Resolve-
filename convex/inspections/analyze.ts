"use node";
import OpenAI from "openai";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { MAX_PDF_BYTES, runArgs } from "./validators";
import { extractPdf, extractionModel, ExtractionFailure } from "./provider";

export const run = internalAction({
  args: runArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    let stage = "claim";
    try {
      const model = extractionModel();
      const storageId = await ctx.runMutation(
        internal.inspections.documents.claimRun,
        { ...args, model },
      );
      if (!storageId) return null;
      stage = "storage";
      const pdf = await ctx.storage.get(storageId);
      if (
        !pdf ||
        pdf.size > MAX_PDF_BYTES ||
        (await pdf.slice(0, 5).text()) !== "%PDF-"
      )
        throw new ExtractionFailure("FILE");
      stage = "provider";
      const result = await extractPdf(
        Buffer.from(await pdf.arrayBuffer()).toString("base64"),
        model,
      );
      stage = "persist";
      await ctx.runMutation(internal.inspections.documents.persist, {
        ...args,
        ...result,
      });
    } catch (error) {
      // Diagnostic categories only: never log provider messages, payloads or credentials.
      console.warn("Inspection analysis failed", {
        stage,
        status: error instanceof OpenAI.APIError ? error.status : undefined,
        code:
          error instanceof OpenAI.APIError &&
          /^[a-z_]{1,60}$/.test(error.code ?? "")
            ? error.code
            : "unclassified",
        quotaRelated:
          error instanceof OpenAI.APIError &&
          /quota|billing|balance|credits/i.test(error.message),
        rateRelated:
          error instanceof OpenAI.APIError &&
          /rate limit|too many/i.test(error.message),
        category:
          error instanceof ExtractionFailure
            ? error.reason
            : error instanceof TypeError
              ? "type"
              : "service",
      });
      await ctx.runMutation(internal.inspections.documents.fail, {
        ...args,
        reason: error instanceof ExtractionFailure ? error.reason : "PROVIDER",
      });
    }
    return null;
  },
});
