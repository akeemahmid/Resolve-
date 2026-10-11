"use client";

import { useState } from "react";

type PreviewState = "complete" | "ready" | "human" | "locked";
const stages = [
  {
    label: "Approval",
    completed: 2,
    note: "The quote is in. Repair waits for a human to approve it.",
  },
  {
    label: "Repair",
    completed: 4,
    note: "Repair is complete. Evidence and the functional test can now run in parallel.",
  },
  {
    label: "Evidence",
    completed: 5,
    note: "Evidence alone is not enough. Verification still requires the functional test.",
  },
  {
    label: "Verify",
    completed: 6,
    note: "Both dependencies are complete. A human can now verify the repair.",
  },
  {
    label: "Resolved",
    completed: 7,
    note: "The repair is verified. Only now is the remediation resolved.",
  },
];

function GraphEdge() {
  return (
    <span
      className="
        lp-graph-edge relative block h-3 w-px bg-line after:absolute after:bottom-0 after:-left-0.5
        after:size-[5px] after:rotate-45 after:border-r after:border-b after:border-line after:content-['']
      "
      aria-hidden="true"
    />
  );
}

function PreviewNode({
  title,
  state,
  human = false,
}: {
  title: string;
  state: PreviewState;
  human?: boolean;
}) {
  return (
    <div
      className={`
      lp-graph-node w-full min-h-8.5 rounded-[4px] flex items-center bg-surface text-[10px] font-medium
      [transition:background_0.25s,_border-color_0.25s] px-2.5 py-2 border border-border border-solid
      gap-[7px] sm:text-[11px] sm:gap-[9px] md:text-[9px] lg:text-[10px] [&_small]:ml-auto [&_small]:font-mono
      [&_small]:text-[6.5px] [&_small]:font-normal [&_small]:tracking-[0.15px] [&_small]:whitespace-nowrap
      sm:[&_small]:text-[7px] [&.lp-graph-complete]:border-success-border
      [&.lp-graph-complete_.lp-graph-symbol]:text-success [&.lp-graph-complete_small]:text-success
      [&.lp-graph-locked]:text-subdued [&.lp-graph-locked]:bg-subtle [&.lp-graph-ready]:bg-accent-soft
      [&.lp-graph-ready]:border-warning-border [&.lp-graph-human]:bg-warning-soft
      [&.lp-graph-human]:motion-safe:animate-[resolve-human-pulse_1.5s_ease-out_3]
      [&.lp-graph-human]:border-warning-border [&.lp-graph-human_.lp-graph-symbol]:text-warning-ink
      [&.lp-graph-human_small]:text-warning-ink lp-graph-${state}
    `}
    >
      <span
        className="lp-graph-symbol text-[12px] w-[13px] text-center shrink-0"
        aria-hidden="true"
      >
        {state === "complete"
          ? "✓"
          : state === "locked"
            ? "·"
            : human
              ? "◎"
              : "↗"}
      </span>
      <span>{title}</span>
      <small>
        {state === "complete"
          ? "COMPLETED"
          : state === "locked"
            ? "LOCKED"
            : human
              ? "HUMAN · READY"
              : "READY"}
      </small>
    </div>
  );
}

