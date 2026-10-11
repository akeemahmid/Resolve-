"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import {
  ErrorNotice,
  InspectionShell,
  InspectionStatus,
  fieldClass,
  inspectionError,
} from "@/components/InspectionUI";

type Fields = Pick<
  Doc<"findings">,
  | "title"
  | "description"
  | "severity"
  | "category"
  | "location"
  | "requirement"
  | "recommendedAction"
>;
export default function InspectionPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const { inspectionId } = use(params);
  const { isAuthenticated } = useConvexAuth();
  return (
    <InspectionShell>
      <Link
        className="text-sm text-muted underline underline-offset-4"
        href="/app/inspections"
      >
        ← All inspections
      </Link>
      {isAuthenticated ? (
        <Review inspectionId={inspectionId as Id<"inspections">} />
      ) : (
        <p role="status" className="mt-8">
          Connecting to your workspace…
        </p>
      )}
    </InspectionShell>
  );
}
function Review({ inspectionId }: { inspectionId: Id<"inspections"> }) {
  const data = useQuery(api.inspections.documents.detail, { inspectionId });
  const analyze = useMutation(api.inspections.documents.analyze);
  const finishReview = useMutation(api.inspections.documents.finishReview);
  const createWorkflows = useMutation(api.inspections.findings.createWorkflows);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(action: () => Promise<unknown>) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (error) {
      setError(inspectionError(error));
    } finally {
      setPending(false);
    }
  }
  if (!data)
    return (
      <p role="status" className="mt-8">
        Loading inspection…
      </p>
    );
  const { inspection, findings, events } = data;
  const proposed = findings.filter((f) => f.reviewStatus === "PROPOSED").length;
  const confirmed = findings.filter(
    (f) => f.reviewStatus === "CONFIRMED",
  ).length;
  const rejected = findings.filter((f) => f.reviewStatus === "REJECTED").length;
  const ready =
    inspection.status === "REVIEW_REQUIRED" ||
    inspection.status === "CONFIRMED";
  const allLinked =
    confirmed > 0 &&
    findings
      .filter((f) => f.reviewStatus === "CONFIRMED")
      .every((f) => f.graphId);
  return (
    <>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
        <h1 className="min-w-0 break-words">{inspection.title}</h1>
        <InspectionStatus status={inspection.status} />
      </div>
      <p className="mt-4 break-words text-sm leading-7 text-muted">
        {[
          inspection.siteName,
          inspection.inspectionType,
          inspection.inspectionDate,
        ]
          .filter(Boolean)
          .join(" · ") || inspection.originalFilename}
      </p>
      {inspection.summary && (
        <p className="mt-4 leading-7">
          <span className="text-muted">Report summary · </span>
          {inspection.summary}
        </p>
      )}
      <ErrorNotice message={error ?? inspection.error ?? null} />
      {(inspection.status === "UPLOADED" || inspection.status === "FAILED") && (
        <Button
          className="mt-5"
          disabled={pending}
          onClick={() => void act(() => analyze({ inspectionId }))}
        >
          {pending
            ? "Starting…"
            : inspection.status === "FAILED"
              ? "Retry analysis"
              : "Analyze inspection"}
        </Button>
      )}
      {inspection.status === "ANALYZING" && (
        <div
          role="status"
          className="my-8 rounded-md border border-warning-border bg-warning-soft p-6"
        >
          <h2>Analyzing inspection…</h2>
          <p className="mt-3 leading-6 text-warning-ink">
            Resolve is reading your PDF and looking for explicit deficiencies.
            You can leave this page and return while analysis continues.
          </p>
        </div>
      )}
      {ready && (
        <>
          <section className="my-8 rounded-lg border border-warning-border bg-warning-soft p-5 sm:p-7">
            <p className="text-xs font-semibold tracking-widest text-warning-ink">
              YOUR REVIEW, YOUR AUTHORITY
            </p>
            <h2 className="mt-3">Confirm what should enter remediation.</h2>
            <p className="mt-3 leading-7 text-muted">
              Resolve found these possible deficiencies. Check each proposal
              against its source evidence. Extraction confidence is
              model-assessed, not a measured probability.
            </p>
            <p
              className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm"
              aria-live="polite"
            >
              <span>{proposed} proposed findings</span>
              <span className="text-success-ink">{confirmed} confirmed</span>
              <span>{rejected} rejected</span>
            </p>
          </section>
          {findings.length === 0 && (
            <div className="my-6 rounded-md border border-border bg-surface p-6">
              <h2>No explicit deficiencies found.</h2>
              <p className="mt-3 leading-7 text-muted">
                This is not a compliance determination. Review the original
                report before completing your review.
              </p>
            </div>
          )}
          <div className="space-y-5">
            {findings.map((finding) => (
              <Finding key={finding._id} finding={finding} />
            ))}
          </div>
          {proposed === 0 && (
            <section className="my-8 rounded-lg border border-success-border bg-success-soft p-6">
              <h2>
                {inspection.status === "CONFIRMED"
                  ? "Review complete."
                  : "Every proposal has been reviewed."}
              </h2>
              <p className="mt-3 text-sm leading-7">
                {confirmed} confirmed findings are eligible for remediation.
                Rejected findings remain in the audit trail.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {inspection.status !== "CONFIRMED" && (
                  <Button
                    disabled={pending}
                    onClick={() =>
                      void act(() => finishReview({ inspectionId }))
                    }
                  >
                    Complete review
                  </Button>
                )}
                {inspection.status === "CONFIRMED" &&
                  confirmed > 0 &&
                  !allLinked && (
                    <Button
                      disabled={pending}
                      onClick={() =>
                        void act(() => createWorkflows({ inspectionId }))
                      }
                    >
                      {pending ? "Creating…" : "Create remediation workflows"}
                    </Button>
                  )}
                {allLinked && (
                  <Link
                    className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
                    href="/app"
                  >
                    Open workflows in Control Room →
                  </Link>
                )}
              </div>
            </section>
          )}
        </>
      )}
      {events.length > 0 && (
        <details className="mt-8 border-t border-border pt-5">
          <summary className="cursor-pointer text-sm font-medium">
            Inspection activity · latest {events.length} events
          </summary>
          <ol className="mt-4 space-y-3 text-xs text-muted">
            {events.map((event) => (
              <li key={event._id} className="break-words">
                {event.type} · {new Date(event.createdAt).toLocaleString()}
                {event.actorId ? " · Human action" : " · Analysis system"}
                {event.before && (
                  <span className="mt-1 block">
                    Edited “{event.before.title}” → “{event.after?.title}”
                  </span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
}
function Finding({ finding }: { finding: Doc<"findings"> }) {
  const review = useMutation(api.inspections.findings.review);
  const edit = useMutation(api.inspections.findings.edit);
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Fields>(() => pickFields(finding));
  const [editVersion, setEditVersion] = useState(finding.updatedAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(action: () => Promise<unknown>) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (error) {
      setError(inspectionError(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <article
      className={`min-w-0 rounded-lg border bg-surface p-5 sm:p-7 ${finding.confidence === "LOW" && finding.reviewStatus === "PROPOSED" ? "border-warning-border" : "border-border"}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-section px-2 py-1">
          Severity: {finding.severity.toLowerCase()}
        </span>
        <span
          className={`rounded px-2 py-1 ${finding.reviewStatus === "CONFIRMED" ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink"}`}
        >
          {finding.reviewStatus.toLowerCase()}
        </span>
        <span
          className={
            finding.confidence === "LOW"
              ? "font-semibold text-warning-ink"
              : "text-muted"
          }
        >
          {finding.confidence.toLowerCase()} extraction confidence
          {finding.confidence === "LOW" ? " · check carefully" : ""}
        </span>
      </div>
      <h2 className="mt-4 break-words">{finding.title}</h2>
      <p className="mt-3 whitespace-pre-wrap break-words leading-7">
        {finding.description}
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        {(
          [
            ["Category", finding.category],
            ["Location", finding.location],
            ["Requirement", finding.requirement],
            ["Recommended action", finding.recommendedAction],
          ] as const
        ).map(
          ([label, value]) =>
            value && (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-words leading-6">{value}</dd>
              </div>
            ),
        )}
      </dl>
      <blockquote className="mt-5 border-l-2 border-accent bg-subtle p-4">
        <p className="text-xs font-medium text-muted">
          Source ·{" "}
          {finding.source.page
            ? `Page ${finding.source.page}`
            : "Page not identified"}
          {finding.source.section && ` · ${finding.source.section}`}
        </p>
        <p className="mt-2 break-words text-sm leading-7">
          “{finding.source.excerpt}”
        </p>
      </blockquote>
      {finding.editedAt && (
        <details className="mt-4 text-xs text-muted">
          <summary className="cursor-pointer">
            Edited by a human · view original AI proposal
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans leading-6">
            {JSON.stringify(finding.originalProposal, null, 2)}
          </pre>
        </details>
      )}
      <ErrorNotice message={error} />
      {editing && finding.reviewStatus === "PROPOSED" && (
        <form
          className="mt-5 space-y-4 border-t border-border pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              await edit({
                findingId: finding._id,
                fields,
                expectedUpdatedAt: editVersion,
              });
              setEditing(false);
            });
          }}
        >
          {(
            [
              ["title", "Title"],
              ["description", "Description"],
              ["category", "Category"],
              ["location", "Location"],
              ["requirement", "Requirement"],
              ["recommendedAction", "Recommended action"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-2 block">{label}</span>
              <textarea
                className={fieldClass}
                rows={key === "description" ? 3 : 2}
                required={key === "title" || key === "description"}
                maxLength={
                  key === "title" ? 200 : key === "description" ? 2000 : 1500
                }
                value={fields[key] ?? ""}
                onChange={(event) =>
                  setFields({
                    ...fields,
                    [key]:
                      event.target.value ||
                      (key === "title" || key === "description" ? "" : null),
                  })
                }
              />
            </label>
          ))}
          <label className="block text-sm">
            Severity
            <select
              className={`${fieldClass} mt-2`}
              value={fields.severity}
              onChange={(event) =>
                setFields({
                  ...fields,
                  severity: event.target.value as Fields["severity"],
                })
              }
            >
              {["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted">
            Saving an edit keeps this a proposal. Confirm it separately after
            review. The original evidence is preserved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending} type="submit">
              Save edit
            </Button>
            <Button
              disabled={pending}
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {finding.reviewStatus === "PROPOSED" && !editing && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            disabled={pending}
            onClick={() =>
              void act(() =>
                review({ findingId: finding._id, decision: "CONFIRMED" }),
              )
            }
          >
            Confirm finding
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setFields(pickFields(finding));
              setEditVersion(finding.updatedAt);
              setEditing(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void act(() =>
                review({ findingId: finding._id, decision: "REJECTED" }),
              )
            }
          >
            Reject
          </Button>
        </div>
      )}
      {finding.graphId && (
        <p className="mt-4 text-sm text-success-ink">
          Linked to remediation workflow #{finding.graphId.slice(-5)}
        </p>
      )}
    </article>
  );
}
function pickFields(finding: Doc<"findings">): Fields {
  const {
    title,
    description,
    category,
    severity,
    location,
    requirement,
    recommendedAction,
  } = finding;
  return {
    title,
    description,
    category,
    severity,
    location,
    requirement,
    recommendedAction,
  };
}
