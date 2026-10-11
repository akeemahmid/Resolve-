"use client";
import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "./Button";
import { fieldClass } from "./InspectionUI";
import { WorkflowBadge } from "./WorkflowBadge";

export function VendorCoordination({
  graph,
  nodes,
}: {
  graph: Doc<"remediationGraphs">;
  nodes: Doc<"graphNodes">[];
}) {
  const data = useQuery(api.coordination.domain.workspace, {
    graphId: graph._id,
  });
  const saveVendor = useMutation(api.coordination.domain.saveVendor);
  const enable = useMutation(api.coordination.domain.enable);
  const contact = useAction(api.coordination.transport.contact);
  const decide = useMutation(api.coordination.domain.decideQuote);
  const retry = useMutation(api.coordination.inbound.retry);
  const [vendorId, setVendorId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(fn: () => Promise<unknown>) {
    setPending(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ConvexError
          ? String(e.data)
          : "The request could not complete. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  if (!data) return <p role="status">Loading vendor coordination…</p>;
  const assigned = data.vendors.find((v) => v._id === graph.vendorId);
  const contactNode = nodes.find((n) => n.coordinationRole === "CONTACT");
  const approval = nodes.find((n) => n.coordinationRole === "APPROVAL");
  const outbound = data.communications.find((c) => c.direction === "OUTBOUND");
  const quote = data.quotes.find((q) => q.status === "RECEIVED");
  const canEnable =
    graph.status === "ACTIVE" &&
    nodes.length === 4 &&
    nodes.every((n) => ["READY", "BLOCKED"].includes(n.status));
  const sendBusy = outbound && ["QUEUED", "SENDING"].includes(outbound.status);
  return (
    <section
      id="vendor-coordination"
      aria-label="Vendor coordination"
      className="min-w-0 rounded-lg border border-border bg-surface p-5"
    >
      <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted">
        VENDOR COORDINATION
      </p>
      <h2 className="text-lg">
        {assigned ? assigned.name : "Bring a vendor into the workflow"}
      </h2>
      {error && (
        <p role="alert" className="my-3 text-sm text-danger-ink">
          {error}
        </p>
      )}
      {!graph.coordinationEnabled ? (
        canEnable ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const id = vendorId
                  ? (vendorId as Id<"vendors">)
                  : await saveVendor({ name, email });
                await enable({ graphId: graph._id, vendorId: id, currency });
              });
            }}
          >
            <p className="text-xs leading-6 text-muted">
              Add contact, quote and approval steps before corrective work. You
              review the finding before sending any email.
            </p>
            {data.vendors.length > 0 && (
              <label className="block text-xs">
                Vendor
                <select
                  className={`${fieldClass} mt-1`}
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">New vendor</option>
                  {data.vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} · {v.email}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!vendorId && (
              <>
                <label className="block text-xs">
                  Vendor name
                  <input
                    className={`${fieldClass} mt-1`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </label>
                <label className="block text-xs">
                  Vendor email
                  <input
                    type="email"
                    className={`${fieldClass} mt-1`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                  />
                </label>
              </>
            )}
            <label className="block text-xs">
              Request quotes in
              <select
                className={`${fieldClass} mt-1`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {["USD", "GBP", "EUR", "NGN", "CAD", "AUD"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <p className="text-xs leading-5 text-muted">
              A bare $ reply is interpreted in your selected dollar currency.
              Other currency ambiguity requires follow-up.
            </p>
            <Button disabled={pending} type="submit">
              Enable vendor coordination
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-xs leading-6 text-muted">
            Coordination can be enabled on an inspection workflow before work
            starts.
          </p>
        )
      ) : (
        <>
          <p className="mt-2 break-all text-xs text-muted">
            {assigned?.email} · Quotes requested in {graph.quoteCurrency}
          </p>
          {contactNode?.status === "READY" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs leading-6">
                Send the confirmed finding and site details to this vendor
                through Resend. Replies are interpreted by OpenAI; you retain
                approval and final verification.
              </p>
              {data.missingConfiguration.length > 0 && (
                <p
                  role="status"
                  className="rounded bg-warning-soft p-3 text-xs text-warning-ink"
                >
                  Email setup is incomplete. Ask the workspace operator to
                  finish the Resend setup.
                </p>
              )}
              <Button
                disabled={
                  pending || !!sendBusy || data.missingConfiguration.length > 0
                }
                onClick={() =>
                  void act(() =>
                    contact({ graphId: graph._id, nodeId: contactNode._id }),
                  )
                }
              >
                {sendBusy
                  ? "Sending request…"
                  : outbound?.status === "FAILED"
                    ? "Retry contact email"
                    : "Send contact email"}
              </Button>
            </div>
          )}
          {outbound?.status === "SENT" &&
            !quote &&
            graph.status === "ACTIVE" &&
            approval?.status !== "COMPLETED" && (
              <p
                role="status"
                className="mt-4 rounded border border-warning-border bg-warning-soft p-3 text-xs leading-6 text-warning-ink"
              >
                Waiting for a vendor quote. A reply can unlock your approval
                step; it cannot approve spending.
              </p>
            )}
          {quote && (
            <div
              aria-live="polite"
              className="mt-4 rounded border border-warning-border bg-warning-soft p-4"
            >
              <WorkflowBadge status="WAITING_HUMAN" />
              <h3 className="mt-3 font-semibold">Quote received — needs you</h3>
              <p className="mt-2 text-lg">
                {new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: quote.currency,
                }).format(quote.amount)}
              </p>
              <p className="mt-2 text-xs">
                {assigned?.name}
                {quote.availability ? ` · ${quote.availability}` : ""}
              </p>
              <blockquote className="my-3 break-words text-xs leading-6">
                “{quote.evidence}”
              </blockquote>
              <p className="mb-3 text-xs leading-5">
                Approval unlocks repair coordination. It sends no purchase order
                or payment.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  disabled={
                    pending ||
                    approval?.status !== "READY" ||
                    graph.status !== "ACTIVE"
                  }
                  onClick={() =>
                    void act(() =>
                      decide({ quoteId: quote._id, decision: "APPROVED" }),
                    )
                  }
                >
                  Approve quote
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={
                    pending ||
                    approval?.status !== "READY" ||
                    graph.status !== "ACTIVE"
                  }
                  onClick={() =>
                    void act(() =>
                      decide({ quoteId: quote._id, decision: "REJECTED" }),
                    )
                  }
                >
                  Reject / needs follow-up
                </Button>
              </div>
            </div>
          )}
          {data.quotes.some((q) => q.status === "APPROVED") && (
            <p className="mt-4 text-sm text-success-ink">
              Quote approved by you. Coordinate the repair using the next graph
              step.
            </p>
          )}
          {data.quotes.some((q) => q.status === "REJECTED") &&
            !quote &&
            approval?.status !== "COMPLETED" && (
              <p className="mt-3 text-xs leading-6 text-warning-ink">
                Quote rejected. Follow up with the vendor outside Resolve; a new
                reply to the original email can provide a revised quote.
              </p>
            )}
          {data.communications.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Communication timeline</h3>
              <ol className="mt-4 space-y-4">
                {[...data.communications].reverse().map((c) => (
                  <li
                    key={c._id}
                    className="min-w-0 border-l-2 border-border pl-3 text-xs leading-6"
                  >
                    <p className="text-muted">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                    <p className="font-medium">
                      {c.direction === "OUTBOUND"
                        ? "Contact request"
                        : "Vendor reply"}{" "}
                      · {c.status.toLowerCase().replaceAll("_", " ")}
                    </p>
                    {c.deliveryStatus && (
                      <p className="text-muted">
                        Email delivery: {c.deliveryStatus}
                      </p>
                    )}
                    {c.error && (
                      <p role="alert" className="text-danger-ink">
                        {c.error}
                      </p>
                    )}
                    {c.interpretation && (
                      <>
                        <p className="mt-2 font-semibold">
                          {c.interpretation.intent.replaceAll("_", " ")} ·{" "}
                          {c.interpretation.confidence.toLowerCase()} confidence
                        </p>
                        <p className="break-words">
                          {c.interpretation.summary}
                        </p>
                        {c.interpretation.questions.map((q, i) => (
                          <p key={i} className="break-words">
                            Question: {q}
                          </p>
                        ))}
                      </>
                    )}
                    {c.policyNote && (
                      <p className="mt-2 break-words text-warning-ink">
                        {c.policyNote}
                      </p>
                    )}
                    {c.attachments.length > 0 && (
                      <p className="mt-2 break-words">
                        Attachments:{" "}
                        {c.attachments.map((a) => a.filename).join(", ")}. Not
                        verified completion evidence.
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer">View message</summary>
                      <p className="my-2 break-words font-medium">
                        {c.subject}
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {c.textBody ||
                          "No supported plain-text body. Review in Resend."}
                      </p>
                    </details>
                    {data.events
                      .filter(
                        (e) =>
                          e.correlatedCommunicationId === c._id &&
                          e.status === "FAILED" &&
                          e.attempt < 3,
                      )
                      .map((e) => (
                        <Button
                          key={e._id}
                          size="small"
                          variant="secondary"
                          disabled={pending}
                          onClick={() =>
                            void act(() => retry({ eventId: e._id }))
                          }
                        >
                          Retry reply interpretation
                        </Button>
                      ))}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  );
}