export function RemediationPreview() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = stages[stageIndex];
  function state(index: number, human = false): PreviewState {
    if (index < stage.completed) return "complete";
    if (index === stage.completed || (stage.completed === 4 && index === 5))
      return human ? "human" : "ready";
    return "locked";
  }
  return (
    <figure
      className="
      lp-graph-preview min-w-0 bg-surface rounded-[7px] shadow-[0_14px_40px_-28px_#39392950]
      motion-safe:animate-[resolve-enter_0.8s_ease-out_both] w-[min(100%,_590px)] justify-self-center m-0
      border border-border border-solid md:w-auto md:justify-self-auto
    "
      aria-labelledby="graph-preview-title"
    >
      <div
        className="
        lp-graph-chrome flex items-center justify-between border-b border-b-border font-mono text-[7px]
        tracking-[1px] text-muted-strong px-3.5 py-3 gap-3 sm:text-[8px] sm:px-5 sm:py-[13px]
        [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-[7px]
      "
      >
        <span>
          <span className="lp-small-square w-1.5 h-1.5 inline-block bg-accent shrink-0" />{" "}
          REMEDIATION GRAPH
        </span>
        <span>EXAMPLE / 01</span>
      </div>
      <div
        className="
        lp-graph-intro flex justify-between items-center pt-[17px] pb-3 px-3.5 gap-2.5 sm:pt-5 sm:px-5.5
        [&_p]:text-[8px] [&_p]:tracking-[1px] [&_p]:text-muted-strong [&_p]:mb-[7px] [&_h2]:text-[15px]
        [&_h2]:tracking-[-0.3px] [&_h2]:font-[550] sm:[&_h2]:text-[19px] sm:[&_h2]:tracking-[-0.45px]
        md:[&_h2]:text-[16px]
      "
      >
        <div>
          <p>FIRE SAFETY FINDING</p>
          <h2 id="graph-preview-title">Emergency lighting failure</h2>
        </div>
        <span
          className={`
            lp-graph-status text-[8px] tracking-[0.6px] bg-accent-soft text-accent-ink rounded-[2px] px-[7px]
            py-[5px] [&.is-complete]:bg-success-soft [&.is-complete]:text-success-ink ${stage.completed === 7 ? "is-complete" : ""}
          `}
        >
          {stage.completed === 7 ? "RESOLVED" : "ACTIVE"}
        </span>
      </div>
      <div className="lp-graph-count flex justify-between text-muted-strong text-[8px] px-3.5 gap-2.5 sm:text-[9px] sm:px-5.5">
        <span>{stage.completed} / 7 steps complete</span>
        <span>Clearance requires verification</span>
      </div>
      <div
        className="
        lp-preview-progress mt-2.5 mb-0 h-0.5 bg-border mx-3.5 sm:mx-5.5 [&_span]:block [&_span]:h-full
        [&_span]:bg-success [&_span]:[transition:width_0.45s_ease]
      "
        aria-hidden="true"
      >
        <span style={{ width: `${(stage.completed / 7) * 100}%` }} />
      </div>
      <div
        className="
        lp-graph-canvas flex flex-col items-center
        [background-image:radial-gradient(var(--color-border)_0.7px,_transparent_0.7px)]
        [background-size:12px_12px] px-3.5 py-[17px] sm:px-10 sm:py-5 md:px-5.5 lg:px-9
      "
      >
        <PreviewNode title="Contact contractor" state={state(0)} />
        <GraphEdge />
        <PreviewNode title="Receive quote" state={state(1)} />
        <GraphEdge />
        <PreviewNode title="Approve quote" state={state(2, true)} human />
        <GraphEdge />
        <PreviewNode title="Perform repair" state={state(3)} />
        <div
          className="
          lp-fork grid grid-cols-2 w-[calc(50%_+_8px)] h-5.5 [&_span]:border-t [&_span]:border-t-line
          [&_span]:mt-2.5 [&_span]:relative [&_span:first-child]:border-l [&_span:first-child]:border-l-line
          [&_span:first-child]:rounded-tl-[4px] [&_span:last-child]:border-r [&_span:last-child]:border-r-line
          [&_span:last-child]:rounded-tr-[4px] [&_span:first-child::after]:content-['']
          [&_span:first-child::after]:absolute [&_span:first-child::after]:h-2.5
          [&_span:first-child::after]:w-[1px] [&_span:first-child::after]:bg-line
          [&_span:first-child::after]:right-0 [&_span:first-child::after]:top-[-10px]
        "
          aria-hidden="true"
        >
          <span />
          <span />
        </div>
        <div
          className="
          lp-parallel grid grid-cols-2 w-full gap-2.5 sm:gap-4 [&_.lp-graph-node]:flex-wrap
          [&_.lp-graph-node]:px-1.5 [&_.lp-graph-node]:py-2 [&_.lp-graph-node]:gap-[3px]
          sm:[&_.lp-graph-node]:px-2 sm:[&_.lp-graph-node]:gap-1
          [&_.lp-graph-node>span:nth-child(2)]:text-[8px] sm:[&_.lp-graph-node>span:nth-child(2)]:text-[9px]
          [&_.lp-graph-node_small]:basis-full [&_.lp-graph-node_small]:ml-[17px]
          [&_.lp-graph-node_small]:text-[7px]
        "
        >
          <PreviewNode title="Collect evidence" state={state(4, true)} human />
          <PreviewNode title="Functional test" state={state(5, true)} human />
        </div>
        <div
          className="
          lp-fork lp-merge grid grid-cols-2 w-[calc(50%_+_8px)] h-[19px] [transform:rotate(180deg)]
          [&_span]:border-t [&_span]:border-t-line [&_span]:mt-2.5 [&_span]:relative
          [&_span:first-child]:border-l [&_span:first-child]:border-l-line
          [&_span:first-child]:rounded-tl-[4px] [&_span:last-child]:border-r [&_span:last-child]:border-r-line
          [&_span:last-child]:rounded-tr-[4px] [&_span:first-child::after]:content-['']
          [&_span:first-child::after]:absolute [&_span:first-child::after]:h-2.5
          [&_span:first-child::after]:w-[1px] [&_span:first-child::after]:bg-line
          [&_span:first-child::after]:right-0 [&_span:first-child::after]:top-[-10px]
        "
          aria-hidden="true"
        >
          <span />
          <span />
        </div>
        <div className="lp-join-label font-mono text-[6.5px] text-muted-strong tracking-[0.7px] pt-1 pb-[7px] px-0">
          BOTH DEPENDENCIES REQUIRED
        </div>
        <PreviewNode title="Verify repair" state={state(6, true)} human />
        <GraphEdge />
        <div
          className={`
            lp-clearance w-full flex items-center rounded-[4px] text-[9px] text-muted-strong bg-background
            px-2.5 py-2 border border-line border-dashed gap-2 sm:text-[10px] [&_small]:ml-auto
            [&_small]:font-mono [&_small]:text-[6px] sm:[&_small]:text-[6.5px] [&.is-complete]:bg-success-soft
            [&.is-complete]:text-success-ink [&.is-complete]:border [&.is-complete]:border-line-strong
            [&.is-complete]:border-solid ${stage.completed === 7 ? "is-complete" : ""}
          `}
        >
          <span aria-hidden="true">{stage.completed === 7 ? "✓" : "◎"}</span>{" "}
          {stage.completed === 7 ? "Verified resolution" : "Clearance gate"}
          <small>
            {stage.completed === 7 ? "HUMAN VERIFIED" : "LOCKED UNTIL VERIFIED"}
          </small>
        </div>
      </div>
      <div
        className="
          lp-stage-controls grid grid-cols-[repeat(5,_minmax(0,_1fr))] border-t border-t-border
          [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:min-h-11
          [&_button]:bg-subtle [&_button]:border-t-0 [&_button]:border-r [&_button]:border-b-[2px]
          [&_button]:border-l-0 [&_button]:border-r-border [&_button]:border-b-transparent
          [&_button]:text-muted-strong [&_button]:text-[8px] [&_button]:flex-col [&_button]:px-0.5
          [&_button]:py-[7px] [&_button]:border-solid [&_button]:gap-[3px] sm:[&_button]:min-h-[41px]
          sm:[&_button]:text-[9px] sm:[&_button]:flex-row sm:[&_button]:p-0 sm:[&_button]:gap-[5px]
          [&_button:last-child]:border-r-0 [&_button_span]:text-subdued [&_button_span]:text-[7px]
          [&_button_span]:font-mono [&_button[aria-pressed='true']]:bg-accent-soft
          [&_button[aria-pressed='true']]:text-accent-ink [&_button[aria-pressed='true']]:border-b-accent
          [&_button:hover]:bg-section [&_button:focus-visible]:outline-offset-[-4px]
        "
        role="group"
        aria-label="Explore example workflow stages"
      >
        {stages.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={index === stageIndex}
            onClick={() => setStageIndex(index)}
          >
            <span>0{index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>
      <figcaption
        className="
        lp-graph-caption border-t border-t-border min-h-28.5 px-3.5 py-3 sm:pt-3.5 sm:pb-4 sm:min-h-26 sm:px-5
        [&_p]:text-[10px] [&_p]:leading-[1.6] [&_p]:mt-[5px] [&_p]:min-h-[35px] sm:[&_p]:text-[11px]
        [&>small]:block [&>small]:text-[8px] [&>small]:text-muted-strong [&>small]:mt-[5px]
        sm:[&>small]:text-[9px]
      "
      >
        <span className="lp-caption-label font-mono tracking-[0.8px] text-[7px] text-muted-strong">
          INTERACTIVE EXAMPLE
        </span>
        <p aria-live="polite" aria-atomic="true">
          {stage.note}
        </p>
        <small>
          Illustrative states of the working demo. No live workflow is changed.
        </small>
      </figcaption>
    </figure>
  );
}
