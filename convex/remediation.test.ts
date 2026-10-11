/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Doc } from "./_generated/dataModel";
import { getExecutableNodes } from "./remediation/transitions";

const modules = import.meta.glob("./**/*.{ts,js}");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "owner@example.com" }),
  );
  const otherId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "other@example.com" }),
  );
  const owner = t.withIdentity({ subject: `${userId}|owner-session` });
  const other = t.withIdentity({ subject: `${otherId}|other-session` });
  const graphId = await owner.mutation(api.remediation.graphs.createDemo, {});
  const detail = () => owner.query(api.remediation.graphs.detail, { graphId });
  const initial = await detail();
  const node = (title: string) => {
    const result = initial.nodes.find((item) => item.title === title);
    if (!result) throw new Error(`Missing node: ${title}`);
    return result;
  };
  const complete = async (item: Doc<"graphNodes">) =>
    owner.mutation(
      item.executionPolicy === "HUMAN"
        ? api.remediation.nodes.completeHuman
        : api.remediation.nodes.simulateDemo,
      { nodeId: item._id },
    );
  const throughRepair = async () => {
    for (const item of initial.nodes.slice(0, 4)) await complete(item);
  };
  return {
    t,
    owner,
    other,
    userId,
    graphId,
    detail,
    initial,
    node,
    complete,
    throughRepair,
  };
}

