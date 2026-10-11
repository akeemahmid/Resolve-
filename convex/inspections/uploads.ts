import { ConvexError, v } from "convex/values";
import { env, internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireUser } from "../remediation/access";
import { event } from "./access";
import { MAX_PDF_BYTES } from "./validators";

export const requestUploadUrl = mutation({
  args: { tokenHash: v.string() },
  returns: v.object({ uploadId: v.id("inspectionUploads"), url: v.string() }),
  handler: async (ctx, { tokenHash }) => {
    const ownerId = await requireUser(ctx);
    if (!/^[a-f0-9]{64}$/.test(tokenHash))
      throw new ConvexError("Invalid upload request.");
    const pending = await ctx.db
      .query("inspectionUploads")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(10);
    if (pending.length >= 10)
      throw new ConvexError(
        "Too many pending uploads. Try again in 15 minutes.",
      );
    const site = env.CONVEX_SITE_URL;
    if (!site) throw new ConvexError("Uploads are not configured.");
    const uploadId = await ctx.db.insert("inspectionUploads", {
      ownerId,
      tokenHash,
      expiresAt: Date.now() + 10 * 60_000,
      claimed: false,
    });
    await ctx.scheduler.runAfter(
      15 * 60_000,
      internal.inspections.uploads.cleanup,
      { uploadId },
    );
    return { uploadId, url: `${site}/inspection-upload` };
  },
});

export const claim = internalMutation({
  args: { uploadId: v.id("inspectionUploads"), tokenHash: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { uploadId, tokenHash }) => {
    const ticket = await ctx.db.get("inspectionUploads", uploadId);
    if (
      !ticket ||
      ticket.tokenHash !== tokenHash ||
      ticket.claimed ||
      ticket.expiresAt < Date.now()
    )
      return false;
    await ctx.db.patch("inspectionUploads", uploadId, { claimed: true });
    return true;
  },
});
export const attach = internalMutation({
  args: { uploadId: v.id("inspectionUploads"), storageId: v.id("_storage") },
  returns: v.boolean(),
  handler: async (ctx, { uploadId, storageId }) => {
    const ticket = await ctx.db.get("inspectionUploads", uploadId);
    if (
      !ticket ||
      !ticket.claimed ||
      ticket.storageId ||
      ticket.expiresAt < Date.now()
    )
      return false;
    await ctx.db.patch("inspectionUploads", uploadId, {
      storageId,
      pdfValidated: true,
    });
    return true;
  },
});
export const cleanup = internalMutation({
  args: { uploadId: v.id("inspectionUploads") },
  returns: v.null(),
  handler: async (ctx, { uploadId }) => {
    const ticket = await ctx.db.get("inspectionUploads", uploadId);
    if (ticket?.storageId && !ticket.inspectionId)
      await ctx.storage.delete(ticket.storageId);
    if (ticket) await ctx.db.delete("inspectionUploads", uploadId);
    return null;
  },
});
export const register = mutation({
  args: { uploadId: v.id("inspectionUploads"), filename: v.string() },
  returns: v.id("inspections"),
  handler: async (ctx, { uploadId, filename }) => {
    const ownerId = await requireUser(ctx);
    const ticket = await ctx.db.get("inspectionUploads", uploadId);
    if (!ticket || ticket.ownerId !== ownerId)
      throw new ConvexError("Upload not found.");
    if (ticket.inspectionId) return ticket.inspectionId;
    if (!ticket.storageId || ticket.expiresAt < Date.now())
      throw new ConvexError(
        "Upload expired or incomplete. Upload the PDF again.",
      );
    const metadata = await ctx.db.system.get("_storage", ticket.storageId);
    if (
      !ticket.pdfValidated ||
      !metadata ||
      (metadata.contentType !== undefined &&
        metadata.contentType !== "application/pdf") ||
      metadata.size < 5 ||
      metadata.size > MAX_PDF_BYTES
    )
      throw new ConvexError("Upload a PDF of up to 10 MB.");
    const name = filename
      .split(/[\\/]/)
      .pop()
      ?.replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 180);
    if (!name || !/\.pdf$/i.test(name))
      throw new ConvexError("Choose a .pdf file.");
    const existing = await ctx.db
      .query("inspections")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(100);
    if (existing.length >= 100)
      throw new ConvexError("Phase 2 supports up to 100 inspections per user.");
    const now = Date.now();
    const inspectionId = await ctx.db.insert("inspections", {
      ownerId,
      title: name.replace(/\.pdf$/i, ""),
      status: "UPLOADED",
      documentStorageId: ticket.storageId,
      originalFilename: name,
      contentType: "application/pdf",
      fileSize: metadata.size,
      run: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("inspectionUploads", uploadId, { inspectionId });
    await event(ctx, inspectionId, "inspection.uploaded", { actorId: ownerId });
    return inspectionId;
  },
});
