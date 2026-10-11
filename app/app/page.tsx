"use client";

import { Button } from "@/components/Button";
import { VendorCoordination } from "@/components/VendorCoordination";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import { WorkflowBadge as Badge } from "@/components/WorkflowBadge";
import { MetricCard } from "@/components/MetricCard";
import { ResolveBrand } from "@/components/ResolveBrand";

type Node = Doc<"graphNodes">;
type Edge = Doc<"graphEdges">;

function errorMessage(error: unknown) {
  return error instanceof ConvexError
    ? String(error.data)
    : "Something went wrong. Please try again.";
}

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <header className="app-header min-h-22 flex justify-between items-center border-b border-b-border bg-surface px-[3.5%] py-5 gap-4 [&_.brand]:min-w-0 [&_.brand>span]:min-w-0">
        <ResolveBrand subtitle="Inspection remediation control room" />
        <div className="header-actions flex shrink-0 items-center gap-[25px]">
          <span className="phase-label text-[10px] font-semibold tracking-[1.4px] text-muted hidden room:block">
            CONTROL ROOM / PRIVATE WORKSPACE
          </span>
          {isAuthenticated && (
            <Button
              variant="secondary"
              onClick={() => {
                void signOut()
                  .then(() => router.push("/signin"))
                  .catch(() =>
                    setError("Could not sign out. Please try again."),
                  );
              }}
            >
              Sign out ↗
            </Button>
          )}
        </div>
      </header>
      {error && (
        <p
          className="
          error-banner bg-danger-soft text-danger-ink rounded-[5px] leading-[1.6] text-[13px] mx-0 my-4 p-3.5
          border border-danger-border border-solid
        "
          role="alert"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <main className="page-container w-[min(1600px,_93%)] pt-7 pb-6 mx-auto my-0 px-0 room:pt-11.5">
          <p role="status">Connecting to your control room…</p>
        </main>
      ) : isAuthenticated ? (
        <ControlRoom />
      ) : (
        <main className="page-container w-[min(1600px,_93%)] pt-7 pb-6 mx-auto my-0 px-0 room:pt-11.5">
          <h1>Your control room awaits.</h1>
          <Link
            className="
            button button-primary inline-flex items-center justify-center rounded-[5px] font-[550] text-[12px]
            [transition:background_0.15s] shrink-0 bg-accent text-foreground px-4 py-[11px] border
            border-transparent border-solid gap-2 [&:hover:not(:disabled)]:bg-accent-hover
          "
            href="/signin"
          >
            Sign in to Resolve
          </Link>
        </main>
      )}
    </>
  );
}