describe("deterministic remediation engine", () => {
  test("creates an owned graph with only the root READY and append-only creation events", async () => {
    const { initial, userId } = await setup();
    expect(initial.graph).toMatchObject({
      status: "ACTIVE",
      createdBy: userId,
      isDemo: true,
    });
    expect(initial.nodes[0].status).toBe("READY");
    expect(
      initial.nodes.slice(1).every((node) => node.status === "BLOCKED"),
    ).toBe(true);
    expect(
      getExecutableNodes(initial.nodes, initial.edges).map((node) => node._id),
    ).toEqual([initial.nodes[0]._id]);
    expect(
      initial.events.filter((event) => event.type === "node.created"),
    ).toHaveLength(7);
    expect(
      initial.events.some(
        (event) => event.type === "graph.created" && event.actorId === userId,
      ),
    ).toBe(true);
  });

  test("completion unlocks the dependent and preserves previous audit documents", async () => {
    const { t, initial, detail } = await setup();
    await t.mutation(internal.remediation.nodes.completeSystem, {
      nodeId: initial.nodes[0]._id,
    });
    const updated = await detail();
    expect(updated.nodes[0].status).toBe("COMPLETED");
    expect(updated.nodes[1].status).toBe("READY");
    expect(updated.nodes[2].status).toBe("BLOCKED");
    for (const event of initial.events)
      expect(updated.events).toContainEqual(event);
    expect(updated.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "node.completed",
          actorType: "SYSTEM",
          nodeId: initial.nodes[0]._id,
        }),
        expect.objectContaining({
          type: "dependency.unblocked",
          nodeId: initial.nodes[1]._id,
        }),
        expect.objectContaining({
          type: "node.ready",
          nodeId: initial.nodes[1]._id,
        }),
      ]),
    );
  });

  test("fan-in stays BLOCKED after A and becomes READY only after B", async () => {
    const { throughRepair, complete, node, detail } = await setup();
    await throughRepair();
    let data = await detail();
    expect(data.nodes.filter((item) => item.status === "READY")).toHaveLength(
      2,
    );
    await complete(node("Collect completion evidence"));
    data = await detail();
    expect(
      data.nodes.find((item) => item.type === "VERIFICATION")?.status,
    ).toBe("BLOCKED");
    expect(data.graph.status).toBe("ACTIVE");
    await complete(node("Confirm emergency lighting test"));
    data = await detail();
    expect(
      data.nodes.find((item) => item.type === "VERIFICATION")?.status,
    ).toBe("READY");
    expect(data.graph.status).toBe("ACTIVE");
  });

  test("ready HUMAN nodes reject both internal SYSTEM and public demo simulation", async () => {
    const { t, owner, complete, initial, node, detail } = await setup();
    await complete(initial.nodes[0]);
    await complete(initial.nodes[1]);
    const nodeId = node("Approve quote")._id;
    const before = await detail();
    await expect(
      t.mutation(internal.remediation.nodes.completeSystem, { nodeId }),
    ).rejects.toThrow(/human/i);
    await expect(
      owner.mutation(api.remediation.nodes.simulateDemo, { nodeId }),
    ).rejects.toThrow(/human/i);
    expect(await detail()).toEqual(before);
  });

  test("authenticated owner completes an eligible HUMAN node with attributable audit", async () => {
    const { complete, initial, node, detail, userId } = await setup();
    await complete(initial.nodes[0]);
    await complete(initial.nodes[1]);
    const approval = node("Approve quote");
    await complete(approval);
    const data = await detail();
    expect(data.nodes.find((item) => item._id === approval._id)?.status).toBe(
      "COMPLETED",
    );
    expect(data.events).toContainEqual(
      expect.objectContaining({
        type: "node.completed",
        nodeId: approval._id,
        actorType: "USER",
        actorId: userId,
      }),
    );
  });

  test("BLOCKED completion and duplicate completion are rejected without side effects", async () => {
    const { complete, initial, detail } = await setup();
    await expect(complete(initial.nodes[1])).rejects.toThrow(
      /Invalid transition/,
    );
    expect(await detail()).toEqual(initial);
    await complete(initial.nodes[0]);
    const before = await detail();
    await expect(complete(initial.nodes[0])).rejects.toThrow(
      /Invalid transition/,
    );
    expect(await detail()).toEqual(before);
  });

  test("dependencies are revalidated even if stored READY state is incorrect", async () => {
    const { t, initial, complete } = await setup();
    const quote = initial.nodes[1];
    await t.run((ctx) =>
      ctx.db.patch("graphNodes", quote._id, { status: "READY" }),
    );
    await expect(complete(quote)).rejects.toThrow(
      /dependencies are incomplete/,
    );
  });

  test("only legitimate terminal human verification resolves the graph", async () => {
    const { t, owner, complete, throughRepair, node, detail, userId } =
      await setup();
    await throughRepair();
    await complete(node("Collect completion evidence"));
    await complete(node("Confirm emergency lighting test"));
    expect((await detail()).graph.status).toBe("ACTIVE");
    const nodeId = node("Verify repair")._id;
    await expect(
      t.mutation(internal.remediation.nodes.completeSystem, { nodeId }),
    ).rejects.toThrow(/human/i);
    await expect(
      owner.mutation(api.remediation.nodes.simulateDemo, { nodeId }),
    ).rejects.toThrow(/human/i);
    await complete(node("Verify repair"));
    const data = await detail();
    expect(data.graph.status).toBe("RESOLVED");
    expect(
      data.events.filter((event) => event.type === "graph.resolved"),
    ).toEqual([
      expect.objectContaining({ actorType: "USER", actorId: userId }),
    ]);
    await expect(complete(node("Verify repair"))).rejects.toThrow(/not active/);
  });

  test("completion of ordinary actions alone cannot resolve a graph", async () => {
    const { t, owner, userId } = await setup();
    const graphId = await t.run((ctx) =>
      ctx.db.insert("remediationGraphs", {
        title: "No verification",
        status: "ACTIVE",
        createdBy: userId,
        createdAt: 0,
        updatedAt: 0,
      }),
    );
    const nodeId = await t.run((ctx) =>
      ctx.db.insert("graphNodes", {
        graphId,
        title: "Ordinary action",
        type: "ACTION",
        status: "READY",
        executionPolicy: "SYSTEM",
        createdAt: 0,
      }),
    );
    await t.mutation(internal.remediation.nodes.completeSystem, { nodeId });
    expect(
      (await owner.query(api.remediation.graphs.detail, { graphId })).graph
        .status,
    ).toBe("ACTIVE");
  });

  test("users cannot read, complete, or simulate another user's graph", async () => {
    const { other, graphId, initial } = await setup();
    await expect(
      other.query(api.remediation.graphs.detail, { graphId }),
    ).rejects.toThrow(/not found/);
    for (const mutation of [
      api.remediation.nodes.completeHuman,
      api.remediation.nodes.simulateDemo,
    ]) {
      await expect(
        other.mutation(mutation, { nodeId: initial.nodes[0]._id }),
      ).rejects.toThrow(/not found/);
    }
    const overview = await other.query(api.remediation.graphs.overview, {});
    expect(overview.graphs).toEqual([]);
    expect(overview.metrics).toEqual({
      active: 0,
      open: 0,
      needsYou: 0,
      resolved: 0,
    });
  });

  test("all public graph endpoints reject unauthenticated access", async () => {
    const { t, graphId, initial } = await setup();
    await expect(t.query(api.remediation.graphs.overview, {})).rejects.toThrow(
      /Sign in/,
    );
    await expect(
      t.query(api.remediation.graphs.detail, { graphId }),
    ).rejects.toThrow(/Sign in/);
    await expect(
      t.mutation(api.remediation.graphs.createDemo, {}),
    ).rejects.toThrow(/Sign in/);
    await expect(
      t.mutation(api.remediation.nodes.completeHuman, {
        nodeId: initial.nodes[2]._id,
      }),
    ).rejects.toThrow(/Sign in/);
    await expect(
      t.mutation(api.remediation.nodes.simulateDemo, {
        nodeId: initial.nodes[0]._id,
      }),
    ).rejects.toThrow(/Sign in/);
  });

  test("simulations are demo-only and identify the initiating user", async () => {
    const { t, initial, complete, detail, graphId, userId } = await setup();
    await complete(initial.nodes[0]);
    expect((await detail()).events).toContainEqual(
      expect.objectContaining({
        type: "node.completed",
        actorType: "SYSTEM",
        metadata: { simulation: true, initiatedBy: userId },
      }),
    );
    await t.run((ctx) =>
      ctx.db.patch("remediationGraphs", graphId, { isDemo: false }),
    );
    await expect(complete(initial.nodes[1])).rejects.toThrow(
      /only available for demo/,
    );
  });

  test("SYSTEM_WITH_APPROVAL is fail-closed for every available execution path", async () => {
    const { t, owner, initial } = await setup();
    const nodeId = initial.nodes[0]._id;
    await t.run((ctx) =>
      ctx.db.patch("graphNodes", nodeId, {
        executionPolicy: "SYSTEM_WITH_APPROVAL",
      }),
    );
    await expect(
      t.mutation(internal.remediation.nodes.completeSystem, { nodeId }),
    ).rejects.toThrow(/Execution policy/);
    await expect(
      owner.mutation(api.remediation.nodes.completeHuman, { nodeId }),
    ).rejects.toThrow(/Execution policy/);
    await expect(
      owner.mutation(api.remediation.nodes.simulateDemo, { nodeId }),
    ).rejects.toThrow(/Execution policy/);
  });

  test("human endpoint cannot impersonate SYSTEM or EXTERNAL, and system cannot satisfy EXTERNAL", async () => {
    const { t, owner, initial, complete } = await setup();
    await expect(
      owner.mutation(api.remediation.nodes.completeHuman, {
        nodeId: initial.nodes[0]._id,
      }),
    ).rejects.toThrow(/Execution policy/);
    await complete(initial.nodes[0]);
    await expect(
      owner.mutation(api.remediation.nodes.completeHuman, {
        nodeId: initial.nodes[1]._id,
      }),
    ).rejects.toThrow(/Execution policy/);
    await expect(
      t.mutation(internal.remediation.nodes.completeSystem, {
        nodeId: initial.nodes[1]._id,
      }),
    ).rejects.toThrow(/Execution policy/);
  });

  test("cancelled graphs cannot progress", async () => {
    const { t, graphId, initial, complete } = await setup();
    await t.run((ctx) =>
      ctx.db.patch("remediationGraphs", graphId, { status: "CANCELLED" }),
    );
    await expect(complete(initial.nodes[0])).rejects.toThrow(/not active/);
  });

  test("overview metrics follow readiness and terminal resolution", async () => {
    const { owner, complete, initial } = await setup();
    const overview = () => owner.query(api.remediation.graphs.overview, {});
    expect((await overview()).metrics).toEqual({
      active: 1,
      open: 7,
      needsYou: 0,
      resolved: 0,
    });
    await complete(initial.nodes[0]);
    await complete(initial.nodes[1]);
    expect((await overview()).metrics).toEqual({
      active: 1,
      open: 5,
      needsYou: 1,
      resolved: 0,
    });
    for (const node of initial.nodes.slice(2)) await complete(node);
    expect((await overview()).metrics).toEqual({
      active: 0,
      open: 0,
      needsYou: 0,
      resolved: 1,
    });
  });

  test.each([
    "RUNNING",
    "WAITING_EXTERNAL",
    "WAITING_HUMAN",
    "FAILED",
    "CANCELLED",
  ] as const)("rejects unsupported completion from %s", async (status) => {
    const { t, initial, complete } = await setup();
    await t.run((ctx) =>
      ctx.db.patch("graphNodes", initial.nodes[0]._id, { status }),
    );
    await expect(complete(initial.nodes[0])).rejects.toThrow(
      /Invalid transition/,
    );
  });

  test("a missing or cross-graph predecessor fails closed", async () => {
    const { t, userId, graphId, initial, complete } = await setup();
    await t.run(async (ctx) => {
      const foreignGraph = await ctx.db.insert("remediationGraphs", {
        title: "Separate graph",
        createdBy: userId,
        createdAt: 0,
        updatedAt: 0,
        status: "ACTIVE",
      });
      const foreignNode = await ctx.db.insert("graphNodes", {
        graphId: foreignGraph,
        title: "Foreign dependency",
        type: "ACTION",
        executionPolicy: "SYSTEM",
        status: "COMPLETED",
        createdAt: 0,
      });
      await ctx.db.insert("graphEdges", {
        graphId,
        fromNodeId: foreignNode,
        toNodeId: initial.nodes[0]._id,
        type: "REQUIRES",
        createdAt: 0,
      });
    });
    await expect(complete(initial.nodes[0])).rejects.toThrow(
      /Invalid dependency graph/,
    );
    expect(
      await t.run((ctx) => ctx.db.get("graphNodes", initial.nodes[0]._id)),
    ).toMatchObject({ status: "READY" });
  });
});
