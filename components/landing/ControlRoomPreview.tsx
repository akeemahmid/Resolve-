import { MetricCard } from "@/components/MetricCard";
import { WorkflowBadge } from "@/components/WorkflowBadge";

export function ControlRoomPreview() {
  return (
    <figure
      className="
        lp-product-preview rounded-[6px] bg-background shadow-[0_18px_35px_-30px_#28281b66] overflow-hidden
        m-0 border border-line-strong border-solid [&_.metrics]:mb-[25px] [&_.metric]:p-3.5
        sm:[&_.metric]:px-5 sm:[&_.metric]:py-[17px] [&_.metric_strong]:text-[25px]
        sm:[&_.metric_strong]:text-[27px] [&_figcaption]:text-[9px] [&_figcaption]:text-muted-strong
        [&_figcaption]:leading-[1.7] [&_figcaption]:border-t [&_figcaption]:border-t-border
        [&_figcaption]:bg-surface [&_figcaption]:px-4.5 [&_figcaption]:py-[13px] sm:[&_figcaption]:text-[10px]
        sm:[&_figcaption]:px-8 sm:[&_figcaption]:py-[15px] [&_.metric_p]:text-[10px]
        sm:[&_.metric_p]:text-[12px]
      "
      aria-label="Illustrative Control Room preview after the demo repair step"
    >
      <div
        className="
        lp-product-bar flex items-center justify-between border-b border-b-border text-[8px] text-muted-strong
        px-[15px] py-3 gap-3 sm:text-[10px] sm:px-6 sm:py-3.5 [&>span:last-child]:text-[6px]
        [&>span:last-child]:tracking-[1px] [&>span:last-child]:font-mono sm:[&>span:last-child]:text-[8px]
      "
      >
        <span
          className="lp-window-dots text-line text-[6px] tracking-[2px] sm:text-[8px] sm:tracking-[4px]"
          aria-hidden="true"
        >
          ● ● ●
        </span>
        <span>Resolve / Control Room</span>
        <span>SAMPLE STATE</span>
      </div>
      <div className="lp-product-body p-4.5 sm:p-8">
        <div
          className="
          lp-product-heading flex justify-between items-center mb-[25px] gap-2.5 [&_h3]:text-[19px]
          [&_h3]:tracking-[-0.7px] [&_h3]:font-medium [&_h3]:leading-[1.2] sm:[&_h3]:text-[25px]
          sm:[&_h3]:leading-[inherit] [&_.eyebrow]:text-[7px] sm:[&_.eyebrow]:text-[10px]
        "
        >
          <div>
            <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
              FROM FINDING TO CLEARANCE
            </p>
            <h3>Remediation Control Room</h3>
          </div>
          <WorkflowBadge status="ACTIVE" />
        </div>
        <div className="metrics grid grid-cols-2 rounded-[7px] bg-surface mb-8.5 border border-border border-solid room:grid-cols-4">
          {[
            { label: "Active remediations", value: 1 },
            { label: "Open nodes", value: 3 },
            { label: "Needs you", value: 2 },
            { label: "Resolved", value: 0 },
          ].map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
        <div
          className="
          lp-product-columns grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4.5 md:grid-cols-[1.7fr_1fr]
          md:gap-[25px] [&_.node]:mb-2.5 [&_h4]:text-[13px] [&_h4]:font-[550] [&_h4]:mx-0 [&_h4]:my-2.5
          [&_.dependencies]:text-[10px] [&_aside]:rounded-[5px] [&_aside]:bg-surface [&_aside]:self-start
          [&_aside]:p-5.5 [&_aside]:border [&_aside]:border-border [&_aside]:border-solid
          [&_aside_h4]:text-[23px] [&_aside_h4]:leading-[1.25] [&_aside_h4]:tracking-[-0.5px]
          [&_aside_h4]:font-medium [&_aside>p:not(.eyebrow)]:text-[12px]
          [&_aside>p:not(.eyebrow)]:leading-[1.8] [&_aside>p:not(.eyebrow)]:text-muted-strong
          [&_aside>p:not(.eyebrow)]:mt-3.5
        "
        >
          <div>
            <p
              className="
              lp-product-graph-label flex justify-between text-[13px] mb-[15px] flex-col gap-2.5 md:flex-row
              [&>span]:text-[10px] [&>span]:text-muted-strong
            "
            >
              Emergency Lighting Failure <span>4 of 7 complete</span>
            </p>
            {[
              {
                title: "Collect completion evidence",
                status: "READY",
                requires: "Perform repair",
              },
              {
                title: "Confirm emergency lighting test",
                status: "READY",
                requires: "Perform repair",
              },
              {
                title: "Verify repair",
                status: "BLOCKED",
                requires: "Evidence + functional test",
              },
            ].map((node) => (
              <div
                className={`
                  node bg-surface rounded-[6px] scroll-mt-6 min-w-0 p-[15px] border border-border border-solid
                  [&.node-ready]:shadow-[inset_3px_0_var(--color-accent)] [&.node-ready]:border-accent-border
                  [&.node-completed]:border-success-border [&_h3]:flex [&_h3]:items-baseline
                  [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:leading-[1.5] [&_h3]:mt-3 [&_h3]:gap-2.5
                  [&.node-completed_.node-marker]:text-success node-${node.status.toLowerCase()}
                `}
                key={node.title}
              >
                <div className="node-topline flex justify-between items-center gap-1.5">
                  <span className="policy text-[9px] font-medium tracking-[0.6px] text-muted">
                    ◎ HUMAN
                  </span>
                  <WorkflowBadge status={node.status} />
                </div>
                <h4>{node.title}</h4>
                <div
                  className="
                  dependencies flex flex-wrap text-[9px] items-baseline leading-[1.6] gap-[5px]
                  [&>span:first-child]:text-muted [&>span:first-child]:mr-[3px] [&_a]:rounded-[3px]
                  [&_a]:bg-background [&_a]:px-[5px] [&_a]:py-0.5 [&_a]:border [&_a]:border-border
                  [&_a]:border-solid [&_a:hover]:underline [&_.dependency-done]:text-success
                "
                >
                  <span>Requires</span>
                  <span>{node.requires}</span>
                </div>
              </div>
            ))}
          </div>
          <aside>
            <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
              PATH TO CLEARANCE
            </p>
            <h4>
              Two checks.
              <br />
              One verified outcome.
            </h4>
            <p>
              Verification stays blocked until both evidence and the functional
              test are complete.
            </p>
            <div
              className="
              lp-preview-audit pt-5 mt-6 border-t border-t-border [&_code]:text-[10px]
              [&>p:not(.eyebrow)]:text-[10px] [&>p:not(.eyebrow)]:text-muted-strong [&>p:not(.eyebrow)]:mt-1.5
              [&>p:not(.eyebrow)]:mb-[15px] [&>p:not(.eyebrow)]:mx-0
            "
            >
              <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
                AUDIT TRAIL
              </p>
              <code>dependency.unblocked</code>
              <p>Collect completion evidence</p>
              <code>node.completed</code>
              <p>Perform repair · demo simulation</p>
            </div>
          </aside>
        </div>
      </div>
      <figcaption>
        Product representation using the Control Room’s actual statuses, metrics
        and styles. Sample data; open the app for a live graph.
      </figcaption>
    </figure>
  );
}
