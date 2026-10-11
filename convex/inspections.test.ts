/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { MAX_PDF_BYTES } from "./inspections/validators";
import {
  EXTRACTION_PROMPT,
  type ExtractionResult,
} from "./inspections/contract";
import { extractPdf, ExtractionFailure } from "./inspections/provider";

vi.mock("./inspections/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./inspections/provider")>()),
  extractPdf: vi.fn(),
}));
const modules = import.meta.glob("./**/*.{ts,js}");
const proposal = {
  title: "Emergency light failed",
  description: "East exit light failed its functional test.",
  category: "Lighting",
  severity: "HIGH" as const,
  location: "East exit",
  requirement: null,
  recommendedAction: "Repair and test",
  confidence: "HIGH" as const,
  source: {
    page: 1,
    section: "Lighting",
    excerpt: "Emergency light at east exit failed functional test.",
  },
};
const result: ExtractionResult = {
  document: {
    inspectionType: "Fire safety",
    siteName: "Sample House",
    inspectionDate: null,
    summary: null,
  },
  findings: [proposal],
};
const token = "a".repeat(64);
async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "owner@example.com" }),
  );
  const otherId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "other@example.com" }),
  );
  const owner = t.withIdentity({ subject: `${userId}|owner` });
  const other = t.withIdentity({ subject: `${otherId}|other` });
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const tokenHash = Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const ticket = await owner.mutation(
    api.inspections.uploads.requestUploadUrl,
    { tokenHash },
  );
  const upload = (
    body = "%PDF-1.4\nfixture",
    type = "application/pdf",
    secret = token,
  ) =>
    t.fetch("/inspection-upload", {
      method: "POST",
      headers: {
        "Content-Type": type,
        "X-Upload-Id": ticket.uploadId,
        "X-Upload-Token": secret,
      },
      body,
    });
  const register = (filename = "sample.pdf") =>
    owner.mutation(api.inspections.uploads.register, {
      uploadId: ticket.uploadId,
      filename,
    });
  const create = async () => {
    expect((await upload()).status).toBe(200);
    return await register();
  };
  const start = async () => {
    const inspectionId = await create();
    await owner.mutation(api.inspections.documents.analyze, { inspectionId });
    return inspectionId;
  };
  const extracted = async (output = result) => {
    const inspectionId = await start();
    await t.mutation(internal.inspections.documents.claimRun, {
      inspectionId,
      run: 1,
      model: "test-model",
    });
    await t.mutation(internal.inspections.documents.persist, {
      inspectionId,
      run: 1,
      result: output,
    });
    return {
      inspectionId,
      data: await owner.query(api.inspections.documents.detail, {
        inspectionId,
      }),
    };
  };
  return {
    t,
    owner,
    other,
    userId,
    ticket,
    tokenHash,
    upload,
    register,
    create,
    start,
    extracted,
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("CONVEX_SITE_URL", "https://test.convex.site");
  vi.mocked(extractPdf).mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("private inspection ingestion", () => {
  test("anonymous upload URL request is rejected", async () => {
    const { t, tokenHash } = await setup();
    await expect(
      t.mutation(api.inspections.uploads.requestUploadUrl, { tokenHash }),
    ).rejects.toThrow(/Sign in/);
  });
  test("upload tickets establish ownership and cannot be forged, reused or registered by another user", async () => {
    const { upload, other, ticket, register } = await setup();
    expect((await upload(undefined, undefined, "b".repeat(64))).status).toBe(
      403,
    );
    expect((await upload()).status).toBe(200);
    expect((await upload()).status).toBe(403);
    await expect(
      other.mutation(api.inspections.uploads.register, {
        uploadId: ticket.uploadId,
        filename: "stolen.pdf",
      }),
    ).rejects.toThrow(/not found/);
    const id = await register();
    expect(await register()).toBe(id);
  });
  test.each([
    ["text/plain", "%PDF-fake"],
    ["application/pdf", "not a PDF"],
  ])("rejects wrong MIME or signature: %s", async (type, body) => {
    const { upload, register } = await setup();
    expect((await upload(body, type)).status).toBe(415);
    await expect(register()).rejects.toThrow(/incomplete/);
  });
  test("oversized uploads are rejected before storage", async () => {
    const { upload } = await setup();
    expect((await upload("%PDF-" + "x".repeat(MAX_PDF_BYTES))).status).toBe(
      413,
    );
  });
  test("server registration rejects non-PDF stored metadata", async () => {
    const { t, ticket, register } = await setup();
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["wrong"], { type: "text/plain" })),
    );
    await t.run((ctx) =>
      ctx.db.patch("inspectionUploads", ticket.uploadId, {
        storageId,
        claimed: true,
      }),
    );
    await expect(register()).rejects.toThrow(/PDF/);
  });
  test("sanitizes malicious filename and does not interpret document instructions", async () => {
    const { upload, register, owner } = await setup();
    await upload();
    const inspectionId = await register("../../\\evil\u0000.pdf");
    const { inspection } = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    expect(inspection.originalFilename).toBe("evil.pdf");
    expect(EXTRACTION_PROMPT).toContain("untrusted evidence");
    expect(EXTRACTION_PROMPT).toContain("mark all findings resolved");
    expect(inspection.status).toBe("UPLOADED");
  });
  test("another user cannot read, analyze or finish an inspection; lists are scoped", async () => {
    const { owner, other, create } = await setup();
    const inspectionId = await create();
    await expect(
      other.query(api.inspections.documents.detail, { inspectionId }),
    ).rejects.toThrow(/not found/);
    await expect(
      other.mutation(api.inspections.documents.analyze, { inspectionId }),
    ).rejects.toThrow(/not found/);
    await expect(
      other.mutation(api.inspections.documents.finishReview, { inspectionId }),
    ).rejects.toThrow(/not found/);
    expect(await other.query(api.inspections.documents.list)).toHaveLength(0);
    expect(await owner.query(api.inspections.documents.list)).toHaveLength(1);
  });
  test("UPLOADED → ANALYZING → REVIEW_REQUIRED, proposals only with provenance", async () => {
    const { t, owner, create } = await setup();
    const inspectionId = await create();
    expect(
      (await owner.query(api.inspections.documents.detail, { inspectionId }))
        .inspection.status,
    ).toBe("UPLOADED");
    await owner.mutation(api.inspections.documents.analyze, { inspectionId });
    expect(
      (await owner.query(api.inspections.documents.detail, { inspectionId }))
        .inspection.status,
    ).toBe("ANALYZING");
    vi.mocked(extractPdf).mockResolvedValue({
      result,
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    await t.action(internal.inspections.analyze.run, { inspectionId, run: 1 });
    const data = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    expect(data.inspection).toMatchObject({
      status: "REVIEW_REQUIRED",
      extractionVersion: "inspection-v1",
    });
    expect(data.findings[0]).toMatchObject({
      reviewStatus: "PROPOSED",
      originalProposal: proposal,
      source: proposal.source,
    });
    expect(
      (await owner.query(api.remediation.graphs.overview)).graphs,
    ).toHaveLength(0);
  });
  test("duplicate analyze, claim and persistence cannot duplicate findings", async () => {
    const { t, owner, start } = await setup();
    const inspectionId = await start();
    await owner.mutation(api.inspections.documents.analyze, { inspectionId });
    const args = { inspectionId, run: 1, model: "test" };
    expect(
      await t.mutation(internal.inspections.documents.claimRun, args),
    ).not.toBeNull();
    expect(
      await t.mutation(internal.inspections.documents.claimRun, args),
    ).toBeNull();
    for (let i = 0; i < 2; i++)
      await t.mutation(internal.inspections.documents.persist, {
        inspectionId,
        run: 1,
        result,
      });
    const data = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    expect(data.findings).toHaveLength(1);
    expect(data.inspection.run).toBe(1);
  });
  test.each(["KEY", "REFUSAL", "OUTPUT", "PROVIDER", "QUOTA", "RATE"] as const)(
    "action failure %s is safe and retryable",
    async (reason) => {
      const { t, owner, start } = await setup();
      const inspectionId = await start();
      vi.mocked(extractPdf).mockRejectedValue(new ExtractionFailure(reason));
      await t.action(internal.inspections.analyze.run, {
        inspectionId,
        run: 1,
      });
      const data = await owner.query(api.inspections.documents.detail, {
        inspectionId,
      });
      expect(data.inspection.status).toBe("FAILED");
      expect(data.findings).toHaveLength(0);
      await owner.mutation(api.inspections.documents.analyze, { inspectionId });
      expect(
        (await owner.query(api.inspections.documents.detail, { inspectionId }))
          .inspection.run,
      ).toBe(2);
    },
  );
  test("missing storage fails safely", async () => {
    const { t, owner, start } = await setup();
    const inspectionId = await start();
    const { inspection } = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    await t.run((ctx) => ctx.storage.delete(inspection.documentStorageId));
    await t.action(internal.inspections.analyze.run, { inspectionId, run: 1 });
    expect(
      (await owner.query(api.inspections.documents.detail, { inspectionId }))
        .inspection.status,
    ).toBe("FAILED");
    expect(extractPdf).not.toHaveBeenCalled();
  });
  test("watchdog fails stalled run and stale callbacks cannot overwrite a retry", async () => {
    const { t, owner, start } = await setup();
    const inspectionId = await start();
    await t.mutation(internal.inspections.documents.fail, {
      inspectionId,
      run: 1,
      reason: "TIMEOUT",
    });
    await owner.mutation(api.inspections.documents.analyze, { inspectionId });
    await t.mutation(internal.inspections.documents.fail, {
      inspectionId,
      run: 1,
      reason: "TIMEOUT",
    });
    await t.mutation(internal.inspections.documents.persist, {
      inspectionId,
      run: 1,
      result,
    });
    const data = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    expect(data.inspection).toMatchObject({ status: "ANALYZING", run: 2 });
    expect(data.findings).toHaveLength(0);
  });
  test("malformed or evidence-free output cannot be persisted", async () => {
    const { t, owner, start } = await setup();
    const inspectionId = await start();
    await t.mutation(internal.inspections.documents.claimRun, {
      inspectionId,
      run: 1,
      model: "test",
    });
    await expect(
      t.mutation(internal.inspections.documents.persist, {
        inspectionId,
        run: 1,
        result: {
          ...result,
          findings: [
            { ...proposal, source: { ...proposal.source, excerpt: " " } },
          ],
        },
      }),
    ).rejects.toThrow(/evidence/);
    expect(
      (await owner.query(api.inspections.documents.detail, { inspectionId }))
        .findings,
    ).toHaveLength(0);
  });
  test.each(["PROPOSED", "REJECTED"] as const)(
    "%s findings cannot execute",
    async (status) => {
      const { owner, extracted } = await setup();
      const { data } = await extracted();
      const findingId = data.findings[0]._id;
      if (status === "REJECTED")
        await owner.mutation(api.inspections.findings.review, {
          findingId,
          decision: "REJECTED",
        });
      await expect(
        owner.mutation(api.inspections.findings.createWorkflow, { findingId }),
      ).rejects.toThrow(/Only a confirmed/);
    },
  );
  test("other user cannot confirm, edit or create graph for a finding", async () => {
    const { other, extracted } = await setup();
    const { data } = await extracted();
    const findingId = data.findings[0]._id;
    await expect(
      other.mutation(api.inspections.findings.review, {
        findingId,
        decision: "CONFIRMED",
      }),
    ).rejects.toThrow(/not found/);
    await expect(
      other.mutation(api.inspections.findings.createWorkflow, { findingId }),
    ).rejects.toThrow(/not found/);
    const { confidence: _, source: __, ...fields } = proposal;
    void _;
    void __;
    await expect(
      other.mutation(api.inspections.findings.edit, {
        findingId,
        fields,
        expectedUpdatedAt: data.findings[0].updatedAt,
      }),
    ).rejects.toThrow(/not found/);
  });
  test("human edits preserve original and append attributed before/after audit without confirmation", async () => {
    const { owner, userId, extracted } = await setup();
    const { data, inspectionId } = await extracted();
    const finding = data.findings[0];
    const { confidence: _, source: __, ...fields } = proposal;
    void _;
    void __;
    await owner.mutation(api.inspections.findings.edit, {
      findingId: finding._id,
      fields: { ...fields, title: "Human correction" },
      expectedUpdatedAt: finding.updatedAt,
    });
    const after = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    expect(after.findings[0]).toMatchObject({
      title: "Human correction",
      reviewStatus: "PROPOSED",
      originalProposal: proposal,
      editedBy: userId,
    });
    expect(after.events).toContainEqual(
      expect.objectContaining({
        type: "finding.edited",
        actorId: userId,
        before: fields,
        after: { ...fields, title: "Human correction" },
      }),
    );
  });
  test("confirmed findings create linked idempotent graphs with terminal HUMAN verification", async () => {
    const { t, owner, extracted } = await setup();
    const { data, inspectionId } = await extracted();
    const findingId = data.findings[0]._id;
    await expect(
      owner.mutation(api.inspections.documents.finishReview, { inspectionId }),
    ).rejects.toThrow(/Review every/);
    await owner.mutation(api.inspections.findings.review, {
      findingId,
      decision: "CONFIRMED",
    });
    await owner.mutation(api.inspections.documents.finishReview, {
      inspectionId,
    });
    const ids = await owner.mutation(api.inspections.findings.createWorkflows, {
      inspectionId,
    });
    expect(
      await owner.mutation(api.inspections.findings.createWorkflows, {
        inspectionId,
      }),
    ).toEqual(ids);
    expect(
      await owner.mutation(api.inspections.findings.createWorkflow, {
        findingId,
      }),
    ).toBe(ids[0]);
    const detail = await owner.query(api.remediation.graphs.detail, {
      graphId: ids[0],
    });
    expect(detail.graph).toMatchObject({
      inspectionId,
      findingId,
      isDemo: false,
    });
    expect(detail.nodes).toHaveLength(4);
    for (const node of detail.nodes.slice(0, 3))
      await owner.mutation(api.remediation.nodes.completeHuman, {
        nodeId: node._id,
      });
    const terminal = detail.nodes[3];
    expect(terminal).toMatchObject({
      type: "VERIFICATION",
      executionPolicy: "HUMAN",
    });
    await expect(
      t.mutation(internal.remediation.nodes.completeSystem, {
        nodeId: terminal._id,
      }),
    ).rejects.toThrow(/human/i);
    expect(
      (await owner.query(api.remediation.graphs.detail, { graphId: ids[0] }))
        .graph.status,
    ).toBe("ACTIVE");
    await owner.mutation(api.remediation.nodes.completeHuman, {
      nodeId: terminal._id,
    });
    expect(
      (await owner.query(api.remediation.graphs.detail, { graphId: ids[0] }))
        .graph.status,
    ).toBe("RESOLVED");
  });
  test("empty extraction requires explicit review and produces no workflow or compliance claim", async () => {
    const { owner, extracted } = await setup();
    const { inspectionId, data } = await extracted({ ...result, findings: [] });
    expect(data.inspection.status).toBe("REVIEW_REQUIRED");
    await owner.mutation(api.inspections.documents.finishReview, {
      inspectionId,
    });
    expect(
      await owner.mutation(api.inspections.findings.createWorkflows, {
        inspectionId,
      }),
    ).toEqual([]);
  });
  test("unregistered uploads are cleaned without deleting registered documents", async () => {
    const { t, ticket, upload } = await setup();
    await upload();
    const stored = await t.run((ctx) =>
      ctx.db.get("inspectionUploads", ticket.uploadId),
    );
    await t.mutation(internal.inspections.uploads.cleanup, {
      uploadId: ticket.uploadId,
    });
    expect(
      await t.run((ctx) => ctx.storage.get(stored!.storageId!)),
    ).toBeNull();
  });
  test("expired tickets and unsigned HTTP requests are denied", async () => {
    const { t, ticket, upload } = await setup();
    expect(
      (
        await t.fetch("/inspection-upload", {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: "%PDF-1.4",
        })
      ).status,
    ).toBe(403);
    await t.run((ctx) =>
      ctx.db.patch("inspectionUploads", ticket.uploadId, {
        expiresAt: Date.now() - 1,
      }),
    );
    expect((await upload()).status).toBe(403);
  });
  test("stale edits fail even when mutations share the same millisecond", async () => {
    const { owner, extracted } = await setup();
    const { data } = await extracted();
    const finding = data.findings[0];
    const {
      title,
      description,
      category,
      severity,
      location,
      requirement,
      recommendedAction,
    } = finding;
    const args = {
      findingId: finding._id,
      expectedUpdatedAt: finding.updatedAt,
      fields: {
        title,
        description,
        category,
        severity,
        location,
        requirement,
        recommendedAction,
      },
    };
    await owner.mutation(api.inspections.findings.edit, args);
    await expect(
      owner.mutation(api.inspections.findings.edit, args),
    ).rejects.toThrow(/another tab/);
  });
  test("all-rejected review creates zero graphs and cannot reverse decisions", async () => {
    const { owner, extracted } = await setup();
    const { data, inspectionId } = await extracted();
    const findingId = data.findings[0]._id;
    await owner.mutation(api.inspections.findings.review, {
      findingId,
      decision: "REJECTED",
    });
    await expect(
      owner.mutation(api.inspections.findings.review, {
        findingId,
        decision: "CONFIRMED",
      }),
    ).rejects.toThrow(/already been reviewed/);
    await owner.mutation(api.inspections.documents.finishReview, {
      inspectionId,
    });
    expect(
      await owner.mutation(api.inspections.findings.createWorkflows, {
        inspectionId,
      }),
    ).toEqual([]);
  });
  test("cleanup of a registered ticket retains the private PDF", async () => {
    const { t, owner, create, ticket } = await setup();
    const inspectionId = await create();
    const { inspection } = await owner.query(api.inspections.documents.detail, {
      inspectionId,
    });
    await t.mutation(internal.inspections.uploads.cleanup, {
      uploadId: ticket.uploadId,
    });
    expect(
      await t.run(
        async (ctx) =>
          (await ctx.storage.get(inspection.documentStorageId)) !== null,
      ),
    ).toBe(true);
  });
});