function ControlRoom() {
  const overview = useQuery(api.remediation.graphs.overview);
  const createDemo = useMutation(api.remediation.graphs.createDemo);
  const [selected, setSelected] = useState<Id<"remediationGraphs"> | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphId = selected ?? overview?.graphs[0]?._id;
  async function create() {
    setCreating(true);
    setError(null);
    try {
      setSelected(await createDemo({}));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setCreating(false);
    }
  }
  return (
    <main className="page-container w-[min(1600px,_93%)] pt-7 pb-6 mx-auto my-0 px-0 room:pt-11.5">
      <section className="page-heading flex justify-between items-start mb-8 flex-col gap-6 room:items-center room:flex-row">
        <div>
          <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
            FROM FINDING TO CLEARANCE
          </p>
          <h1>Remediation Control Room</h1>
          <p className="subheading text-muted mt-3 leading-[1.6]">
            Every dependency accounted for. Every resolution verified.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-accent px-4 py-3 text-sm font-medium hover:bg-accent-hover"
            href="/app/inspections"
          >
            Upload inspection →
          </Link>
          <Button
            variant="secondary"
            onClick={() => void create()}
            disabled={creating}
          >
            {creating ? "Creating…" : "+ Create demo graph"}
          </Button>
        </div>
      </section>
      {error && (
        <p
          className="
          error-banner bg-danger-soft text-danger-ink rounded-[5px] leading-[1.6] text-[13px] mx-0 my-4 p-3.5
          border border-danger-border border-solid
        "
          role="alert"
        >
          {error}
        </p>
      )}
      <section
        className="metrics grid grid-cols-2 rounded-[7px] bg-surface mb-8.5 border border-border border-solid room:grid-cols-4"
        aria-label="Workflow metrics"
      >
        {[
          {
            label: "Active remediations",
            value: overview?.metrics.active,
            color: "orange" as const,
          },
          {
            label: "Open nodes",
            value: overview?.metrics.open,
            color: "neutral" as const,
          },
          {
            label: "Needs you",
            value: overview?.metrics.needsYou,
            color: "amber" as const,
          },
          {
            label: "Resolved",
            value: overview?.metrics.resolved,
            color: "green" as const,
          },
        ].map((metric, i) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value ?? "—"}
            color={metric.color}
            index={i + 1}
          />
        ))}
      </section>
      {overview === undefined ? (
        <div
          className="
          empty-state panel bg-surface rounded-[7px] overflow-hidden flex flex-col items-center justify-center
          text-center min-h-90 px-[25px] py-17.5 border border-border border-solid gap-4.5
          [&>p:not(.eyebrow)]:max-w-110 [&>p:not(.eyebrow)]:text-muted [&>p:not(.eyebrow)]:leading-[1.9]
          [&_.eyebrow]:mb-0 [&_small]:text-muted [&_small]:text-[11px] [&_h2]:text-[29px]
          [&_h2]:tracking-[-1px]
        "
          role="status"
        >
          Loading your remediations…
        </div>
      ) : overview.graphs.length === 0 ? (
        <section
          className="
          empty-state panel bg-surface rounded-[7px] overflow-hidden flex flex-col items-center justify-center
          text-center min-h-90 px-[25px] py-17.5 border border-border border-solid gap-4.5
          [&>p:not(.eyebrow)]:max-w-110 [&>p:not(.eyebrow)]:text-muted [&>p:not(.eyebrow)]:leading-[1.9]
          [&_.eyebrow]:mb-0 [&_small]:text-muted [&_small]:text-[11px] [&_h2]:text-[29px]
          [&_h2]:tracking-[-1px]
        "
        >
          <span className="empty-symbol text-accent text-[38px]">↳</span>
          <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
            A CLEAR PATH TO RESOLUTION
          </p>
          <h2>Start with one finding.</h2>
          <p>
            Create the Emergency Lighting Failure demo to move a real dependency
            graph from blocked work to human verification.
          </p>
          <Button disabled={creating} onClick={() => void create()}>
            Create your first demo graph →
          </Button>
          <small>
            Explicit demo actions. Real workflow state. No external services
            used by the demo.
          </small>
        </section>
      ) : (
        <div
          className="
          workspace grid grid-cols-1 items-start gap-4 room:grid-cols-[180px_minmax(0,_1fr)]
          wide:grid-cols-[205px_minmax(0,_1fr)] wide:gap-6
        "
        >
          <aside
            className="
            graph-list [&_nav]:max-h-155 [&_nav]:overflow-y-auto [&_nav]:flex [&_nav]:overflow-x-auto
            [&_nav]:gap-2.5 room:[&_nav]:block room:[&_nav]:[overflow-x:revert-layer]
            room:[&_nav]:gap-[normal]
          "
          >
            <div
              className="
              section-label text-[10px] font-semibold tracking-[1.4px] text-muted flex justify-between mt-1
              mb-4 mx-0 gap-2 [&>span]:text-foreground
            "
            >
              REMEDIATIONS <span>{overview.graphs.length}</span>
            </div>
            <nav aria-label="Remediation graphs">
              {overview.graphs.map((graph) => (
                <button
                  className={`
                    graph-choice w-full text-left bg-transparent rounded-[5px] mb-2 min-w-55 max-w-62.5 px-3
                    py-3.5 border border-transparent border-solid room:min-w-[revert-layer] room:max-w-none
                    [&.selected]:bg-accent-soft [&.selected]:border-accent-border
                    [&:hover]:border-accent-border ${graph._id === graphId ? "selected" : ""}
                  `}
                  key={graph._id}
                  onClick={() => setSelected(graph._id)}
                  aria-current={graph._id === graphId ? "true" : undefined}
                >
                  <span className="graph-choice-title text-[13px] font-[550] block leading-[1.5] mb-3">
                    {graph.title}
                  </span>
                  <span className="graph-choice-meta flex items-center justify-between text-[10px] text-muted">
                    <Badge status={graph.status} />
                    <span>
                      {graph.isDemo ? "Demo" : "Inspection"} · #
                      {graph._id.slice(-5)}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
            <p
              className="
              principle pt-5.5 border-t border-t-border text-muted text-[12px] leading-[1.8] hidden mx-2.5
              my-8 room:block [&_strong]:text-foreground [&_strong]:font-medium
            "
            >
              Resolved means
              <br />
              <strong>proven, not reported.</strong>
            </p>
          </aside>
          {graphId && <GraphWorkspace key={graphId} graphId={graphId} />}
        </div>
      )}
      <footer className="app-footer flex justify-between mt-9.5 pt-5.5 border-t border-t-border text-[10px] text-muted flex-col gap-[15px] room:flex-row">
        <span>Resolve / Remediation infrastructure</span>
        <span>Human judgment at every critical decision.</span>
      </footer>
    </main>
  );
}

// Levels arrange the view only. Executability always comes from Convex status.
function displayLevels(nodes: Node[], edges: Edge[]) {
  const remaining = new Map(nodes.map((node) => [node._id, node]));
  const placed = new Set<Id<"graphNodes">>();
  const levels: Node[][] = [];
  while (remaining.size) {
    const level = [...remaining.values()].filter((node) =>
      edges
        .filter((edge) => edge.toNodeId === node._id)
        .every((edge) => placed.has(edge.fromNodeId)),
    );
    if (!level.length) {
      levels.push([...remaining.values()]);
      break;
    }
    levels.push(level);
    for (const node of level) {
      remaining.delete(node._id);
      placed.add(node._id);
    }
  }
  return levels;
}

function GraphWorkspace({ graphId }: { graphId: Id<"remediationGraphs"> }) {
  const data = useQuery(api.remediation.graphs.detail, { graphId });
  const completeHuman = useMutation(api.remediation.nodes.completeHuman);
  const simulate = useMutation(api.remediation.nodes.simulateDemo);
  const [pending, setPending] = useState<Id<"graphNodes"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function complete(node: Node) {
    setPending(node._id);
    setError(null);
    try {
      await (node.executionPolicy === "HUMAN" ? completeHuman : simulate)({
        nodeId: node._id,
      });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(null);
    }
  }
  if (!data)
    return (
      <section
        className="
        panel empty-state bg-surface rounded-[7px] overflow-hidden flex flex-col items-center justify-center
        text-center min-h-90 px-[25px] py-17.5 border border-border border-solid gap-4.5
        [&>p:not(.eyebrow)]:max-w-110 [&>p:not(.eyebrow)]:text-muted [&>p:not(.eyebrow)]:leading-[1.9]
        [&_.eyebrow]:mb-0 [&_small]:text-muted [&_small]:text-[11px] [&_h2]:text-[29px] [&_h2]:tracking-[-1px]
      "
        role="status"
      >
        Loading remediation graph…
      </section>
    );
  const { graph, nodes, edges, events } = data;
  const completed = nodes.filter((node) => node.status === "COMPLETED").length;
  const ready = nodes.filter((node) => node.status === "READY");
  const verification = nodes.find((node) => node.type === "VERIFICATION");
  const predecessors = (node: Node) =>
    edges
      .filter((edge) => edge.toNodeId === node._id)
      .map((edge) => nodes.find((item) => item._id === edge.fromNodeId))
      .filter((item): item is Node => !!item);
  const canSimulate = (node: Node) =>
    !!graph.isDemo &&
    (node.executionPolicy === "SYSTEM" || node.executionPolicy === "EXTERNAL");
  const buttonLabel = (node: Node) =>
    node.type === "VERIFICATION"
      ? "Verify repair & resolve"
      : node.title === "Approve quote"
        ? "Approve quote"
        : "Confirm complete";
  return (
    <div
      className="
      graph-workspace grid grid-cols-1 items-start min-w-0 gap-5 wide:grid-cols-[minmax(0,_1fr)_280px]
      xl:grid-cols-[minmax(0,_1fr)_320px]
    "
    >
      <section
        className="panel graph-panel bg-surface rounded-[7px] overflow-hidden border border-border border-solid"
        aria-label="Dependency graph"
      >
        <div className="panel-heading pt-4.5 pb-0 flex justify-between items-start px-4.5 gap-3 room:pt-6 room:px-6">
          <div>
            <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
              REMEDIATION GRAPH {graph.isDemo && " / DEMO"}
            </p>
            <h2>{graph.title}</h2>
            {graph.inspectionId && (
              <Link
                className="mt-2 inline-block text-xs underline underline-offset-4"
                href={`/app/inspections/${graph.inspectionId}`}
              >
                View source inspection & confirmed finding →
              </Link>
            )}
          </div>
          <Badge status={graph.status} />
        </div>
        <div className="graph-summary flex justify-between text-[11px] text-muted pt-5 pb-3 px-6 gap-3">
          <span>
            {completed} of {nodes.length} nodes complete
          </span>
          <span className="live-indicator inline-flex items-center text-[10px] text-muted whitespace-nowrap gap-1.5">
            <span
              className="
              dot dot-green inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
              [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success
            "
            />
            Live workflow
          </span>
        </div>
        <progress
          className="
            workflow-progress appearance-none block w-[calc(100%_-_48px)] h-[3px] mt-0 mb-5 rounded-[2px]
            bg-border mx-6 border-0 border-solid [&::-webkit-progress-bar]:bg-border
            [&::-webkit-progress-value]:bg-success [&::-moz-progress-bar]:bg-success
          "
          value={completed}
          max={nodes.length || 1}
          aria-label="Completed workflow nodes"
        />
        {graph.isDemo && (
          <p
            className="
            demo-notice bg-subtle border-t border-t-border border-b border-b-border text-muted text-[11px]
            leading-[1.7] px-6 py-3 [&_strong]:text-foreground [&_strong]:font-[550]
          "
          >
            <strong>Development demo.</strong> Contractor contact, quotes and
            repairs are simulated. Human approvals and verification require your
            explicit action.
          </p>
        )}
        {error && (
          <p
            className="
            error-banner bg-danger-soft text-danger-ink rounded-[5px] leading-[1.6] text-[13px] mx-0 my-4
            p-3.5 border border-danger-border border-solid
          "
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="dag [background-image:radial-gradient(var(--color-border)_0.7px,_transparent_0.7px)] [background-size:14px_14px] p-4.5 room:p-6">
          {displayLevels(nodes, edges).map((level, index) => (
            <div className="dag-stage" key={level[0]._id}>
              {index > 0 && (
                <div
                  className="
                  stage-connector flex flex-col items-center justify-center min-h-[33px] text-line text-[20px]
                  leading-[1.3] [&_span]:text-[8px] [&_span]:tracking-[1px] [&_span]:text-muted
                  [&_span]:pb-1.5
                "
                  aria-hidden="true"
                >
                  ↓{level.length > 1 && <span>PARALLEL CHECKS</span>}
                  {level.length === 1 && predecessors(level[0]).length > 1 && (
                    <span>ALL DEPENDENCIES REQUIRED</span>
                  )}
                </div>
              )}
              <div
                className={`
                  dag-level grid grid-cols-1 gap-3 [&.dag-parallel]:grid-cols-1
                  [&.dag-parallel]:border-l-[2px] [&.dag-parallel]:border-l-border [&.dag-parallel]:pl-2.5
                  room:[&.dag-parallel]:grid-cols-2 room:[&.dag-parallel]:border-l-0
                  room:[&.dag-parallel]:border-l-current room:[&.dag-parallel]:pl-0 ${level.length > 1 ? "dag-parallel" : ""}
                `}
              >
                {level.map((node) => (
                  <article
                    className={`
                      node bg-surface rounded-[6px] scroll-mt-6 min-w-0 p-[15px] border border-border
                      border-solid [&.node-ready]:shadow-[inset_3px_0_var(--color-accent)]
                      [&.node-ready]:border-accent-border [&.node-completed]:border-success-border [&_h3]:flex
                      [&_h3]:items-baseline [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:leading-[1.5]
                      [&_h3]:mt-3 [&_h3]:gap-2.5 [&.node-completed_.node-marker]:text-success node-${node.status.toLowerCase()}
                    `}
                    id={`node-${node._id}`}
                    key={node._id}
                  >
                    <div className="node-topline flex justify-between items-center gap-1.5">
                      <span className="node-type text-[9px] text-muted tracking-[0.6px]">
                        {node.type.replaceAll("_", " ")}
                      </span>
                      <Badge status={node.status} />
                    </div>
                    <h3>
                      <span
                        className="node-marker text-muted text-[10px] font-mono shrink-0"
                        aria-hidden="true"
                      >
                        {node.status === "COMPLETED"
                          ? "✓"
                          : String(nodes.indexOf(node) + 1).padStart(2, "0")}
                      </span>
                      {node.title}
                    </h3>
                    <p className="node-description text-[11px] leading-[1.65] text-muted mt-2 mb-[13px] mx-0">
                      {node.description}
                    </p>
                    <div
                      className="
                      dependencies flex flex-wrap text-[9px] items-baseline leading-[1.6] gap-[5px]
                      [&>span:first-child]:text-muted [&>span:first-child]:mr-[3px] [&_a]:rounded-[3px]
                      [&_a]:bg-background [&_a]:px-[5px] [&_a]:py-0.5 [&_a]:border [&_a]:border-border
                      [&_a]:border-solid [&_a:hover]:underline [&_.dependency-done]:text-success
                    "
                    >
                      <span>Requires</span>
                      {predecessors(node).length ? (
                        predecessors(node).map((parent) => (
                          <a
                            key={parent._id}
                            href={`#node-${parent._id}`}
                            className={
                              parent.status === "COMPLETED"
                                ? "dependency-done"
                                : ""
                            }
                          >
                            {parent.status === "COMPLETED" ? "✓" : "↳"}{" "}
                            {parent.title}
                          </a>
                        ))
                      ) : (
                        <span className="root-label text-muted">
                          None · entry point
                        </span>
                      )}
                    </div>
                    <div className="node-bottom mt-[13px] pt-[11px] border-t border-t-section flex flex-wrap justify-between items-center gap-2.5">
                      <span className="policy text-[9px] font-medium tracking-[0.6px] text-muted">
                        {node.executionPolicy === "HUMAN" ? "◎" : "◇"}{" "}
                        {node.executionPolicy.replaceAll("_", " ")}
                      </span>
                      {node.status === "READY" &&
                        graph.status === "ACTIVE" &&
                        !node.coordinationRole &&
                        (node.executionPolicy === "HUMAN" ||
                          canSimulate(node)) && (
                          <Button
                            size="small"
                            variant={
                              node.executionPolicy === "HUMAN"
                                ? "primary"
                                : "demo"
                            }
                            disabled={pending !== null}
                            onClick={() => void complete(node)}
                          >
                            {pending === node._id
                              ? "Saving…"
                              : node.executionPolicy === "HUMAN"
                                ? buttonLabel(node)
                                : "DEMO · Simulate completion"}
                          </Button>
                        )}
                      {node.status === "READY" &&
                        node.coordinationRole &&
                        (node.coordinationRole === "CONTACT" ||
                        node.coordinationRole === "APPROVAL" ? (
                          <a
                            className="text-xs text-accent-ink underline underline-offset-4"
                            href="#vendor-coordination"
                          >
                            {node.coordinationRole === "CONTACT"
                              ? "Contact vendor →"
                              : "Review quote →"}
                          </a>
                        ) : (
                          <Badge status="WAITING_EXTERNAL" />
                        ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <div
            className="
            stage-connector flex flex-col items-center justify-center min-h-[33px] text-line text-[20px]
            leading-[1.3] [&_span]:text-[8px] [&_span]:tracking-[1px] [&_span]:text-muted [&_span]:pb-1.5
          "
            aria-hidden="true"
          >
            ↓
          </div>
          <div
            className={`
              resolution-gate flex items-center rounded-[5px] bg-background text-muted p-[17px] border
              border-line-strong border-dashed gap-3.5 [&>span]:text-[21px] [&_strong]:text-[12px]
              [&_strong]:font-[550] [&_p]:text-[10px] [&_p]:leading-[1.7] [&_p]:mt-[3px]
              [&.is-resolved]:bg-success-soft [&.is-resolved]:text-success
              [&.is-resolved]:border-success-border [&.is-resolved]:border-solid ${graph.status === "RESOLVED" ? "is-resolved" : ""}
            `}
          >
            <span>{graph.status === "RESOLVED" ? "✓" : "◎"}</span>
            <div>
              <strong>
                {graph.status === "RESOLVED"
                  ? "Verified & resolved"
                  : "Resolution requires human verification"}
              </strong>
              <p>
                {graph.status === "RESOLVED"
                  ? "Every dependency is complete. Human verification is recorded."
                  : "Completing actions alone never closes this remediation."}
              </p>
            </div>
          </div>
        </div>
      </section>
      <aside className="context-column grid grid-cols-1 gap-5 room:grid-cols-2 wide:grid-cols-[none]">
        {graph.findingId && !graph.isDemo && (
          <VendorCoordination graph={graph} nodes={nodes} />
        )}
        <section
          className="
          panel next-actions bg-surface rounded-[7px] overflow-hidden p-5 border border-border border-solid
          [&_h2]:text-[18px] [&_h2]:leading-[1.45] [&_h2]:mb-4
        "
        >
          <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
            PATH TO CLEARANCE
          </p>
          <h2>What is preventing resolution?</h2>
          {graph.status === "RESOLVED" ? (
            <p className="resolved-message text-[12px] leading-[1.8] text-success">
              Nothing outstanding. The terminal verification has been completed
              by a human.
            </p>
          ) : (
            <>
              {verification && verification.status === "BLOCKED" && (
                <p className="blocker-message bg-blocker-soft border-l-[2px] border-l-danger text-[12px] leading-[1.75] mb-[23px] text-blocker-ink p-3">
                  Verify repair is blocked until{" "}
                  {predecessors(verification)
                    .filter((node) => node.status !== "COMPLETED")
                    .map((node) => `“${node.title}”`)
                    .join(" and ")}{" "}
                  {predecessors(verification).filter(
                    (node) => node.status !== "COMPLETED",
                  ).length > 1
                    ? "are"
                    : "is"}{" "}
                  complete.
                </p>
              )}
              <p
                className="
                section-label text-[10px] font-semibold tracking-[1.4px] text-muted flex justify-between mt-1
                mb-4 mx-0 gap-2 [&>span]:text-foreground
              "
              >
                AVAILABLE NOW <span>{ready.length}</span>
              </p>
              {ready.map((node) => (
                <a
                  className="
                    next-action flex items-baseline border-t border-t-border px-0 py-[13px] gap-2.5
                    [&_strong]:text-[12px] [&_strong]:font-[550] [&_p]:text-[11px] [&_p]:leading-[1.6]
                    [&_p]:text-muted [&_p]:mt-1 [&>span:last-child]:ml-auto
                  "
                  key={node._id}
                  href={`#node-${node._id}`}
                >
                  <span
                    className={`
                      dot inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
                      [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success ${node.executionPolicy === "HUMAN" ? "dot-amber" : "dot-orange"}
                    `}
                  />
                  <div>
                    <strong>{node.title}</strong>
                    <p>
                      {node.executionPolicy === "HUMAN"
                        ? "Waiting for your explicit confirmation."
                        : canSimulate(node)
                          ? "Ready for a development simulation."
                          : "Waiting for trusted execution."}
                    </p>
                  </div>
                  <span>↗</span>
                </a>
              ))}
              {!ready.length && (
                <p className="muted text-muted leading-[1.7]">
                  No eligible nodes. Review the remaining dependencies.
                </p>
              )}
            </>
          )}
        </section>
        <section className="panel activity-panel bg-surface rounded-[7px] overflow-hidden p-5 border border-border border-solid">
          <div className="activity-heading flex justify-between items-center">
            <div>
              <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
                AUDIT TRAIL
              </p>
              <h2>Activity</h2>
            </div>
            <span className="live-indicator inline-flex items-center text-[10px] text-muted whitespace-nowrap gap-1.5">
              <span
                className="
                dot dot-green inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
                [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success
              "
              />
              Live
            </span>
          </div>
          <p className="activity-caption text-[10px] text-muted mt-3 mb-5.5 mx-0">
            Latest 100 events · recorded by the engine
          </p>
          <ol
            className="
            activity-list list-none max-h-90 overflow-y-auto m-0 p-0 wide:max-h-162.5 [&_li]:flex
            [&_li]:relative [&_li]:pb-[21px] [&_li]:gap-[11px] [&_li:not(:last-child)::before]:content-['']
            [&_li:not(:last-child)::before]:absolute [&_li:not(:last-child)::before]:left-[3px]
            [&_li:not(:last-child)::before]:top-3 [&_li:not(:last-child)::before]:bottom-0
            [&_li:not(:last-child)::before]:w-[1px] [&_li:not(:last-child)::before]:bg-border
            [&_strong]:font-mono [&_strong]:text-[10px] [&_strong]:font-medium [&_strong]:wrap-anywhere
            [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:mx-0 [&_p]:my-1 [&_small]:text-[8px]
            [&_small]:text-muted
          "
          >
            {events.map((event) => (
              <li key={event._id}>
                <span
                  className={`
                    event-dot w-[7px] h-[7px] bg-surface rounded-full mt-[5px] shrink-0 z-1 border border-line
                    border-solid [&.event-success]:bg-success [&.event-success]:border-success ${event.type === "graph.resolved" ? "event-success" : ""}
                  `}
                />
                <div>
                  <strong>{event.type}</strong>
                  <p>
                    {nodes.find((node) => node._id === event.nodeId)?.title ??
                      graph.title}
                  </p>
                  <small>
                    {event.actorType}
                    {event.metadata?.simulation === true
                      ? " · DEMO SIMULATION"
                      : ""}{" "}
                    ·{" "}
                    <time dateTime={new Date(event.createdAt).toISOString()}>
                      {new Date(event.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </time>
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
