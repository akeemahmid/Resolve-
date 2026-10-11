import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { ResolveBrand } from "@/components/ResolveBrand";
import { OpenResolveLink } from "@/components/landing/OpenResolveLink";
import { RemediationPreview } from "@/components/landing/RemediationPreview";
import { ControlRoomPreview } from "@/components/landing/ControlRoomPreview";

export const metadata: Metadata = {
  title: "Resolve — From failed inspection to verified resolution",
  description:
    "Inspection software tells you what is wrong. Resolve coordinates what happens next, with dependency-aware remediation, human decisions, and verified outcomes.",
};

const process = [
  {
    number: "01",
    name: "Understand",
    title: "Make the requirements explicit.",
    copy: "Every finding needs a clear path to resolution: the work, the prerequisites, and the proof required to close it.",
    note: "Upload an inspection PDF and review AI-proposed findings before creating workflows.",
  },
  {
    number: "02",
    name: "Execute",
    title: "Move what can move.",
    copy: "The engine determines what is ready, what is blocked, and which dependencies must finish first. Parallel work progresses independently.",
    note: "Real vendor email and quote interpretation, with human approval before repair.",
  },
  {
    number: "03",
    name: "Decide",
    title: "Bring in the right judgment.",
    copy: "Quote approval and verification are explicit human actions. A system operation cannot silently complete a human-controlled node.",
    note: "Enforced in the backend, not just a button in the interface.",
  },
  {
    number: "04",
    name: "Verify",
    title: "Close the loop with proof.",
    copy: "Completion evidence must precede final human verification. Completing the repair alone cannot resolve the finding.",
    note: "Evidence review uses human attestation. Repair evidence attachments are not supported.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="
      landing overflow-clip [:where(&_h1)]:text-balance [:where(&_h1)]:text-[clamp(44px,_10.5vw,_62px)]
      [:where(&_h1)]:leading-[1.03] [:where(&_h1)]:font-medium [:where(&_h1)]:tracking-[-2.3px]
      sm:[:where(&_h1)]:text-[clamp(52px,_8vw,_76px)] sm:[:where(&_h1)]:tracking-[-2.8px]
      md:[:where(&_h1)]:text-[56px] lg:[:where(&_h1)]:text-[clamp(48px,_5.15vw,_76px)]
      lg:[:where(&_h1)]:tracking-[-3.6px] [:where(&_h2)]:text-balance [:where(&_h2)]:text-[34px]
      [:where(&_h2)]:font-medium [:where(&_h2)]:leading-[1.13] [:where(&_h2)]:tracking-[-1.5px]
      sm:[:where(&_h2)]:text-[clamp(34px,_3.5vw,_50px)] sm:[:where(&_h2)]:tracking-[-2px]
      [:where(&_h3)]:text-balance [:where(&_h2>span)]:text-subdued [:where(&_p)]:text-pretty
      [:where(&_section[id])]:scroll-mt-32.5 sm:[:where(&_section[id])]:scroll-mt-27
      [:where(&_h1_span)]:text-subdued
    "
    >
      <a
        className="
        lp-skip-link fixed top-3 left-5 z-50 bg-foreground text-surface [transform:translateY(-200%)] px-5
        py-3.5 [&:focus]:[transform:translateY(0)]
      "
        href="#main-content"
      >
        Skip to content
      </a>
      <header
        className="
        lp-nav sticky top-0 z-20 bg-background border-b border-b-border [&_.brand]:mr-auto [&_.brand]:order-0
        [&_nav]:flex [&_nav]:items-center [&_nav]:order-2 [&_nav]:w-full [&_nav]:justify-between
        [&_nav]:border-t [&_nav]:border-t-border [&_nav]:mt-3.5 [&_nav]:gap-[15px] sm:[&_nav]:order-0
        sm:[&_nav]:w-auto sm:[&_nav]:[justify-content:revert-layer] sm:[&_nav]:border-t-0
        sm:[&_nav]:border-t-current sm:[&_nav]:mt-0 sm:[&_nav]:gap-4.5 md:[&_nav]:gap-7.5
        [&_nav_a]:text-[11px] [&_nav_a]:text-muted-strong [&_nav_a]:py-3 sm:[&_nav_a]:py-2.5
        md:[&_nav_a]:text-[12px] [&_nav_a:hover]:text-foreground [&_nav_a:hover]:underline
        [&_nav_a:hover]:underline-offset-[5px] [&_.resolve-symbol]:w-7.5 [&_.resolve-symbol]:h-7.5
        sm:[&_.resolve-symbol]:w-auto sm:[&_.resolve-symbol]:h-auto [&_.brand_strong]:text-[21px]
        sm:[&_.brand_strong]:text-[22px]
      "
      >
        <div
          className="
          lp-container lp-nav-inner w-[calc(100%_-_40px)] h-auto flex items-center min-h-18 flex-wrap
          pt-[15px] pb-0 mx-auto gap-0 sm:w-[calc(100%_-_64px)] sm:h-19 sm:min-h-0 sm:flex-nowrap sm:pt-0
          sm:gap-5 md:h-22 md:gap-7.5 lg:w-[min(1280px,_calc(100%_-_96px))]
        "
        >
          <ResolveBrand />
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#why-resolve">Why Resolve</a>
            <a href="#architecture">Architecture</a>
          </nav>
          <OpenResolveLink variant="nav" />
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section
          className="
          lp-hero lp-container w-[calc(100%_-_40px)] grid grid-cols-1 items-center pt-9.5 pb-[45px] mx-auto
          gap-8 sm:w-[calc(100%_-_64px)] sm:py-[55px] sm:gap-10.5 md:grid-cols-[1.08fr_1fr] md:gap-9
          lg:w-[min(1280px,_calc(100%_-_96px))] lg:pt-19 lg:pb-20 lg:gap-17 xl:gap-[95px]
        "
          aria-labelledby="hero-title"
        >
          <div className="lp-hero-copy motion-safe:animate-[resolve-enter_0.7s_ease-out_both] max-w-162.5 py-[15px] md:max-w-none">
            <SectionEyebrow>
              <span className="lp-accent-square w-1.5 h-1.5 inline-block bg-accent shrink-0" />{" "}
              INSPECTION REMEDIATION, EXECUTED.
            </SectionEyebrow>
            <h1 id="hero-title">
              From failed inspection
              <br />
              <span>to verified resolution.</span>
            </h1>
            <p
              className="
              lp-hero-description mt-6 text-[15px] leading-[1.65] tracking-[-0.3px] text-muted-strong
              sm:mt-7.5 sm:text-[18px] md:text-[15px] lg:text-[17px] [&_strong]:font-medium
              [&_strong]:text-foreground
            "
            >
              Inspection software tells you what is wrong.
              <br />
              <strong>Resolve coordinates what happens next.</strong>
            </p>
            <p
              className="
              lp-hero-detail mt-[17px] max-w-135 text-[13px] leading-[1.8] text-muted-strong sm:text-[15px]
              md:max-w-105 md:text-[13px] lg:text-[14px]
            "
            >
              Turn findings into executable remediation graphs. Connect the
              work, the decisions and the proof required to get a site ready for
              reinspection.
            </p>
            <div className="lp-hero-actions flex flex-wrap items-center mt-[29px] gap-[15px] sm:gap-[25px]">
              <OpenResolveLink />
              <a
                className="
                lp-text-link inline-flex items-center min-h-11 text-[12px] font-[550] underline
                underline-offset-1.5 decoration-line gap-3 sm:text-[13px] sm:gap-5.5
                [&:hover]:decoration-accent
              "
                href="#how-it-works"
              >
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div
              className="
              lp-hero-proof flex flex-wrap gap-y-[7px] gap-x-2.5 max-w-135 mt-6 pt-[19px] border-t
              border-t-border text-[9px] leading-[1.8] text-muted-strong sm:gap-y-[9px] sm:gap-x-4 sm:mt-9
              sm:text-[10px] md:max-w-110 [&_span+span::before]:content-['·'] [&_span+span::before]:mr-2
              [&_span+span::before]:text-faint sm:[&_span+span::before]:mr-3 [&_strong]:text-foreground
              [&_strong]:font-[550]
            "
            >
              <span>
                Built on <strong>Convex</strong>
              </span>
              <span>Human-controlled decisions</span>
              <span>Verifiable resolution</span>
            </div>
          </div>
          <RemediationPreview />
        </section>
        <div
          className="
          lp-thesis lp-container w-[calc(100%_-_40px)] grid grid-cols-[1fr_30px] items-center border-t
          border-t-border border-b border-b-border mx-auto py-7.5 gap-3.5 sm:w-[calc(100%_-_64px)]
          md:grid-cols-[150px_1fr_35px] md:gap-6 lg:w-[min(1280px,_calc(100%_-_96px))]
          lg:grid-cols-[190px_1fr_70px] lg:gap-[35px] [&_p]:max-w-200 [&_p]:text-[15px] [&_p]:leading-[1.6]
          [&_p]:tracking-[-0.4px] [&_p]:text-muted-strong sm:[&_p]:text-[17px] md:[&_p]:text-[18px]
          [&_strong]:text-foreground [&_strong]:font-medium
        "
        >
          <span className="lp-section-number font-mono text-[9px] tracking-[1px] text-muted-strong col-span-full md:col-auto">
            THE PRODUCT THESIS
          </span>
          <p>
            Resolve turns inspection findings into executable remediation
            workflows and drives{" "}
            <strong>every dependency toward clearance.</strong>
          </p>
          <span
            className="lp-thesis-arrow text-[35px] text-accent justify-self-end sm:text-[48px]"
            aria-hidden="true"
          >
            ↳
          </span>
        </div>

        <section
          className="
            lp-problem lp-container lp-section w-[calc(100%_-_40px)] grid grid-cols-1 mx-auto py-15 gap-7.5
            sm:w-[calc(100%_-_64px)] sm:py-[75px] md:grid-cols-2 md:py-28 md:gap-10
            lg:w-[min(1280px,_calc(100%_-_96px))] lg:gap-20 [&_h2]:max-w-145
          "
          aria-labelledby="problem-title"
        >
          <div className="lp-section-heading">
            <SectionEyebrow>01 / THE COORDINATION GAP</SectionEyebrow>
            <h2 id="problem-title">
              The inspection is over.
              <br />
              <span>
                The coordination problem
                <br className="lp-desktop-break hidden sm:[display:inline]" />{" "}
                just started.
              </span>
            </h2>
          </div>
          <div
            className="
            lp-problem-body [&>p+p]:text-[13px] [&>p+p]:leading-[1.85] [&>p+p]:text-muted-strong
            [&>p+p]:mt-4.5 [&>p+p]:max-w-150 sm:[&>p+p]:text-[14px] md:[&>p+p]:max-w-112.5
          "
          >
            <p className="lp-lead text-[20px] leading-[1.5] tracking-[-0.5px] sm:text-[21px]">
              A report identifies the problem.
              <br />
              It doesn’t get the repair done.
            </p>
            <p>
              Someone still has to find the contractor, chase the quote, get
              approval, schedule the repair and collect the proof. The next step
              lives across six places. Too often, it lives in someone’s memory.
            </p>
            <div
              className="lp-fragmentation mt-8 max-w-150 md:max-w-none"
              aria-label="PDFs, email, spreadsheets, phone calls, vendors and evidence converge into one remediation graph"
            >
              <div
                className="
                lp-fragment-sources grid grid-cols-3 gap-2 [&>span]:flex [&>span]:items-center
                [&>span]:min-h-[43px] [&>span]:bg-surface [&>span]:rounded-[3px] [&>span]:text-muted-strong
                [&>span]:text-[9px] [&>span]:p-2 [&>span]:border [&>span]:border-border [&>span]:border-solid
                [&>span]:gap-[5px] sm:[&>span]:text-[11px] sm:[&>span]:p-[9px] sm:[&>span]:gap-2
                [&_i]:not-italic [&_i]:text-ink-hover [&_i]:text-[14px] sm:[&_i]:text-[17px]
              "
              >
                {[
                  { icon: "▤", name: "PDF report" },
                  { icon: "↗", name: "Email" },
                  { icon: "▦", name: "Spreadsheet" },
                  { icon: "◌", name: "Phone" },
                  { icon: "◎", name: "Vendor" },
                  { icon: "▧", name: "Evidence" },
                ].map((source) => (
                  <span key={source.name}>
                    <i aria-hidden="true">{source.icon}</i>
                    {source.name}
                  </span>
                ))}
              </div>
              <div
                className="
                lp-converge flex w-[68%] h-8.5 m-auto [&_span]:flex-1 [&_span]:border-b [&_span]:border-b-line
                [&_span]:h-4.5 [&_span:first-child]:border-l [&_span:first-child]:border-l-line
                [&_span:first-child]:rounded-[0_0_0_8px] [&_span:nth-child(2)]:relative
                [&_span:nth-child(2)::after]:content-[''] [&_span:nth-child(2)::after]:absolute
                [&_span:nth-child(2)::after]:w-[1px] [&_span:nth-child(2)::after]:h-8.5
                [&_span:nth-child(2)::after]:bg-line [&_span:nth-child(2)::after]:left-[50%]
                [&_span:nth-child(2)::after]:top-0 [&_span:last-child]:border-r
                [&_span:last-child]:border-r-line [&_span:last-child]:rounded-[0_0_8px_0]
              "
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>
              <div
                className="
                lp-single-graph flex items-center bg-accent-soft rounded-[4px] p-3.5 border
                border-accent-border border-solid gap-2.5 sm:p-[17px] sm:gap-3.5 [&_strong]:text-[12px]
                [&_strong]:font-[550] sm:[&_strong]:text-[13px] [&_p]:mt-[5px] [&_p]:text-[10px]
                [&_p]:text-muted-strong sm:[&_p]:text-[11px] [&>span:last-child]:ml-auto
              "
              >
                <span
                  className="lp-graph-glyph text-accent-ink text-[15px] tracking-[-2px] sm:text-[17px]"
                  aria-hidden="true"
                >
                  ⊙—⊙—⊙
                </span>
                <div>
                  <strong>One remediation graph.</strong>
                  <p>A shared answer to “what happens next?”</p>
                </div>
                <span aria-hidden="true">↗</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="lp-process-section bg-section border-t border-t-border border-b border-b-border pt-17.5 pb-0 md:pt-22.5"
          aria-labelledby="process-title"
        >
          <div className="lp-container w-[calc(100%_-_40px)] mx-auto sm:w-[calc(100%_-_64px)] lg:w-[min(1280px,_calc(100%_-_96px))]">
            <div
              className="
              lp-process-heading flex justify-between items-start mb-7.5 flex-col gap-5 sm:mb-13 sm:flex-row
              sm:gap-7.5 md:items-end [&>p]:text-muted-strong [&>p]:text-[13px] [&>p]:leading-[1.8]
              sm:[&>p]:text-[14px]
            "
            >
              <div>
                <SectionEyebrow>02 / HOW RESOLVE WORKS</SectionEyebrow>
                <h2 id="process-title">
                  A path through the work.
                  <br />
                  <span>All the way to proof.</span>
                </h2>
              </div>
              <p>
                Each step has requirements.
                <br />
                Each transition has a reason.
              </p>
            </div>
            <div className="lp-process grid grid-cols-1 border-t border-t-line-strong sm:grid-cols-2 md:grid-cols-4">
              {process.map((step) => (
                <article
                  className="
                  lp-process-step border-r-0 border-b border-line-strong px-0 py-[25px] sm:pt-6 sm:pr-[25px]
                  sm:pb-7.5 sm:border-r sm:[&:not(:first-child)]:pl-4.5 sm:[&:nth-child(2)]:border-r-0
                  sm:[&:nth-child(3)]:pl-0 md:pt-[23px] md:pr-4.5 md:pb-8 md:border-b-0
                  md:[&:nth-child(2)]:border-r md:[&:nth-child(3)]:pl-4.5 lg:pr-6.5
                  lg:[&:not(:first-child)]:pl-6.5 lg:[&:nth-child(3)]:pl-6.5 last:border-r-0
                  [&_.lp-eyebrow]:uppercase [&_.lp-eyebrow]:mb-[15px] [&_.lp-eyebrow]:text-muted-strong
                  [&_h3]:text-[18px] [&_h3]:tracking-[-0.5px] [&_h3]:leading-[1.35] [&_h3]:font-medium
                  [&_h3]:mb-3.5 lg:[&_h3]:text-[19px] [&>p:not(.lp-eyebrow)]:text-[13px]
                  [&>p:not(.lp-eyebrow)]:leading-[1.8] [&>p:not(.lp-eyebrow)]:text-muted-strong
                  [&>p:not(.lp-eyebrow)]:max-w-110 sm:[&>p:not(.lp-eyebrow)]:max-w-none [&>small]:block
                  [&>small]:text-[10px] [&>small]:leading-[1.65] [&>small]:mt-3.5 [&>small]:text-muted-strong
                  sm:[&>small]:mt-6
                "
                  key={step.number}
                >
                  <div
                    className="
                    lp-step-top flex justify-between items-center mb-5.5 sm:mb-7.5 md:mb-[45px]
                    [&>span:first-child]:text-[38px] [&>span:first-child]:leading-[1]
                    [&>span:first-child]:font-normal [&>span:first-child]:tracking-[-2px]
                    [&>span:first-child]:text-subdued [&>span:last-child]:text-subdued
                    [&>span:last-child]:text-[17px]
                  "
                  >
                    <span>{step.number}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <SectionEyebrow>{step.name}</SectionEyebrow>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                  <small>{step.note}</small>
                </article>
              ))}
            </div>
            <p
              className="
              lp-invariant border-t border-t-line-strong text-[27px] tracking-[-1.2px] font-normal
              text-muted-strong leading-[1.35] py-[27px] sm:text-[clamp(24px,_3vw,_40px)] sm:leading-[inherit]
              sm:py-[33px] [&_strong]:text-foreground [&_strong]:font-medium [&>span]:mr-[7px]
              [&>span]:text-accent sm:[&>span]:mr-6
            "
            >
              <span aria-hidden="true">↳</span> Resolved means{" "}
              <strong>proven, not reported.</strong>
            </p>
          </div>
        </section>

        <section
          id="why-resolve"
          className="
            lp-difference lp-container lp-section w-[calc(100%_-_40px)] mx-auto py-15 sm:w-[calc(100%_-_64px)]
            sm:py-[75px] md:py-28 lg:w-[min(1280px,_calc(100%_-_96px))]
          "
          aria-labelledby="difference-title"
        >
          <div className="lp-section-heading">
            <SectionEyebrow>03 / BEYOND THE STATUS COLUMN</SectionEyebrow>
            <h2 id="difference-title">
              A status tells you where work is.
              <br />
              <span>A graph tells you what it needs.</span>
            </h2>
            <p className="lp-section-deck max-w-130 text-muted-strong text-[13px] leading-[1.8] mt-6 sm:text-[15px]">
              The difference is knowing why something can’t move — and exactly
              what will unblock it.
            </p>
          </div>
          <div
            className="
            lp-comparison grid grid-cols-1 rounded-[5px] mt-7.5 border border-border border-solid gap-0
            sm:grid-cols-[0.8fr_1.2fr] sm:mt-11 [&_h3]:font-medium [&_h3]:text-[25px] [&_h3]:tracking-[-0.7px]
            [&_.lp-eyebrow]:mb-[15px] [&_ol]:list-none [&_ol]:mx-0 [&_ol]:my-7.5 [&_ol]:p-0
            [&>div>p:last-child]:text-[12px] [&>div>p:last-child]:leading-[1.8]
            [&>div>p:last-child]:text-muted-strong [&_strong]:font-medium [&_strong]:text-foreground
          "
          >
            <div
              className="
              lp-tracking bg-section border-r-0 border-r-border border-b border-b-border px-5 py-[25px]
              sm:border-r sm:border-b-0 sm:border-b-current sm:p-6.5 lg:p-9 [&_li]:relative
              [&_li]:rounded-[3px] [&_li]:bg-background [&_li]:max-w-none [&_li]:text-[12px]
              [&_li]:text-muted-strong [&_li]:m-0 [&_li]:px-[15px] [&_li]:py-3 [&_li]:border
              [&_li]:border-line-strong [&_li]:border-solid sm:[&_li]:max-w-62.5 sm:[&_li]:mb-4.5
              [&_li:not(:last-child)::after]:content-['↓'] [&_li:not(:last-child)::after]:absolute
              [&_li:not(:last-child)::after]:bottom-[-18px] [&_li:not(:last-child)::after]:left-[50%]
              [&_li:not(:last-child)::after]:text-faint [&_li:not(:last-child)::after]:hidden
              sm:[&_li:not(:last-child)::after]:block [&_ol]:grid [&_ol]:grid-cols-2 [&_ol]:gap-[15px]
              sm:[&_ol]:block sm:[&_ol]:grid-cols-[none] sm:[&_ol]:gap-[normal]
            "
            >
              <SectionEyebrow>TASK TRACKING</SectionEyebrow>
              <h3>“Is it done?”</h3>
              <ol>
                {["Finding", "Assigned", "In progress", "Done"].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p>
                A changed status records a claim.
                <br />
                The dependencies remain someone else’s problem.
              </p>
            </div>
            <div
              className="
              lp-execution bg-surface px-5 py-[25px] sm:p-6.5 lg:p-9 [&_ol]:grid [&_ol]:grid-cols-3
              [&_ol]:gap-y-[15px] [&_ol]:gap-x-2.5 sm:[&_ol]:grid-cols-2 sm:[&_ol]:gap-y-3
              sm:[&_ol]:gap-x-[15px] md:[&_ol]:grid-cols-3 md:[&_ol]:gap-y-5 [&_li]:flex [&_li]:flex-col
              [&_li]:pt-3 [&_li]:pb-4 [&_li]:text-[10px] [&_li]:border-t [&_li]:border-t-line-strong
              [&_li]:px-0 [&_li]:gap-[17px] sm:[&_li]:text-[12px] [&_li>span]:font-mono [&_li>span]:text-[9px]
              [&_li>span]:text-muted-strong [&_li.lp-endpoint]:text-success-ink
              [&_li.lp-endpoint]:border-success [&_li:last-child]:col-auto sm:[&_li:last-child]:col-span-full
              md:[&_li:last-child]:col-auto
            "
            >
              <SectionEyebrow>
                <span className="lp-accent-square w-1.5 h-1.5 inline-block bg-accent shrink-0" />{" "}
                OUTCOME EXECUTION
              </SectionEyebrow>
              <h3>“What does done require?”</h3>
              <ol>
                {[
                  "Finding",
                  "Requirements",
                  "Dependencies",
                  "Actions",
                  "External responses",
                  "Human decisions",
                  "Evidence",
                  "Verification",
                  "Clearance",
                ].map((item, i) => (
                  <li
                    key={item}
                    className={
                      i === 8
                        ? "lp-endpoint [&::after]:content-['HUMAN_VERIFIED'] [&::after]:text-[6.5px] [&::after]:tracking-[0.5px] [&::after]:mt-[-10px] [&::after]:leading-[1.5] sm:[&::after]:text-[8px] sm:[&::after]:leading-[inherit]"
                        : ""
                    }
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {item}
                  </li>
                ))}
              </ol>
              <p>
                Work advances when its prerequisites are satisfied.
                <br />
                <strong>Closure follows verification.</strong>
              </p>
            </div>
          </div>
        </section>

        <section
          className="lp-control-section border-t border-t-border border-b border-b-border bg-surface py-17.5 md:py-22.5"
          aria-labelledby="control-title"
        >
          <div
            className="
            lp-container lp-control-layout w-[calc(100%_-_40px)] grid grid-cols-1 mx-auto gap-[45px]
            sm:w-[calc(100%_-_64px)] md:grid-cols-2 lg:w-[min(1280px,_calc(100%_-_96px))] lg:gap-22.5
          "
          >
            <div>
              <SectionEyebrow>04 / HUMAN AUTHORITY, BY DESIGN</SectionEyebrow>
              <h2 id="control-title">
                Automate the coordination.
                <br />
                <span>
                  Keep humans
                  <br />
                  in control.
                </span>
              </h2>
              <p className="lp-section-deck max-w-130 text-muted-strong text-[13px] leading-[1.8] mt-6 sm:text-[15px]">
                The engine can move a dependency forward.
                <br />
                It cannot make a human decision disappear.
              </p>
              <div
                className="
                lp-human-gate flex items-center max-w-90 border-t border-t-border border-b border-b-border
                mt-8.5 px-0 py-[19px] gap-3.5 [&>span]:grid [&>span]:place-items-center [&>span]:w-9.5
                [&>span]:h-9.5 [&>span]:rounded-full [&>span]:text-warning-ink [&>span]:bg-warning-soft
                [&>span]:text-[23px] [&>span]:border [&>span]:border-accent-border [&>span]:border-solid
                [&_strong]:text-[13px] [&_strong]:font-[550] [&_p]:text-[11px] [&_p]:text-muted-strong
                [&_p]:mt-[5px]
              "
              >
                <span aria-hidden="true">◎</span>
                <div>
                  <strong>Human approval required</strong>
                  <p>System execution cannot pass this gate.</p>
                </div>
              </div>
            </div>
            <div
              className="
              lp-boundaries [&_h3]:font-medium [&_h3]:text-[23px] [&_h3]:leading-[1.35]
              [&_h3]:tracking-[-0.6px] [&_h3]:mt-[15px] grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-7.5
              md:block md:grid-cols-[none] md:gap-[normal]
            "
            >
              <div
                className="
                lp-boundary-current [&_ul]:list-none [&_ul]:mt-5.5 [&_ul]:mb-0 [&_ul]:mx-0 [&_ul]:p-0
                md:[&_ul]:mb-7.5 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_li]:border-b
                [&_li]:border-b-border [&_li]:px-0 [&_li]:py-2.5 [&_li::before]:content-['✓']
                [&_li::before]:text-success [&_li::before]:mr-3
              "
              >
                <p className="lp-capability-label font-mono text-[9px] tracking-[1px] leading-[1.7] text-muted-strong flex items-center gap-2">
                  <span
                    className="
                    dot dot-green inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
                    [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success
                  "
                  />{" "}
                  WORKING TODAY
                </p>
                <h3>
                  Deterministic progression.
                  <br />
                  Explicit human decisions.
                </h3>
                <ul>
                  <li>Dependency checks before every completion</li>
                  <li>Authenticated quote approval and final verification</li>
                  <li>Owner-scoped graphs and recorded workflow events</li>
                </ul>
              </div>
              <div
                className="
                lp-boundary-future border-l-[2px] border-l-line-strong pl-5 self-start md:self-auto
                [&>p:not(.lp-capability-label)]:text-[13px] [&>p:not(.lp-capability-label)]:text-muted-strong
                [&>p:not(.lp-capability-label)]:leading-[1.8] [&>p:not(.lp-capability-label)]:mt-3.5
                [&_strong]:font-medium [&_strong]:text-ink-hover [&_small]:block [&_small]:text-muted-strong
                [&_small]:text-[10px] [&_small]:leading-[1.7] [&_small]:mt-3.5
              "
              >
                <p className="lp-capability-label font-mono text-[9px] tracking-[1px] leading-[1.7] text-muted-strong flex items-center gap-2">
                  WORKING COORDINATION / HUMAN AUTHORITY
                </p>
                <p>
                  Vendor requests and replies flow through Resend. OpenAI
                  interprets replies; deterministic policy checks which quotes
                  can reach human approval.
                </p>
                <p>
                  <strong>
                    Quote acceptance, spending, repair-quality certification,
                    compliance decisions and final closure retain human
                    authority.
                  </strong>
                </p>
                <small>
                  Payments and compliance certification are not implemented.
                  Evidence review uses human attestation.
                </small>
              </div>
            </div>
          </div>
        </section>

        <section
          id="architecture"
          className="
            lp-architecture lp-container lp-section w-[calc(100%_-_40px)] mx-auto py-15
            sm:w-[calc(100%_-_64px)] sm:py-[75px] md:py-28 lg:w-[min(1280px,_calc(100%_-_96px))]
          "
          aria-labelledby="architecture-title"
        >
          <div
            className="
            lp-architecture-heading grid grid-cols-1 items-end gap-[25px] sm:grid-cols-2 sm:gap-[35px]
            md:gap-20 [&>div:last-child>p+p]:text-[13px] [&>div:last-child>p+p]:leading-[1.85]
            [&>div:last-child>p+p]:text-muted-strong [&>div:last-child>p+p]:mt-[15px]
            sm:[&>div:last-child>p+p]:text-[14px]
          "
          >
            <div>
              <SectionEyebrow>05 / INSIDE THE CONTROL PLANE</SectionEyebrow>
              <h2 id="architecture-title">
                A live graph.
                <br />
                <span>A deterministic engine.</span>
              </h2>
            </div>
            <div>
              <p className="lp-lead text-[20px] leading-[1.5] tracking-[-0.5px] sm:text-[21px]">
                Convex keeps the workflow coherent.
              </p>
              <p>
                Persistent state, authenticated ownership, transactional
                transitions, realtime subscriptions and audit events share one
                backend.
              </p>
            </div>
          </div>
          <div
            className="
              lp-architecture-diagram grid grid-cols-1 items-center mt-7.5 bg-section
              [background-image:radial-gradient(var(--color-line-strong)_0.7px,_transparent_0.7px)]
              [background-size:15px_15px] rounded-[5px] p-4.5 border border-border border-solid sm:mt-11.5
              sm:p-6 md:grid-cols-[1fr_95px_1.2fr] lg:grid-cols-[1fr_130px_1.25fr] lg:p-[35px]
            "
            aria-label="Current architecture: Next.js and Convex Auth provide access to the Control Room. The Convex remediation engine validates and commits transitions, records audit events, and updates the UI through realtime subscriptions."
          >
            <div
              className="
              lp-architecture-client bg-surface rounded-[4px] p-4.5 border border-success-border border-solid
              sm:p-5 lg:p-6 [&_h3]:text-[19px] [&_h3]:font-medium [&_h3]:tracking-[-0.6px] [&_h3]:mt-3.5
              lg:[&_h3]:text-[23px]
            "
            >
              <p className="lp-capability-label font-mono text-[9px] tracking-[1px] leading-[1.7] text-muted-strong flex items-center gap-2">
                01 / APPLICATION
              </p>
              <h3>Next.js</h3>
              <div
                className="
                lp-architecture-auth mt-[25px] border-t border-t-border border-b border-b-border text-[13px]
                py-[13px] [&_span]:block [&_span]:mt-1.5 [&_span]:text-muted-strong [&_span]:text-[10px]
              "
              >
                Convex Auth <span>Password + session</span>
              </div>
              <div
                className="
                lp-architecture-ui text-[14px] pt-4.5 [&_small]:block [&_small]:text-muted-strong
                [&_small]:text-[10px] [&_small]:mt-[7px] [&_small]:leading-[1.6]
              "
              >
                Resolve Control Room
                <small>Nodes · dependencies · human actions</small>
              </div>
            </div>
            <div
              className="
              lp-architecture-bridge flex flex-row items-center text-muted-strong px-0 py-5 gap-3.5
              md:flex-col md:py-[15px] md:gap-1.5 [&>span]:text-[34px] [&>span]:leading-[1]
              [&>span]:font-[300] [&>span]:text-subdued [&>span]:[transform:rotate(90deg)]
              md:[&>span]:[transform:none] [&_small]:text-center [&_small]:text-[9px] [&_small]:leading-[1.6]
              [&>span:nth-of-type(2)]:m-0 md:[&>span:nth-of-type(2)]:mt-3.5
            "
            >
              <span aria-hidden="true">→</span>
              <small>
                Authenticated
                <br />
                query / mutation
              </small>
              <span aria-hidden="true">←</span>
              <small>
                Realtime
                <br />
                subscriptions
              </small>
            </div>
            <div
              className="
              lp-architecture-engine bg-surface border-t-[3px] border-t-accent border-r
              border-r-success-border border-b border-b-success-border border-l border-l-success-border
              rounded-[4px] p-4.5 border-solid sm:p-5 lg:p-6 [&_h3]:text-[20px] [&_h3]:font-medium
              [&_h3]:tracking-[-0.6px] [&_h3]:mt-3.5 sm:[&_h3]:text-[19px] lg:[&_h3]:text-[23px]
              [&_ol]:list-none [&_ol]:mx-0 [&_ol]:my-5 [&_ol]:p-0 [&_li]:text-[10px] [&_li]:border-b
              [&_li]:border-b-border [&_li]:py-2.5 sm:[&_li]:text-[12px] [&_li>span]:text-[9px]
              [&_li>span]:text-muted-strong [&_li>span]:font-mono [&_li>span]:mr-2 sm:[&_li>span]:mr-3
              [&>p]:text-[10px] [&>p]:text-muted-strong
            "
            >
              <div className="lp-engine-title">
                <p className="lp-capability-label font-mono text-[9px] tracking-[1px] leading-[1.7] text-muted-strong flex items-center gap-2">
                  <span
                    className="
                    dot dot-green inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
                    [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success
                  "
                  />{" "}
                  IMPLEMENTED
                </p>
                <h3>Convex remediation engine</h3>
              </div>
              <ol>
                <li>
                  <span>01</span>Check ownership & execution policy
                </li>
                <li>
                  <span>02</span>Validate state & dependencies
                </li>
                <li>
                  <span>03</span>Commit transition & unblock work
                </li>
                <li>
                  <span>04</span>Record an audit event
                </li>
              </ol>
              <p>One transaction. Consistent workflow state.</p>
            </div>
          </div>
          <div
            className="
            lp-ai-boundary grid grid-cols-1 pt-[35px] pb-0 px-0 gap-6 sm:grid-cols-2 sm:gap-7.5 md:gap-17.5
            [&_h3]:text-[25px] [&_h3]:tracking-[-0.7px] [&_h3]:font-medium [&_h3]:mt-3.5 sm:[&_h3]:text-[27px]
            [&_h3>span]:text-muted-strong [&>div>p:last-child]:text-[13px] [&>div>p:last-child]:leading-[1.8]
            [&>div>p:last-child]:text-muted-strong [&>div>p:last-child]:mt-3.5 [&>div>p:last-child]:max-w-110
            [&_ol]:grid [&_ol]:grid-cols-1 [&_ol]:list-none [&_ol]:pr-0 [&_ol]:pl-4.5 [&_ol]:content-center
            [&_ol]:border-l [&_ol]:[border-left-style:dashed] [&_ol]:border-l-line [&_ol]:m-0 [&_ol]:py-0
            [&_ol]:gap-0 sm:[&_ol]:grid-cols-2 sm:[&_ol]:gap-y-3 sm:[&_ol]:gap-x-6 sm:[&_ol]:pl-0
            sm:[&_ol]:border-l-0 sm:[&_ol]:border-l-current [&_li]:text-[11px] [&_li]:border-b
            [&_li]:[border-bottom-style:dashed] [&_li]:border-b-line [&_li]:px-0 [&_li]:py-[13px]
            [&_li::before]:content-['→'] [&_li::before]:text-faint [&_li::before]:mr-2.5
            [&_li.lp-policy-step]:text-accent-ink [&_li.lp-policy-step]:border-accent-border
          "
          >
            <div>
              <p className="lp-capability-label font-mono text-[9px] tracking-[1px] leading-[1.7] text-muted-strong flex items-center gap-2">
                IMPLEMENTED INTERPRETATION BOUNDARY
              </p>
              <h3>
                AI interprets. <span>Policy decides.</span>
              </h3>
              <p>
                Interpreted input passes through deterministic checks. AI
                proposals cannot approve quotes or complete human verification.
              </p>
            </div>
            <ol aria-label="Interpretation boundary">
              <li>External input</li>
              <li>Structured AI interpretation</li>
              <li className="lp-policy-step">Deterministic policy check</li>
              <li>Allowed Convex mutation</li>
            </ol>
          </div>
        </section>

        <section
          id="product"
          className="lp-product-section bg-section border-t border-t-border border-b border-b-border py-17.5 md:py-22.5"
          aria-labelledby="product-title"
        >
          <div className="lp-container w-[calc(100%_-_40px)] mx-auto sm:w-[calc(100%_-_64px)] lg:w-[min(1280px,_calc(100%_-_96px))]">
            <div
              className="
              lp-product-section-heading grid grid-cols-1 items-end mb-10 gap-[25px] sm:grid-cols-2 sm:gap-7.5
              md:gap-17.5 [&>div:last-child>p]:max-w-110 [&>div:last-child>p]:text-[13px]
              [&>div:last-child>p]:leading-[1.8] [&>div:last-child>p]:text-muted-strong
              sm:[&>div:last-child>p]:text-[15px] [&_.lp-text-link]:mt-3.5
            "
            >
              <div>
                <SectionEyebrow>06 / THE WORKING PRODUCT</SectionEyebrow>
                <h2 id="product-title">
                  Less chasing.
                  <br />
                  <span>More clarity.</span>
                </h2>
              </div>
              <div>
                <p>
                  Create a remediation graph. Follow the dependencies. Complete
                  the human decisions. Watch the next steps unlock, live.
                </p>
                <OpenResolveLink variant="text">
                  Open the live Control Room <span aria-hidden="true">↗</span>
                </OpenResolveLink>
              </div>
            </div>
            <ControlRoomPreview />
            <div
              className="
              lp-product-footnote flex items-baseline mt-6 flex-col gap-2 md:flex-row md:gap-7 [&>span]:flex
              [&>span]:items-center [&>span]:whitespace-nowrap [&>span]:text-[8px] [&>span]:font-mono
              [&>span]:tracking-[0.7px] [&>span]:gap-[7px] [&_p]:text-muted-strong [&_p]:text-[10px]
              [&_p]:leading-[1.8] [&_p]:max-w-160 sm:[&_p]:text-[11px]
            "
            >
              <span>
                <span
                  className="
                  dot dot-green inline-block w-1.5 h-1.5 shrink-0 rounded-full [&.dot-orange]:bg-accent
                  [&.dot-neutral]:bg-muted [&.dot-amber]:bg-warning [&.dot-green]:bg-success
                "
                />{" "}
                WORKING ENGINE DEMO
              </span>
              <p>
                Real Convex state, real authorization, real audit history.
                Contractor actions are explicitly simulated; verification
                requires a human.
              </p>
            </div>
          </div>
        </section>

        <section
          className="
            lp-vision lp-container w-[calc(100%_-_40px)] grid grid-cols-1 border-b border-b-border mx-auto
            py-[65px] gap-[5px] sm:w-[calc(100%_-_64px)] md:grid-cols-[1fr_2fr] md:py-[85px] md:gap-[65px]
            lg:w-[min(1280px,_calc(100%_-_96px))] [&_h2]:text-[30px] [&_h2]:tracking-[-1.5px]
            sm:[&_h2]:text-[34px] sm:[&_h2]:tracking-[-1.2px] [&>div>p]:mt-6 [&>div>p]:text-muted-strong
            [&>div>p]:text-[13px] [&>div>p]:leading-[1.85] [&>div>p]:max-w-170 sm:[&>div>p]:text-[14px]
            [&_small]:block [&_small]:text-muted-strong [&_small]:text-[10px] [&_small]:mt-4
          "
          aria-labelledby="vision-title"
        >
          <SectionEyebrow>THE MODEL GOES FURTHER</SectionEyebrow>
          <div>
            <h2 id="vision-title">
              Start with inspections.
              <br />
              <span>Build for evidence-driven work.</span>
            </h2>
            <p>
              The same finding → requirements → dependency graph → execution →
              evidence → verification model could support construction punch
              lists, safety deficiencies, equipment compliance, quality failures
              and vendor remediation.
            </p>
            <small>Future applications. One reusable execution model.</small>
          </div>
        </section>

        <section
          className="
            lp-final-cta lp-container w-[calc(100%_-_40px)] text-center pt-15 pb-17.5 mx-auto
            sm:w-[calc(100%_-_64px)] sm:pt-22.5 sm:pb-25 lg:w-[min(1280px,_calc(100%_-_96px))]
            [&_.lp-eyebrow]:justify-center [&_.lp-eyebrow]:text-[7px] [&_.lp-eyebrow]:tracking-[0.5px]
            sm:[&_.lp-eyebrow]:text-[10px] sm:[&_.lp-eyebrow]:tracking-[1.3px] [&_h2]:text-[40px]
            [&_h2]:tracking-[-1.8px] sm:[&_h2]:text-[clamp(40px,_5vw,_68px)] sm:[&_h2]:tracking-[-2.6px]
            [&_h2>span]:text-foreground [&>p:not(.lp-eyebrow)]:text-[13px]
            [&>p:not(.lp-eyebrow)]:leading-[1.8] [&>p:not(.lp-eyebrow)]:text-muted-strong
            [&>p:not(.lp-eyebrow)]:mt-6 [&>p:not(.lp-eyebrow)]:mb-7 [&>p:not(.lp-eyebrow)]:mx-0
            sm:[&>p:not(.lp-eyebrow)]:text-[15px] [&_.lp-button]:min-w-46
          "
          aria-labelledby="cta-title"
        >
          <div
            className="lp-final-symbol text-[46px] text-accent leading-[1] mb-6.5 sm:text-[60px]"
            aria-hidden="true"
          >
            ↳
          </div>
          <SectionEyebrow>
            FROM FAILED INSPECTION TO VERIFIED RESOLUTION
          </SectionEyebrow>
          <h2 id="cta-title">
            Stop tracking findings.
            <br />
            <span>Start resolving them.</span>
          </h2>
          <p>
            Turn inspection deficiencies into coordinated,
            <br className="lp-desktop-break hidden sm:[display:inline]" />{" "}
            verifiable remediation workflows.
          </p>
          <OpenResolveLink />
        </section>
      </main>
      <footer
        className="
        lp-footer [&_nav_a]:text-[12px] [&_nav_a]:text-muted-strong [&_nav_a]:py-2.5
        [&_nav_a:hover]:text-foreground [&_nav_a:hover]:underline [&_nav_a:hover]:underline-offset-[5px]
        border-t border-t-border py-9 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-[23px]
        sm:[&>div]:grid-cols-[1fr_auto] sm:[&>div]:gap-7.5 [&_.brand_strong]:text-[20px]
        [&_.resolve-symbol]:w-7.5 [&_.resolve-symbol]:h-7.5 [&>div>div>p]:text-[11px]
        [&>div>div>p]:text-muted-strong [&>div>div>p]:mt-[15px] [&_nav]:flex [&_nav]:items-center
        [&_nav]:flex-wrap [&_nav]:gap-[25px] sm:[&_nav]:flex-nowrap [&_.lp-footer-principle]:col-span-full
        [&_.lp-footer-principle]:text-[9px] [&_.lp-footer-principle]:text-muted-strong
        [&_.lp-footer-principle]:border-t [&_.lp-footer-principle]:border-t-border
        [&_.lp-footer-principle]:pt-5 sm:[&_.lp-footer-principle]:text-[10px]
        sm:[&_.lp-footer-principle]:pt-5.5
      "
      >
        <div className="lp-container w-[calc(100%_-_40px)] mx-auto sm:w-[calc(100%_-_64px)] lg:w-[min(1280px,_calc(100%_-_96px))]">
          <div>
            <ResolveBrand />
            <p>Inspection remediation infrastructure.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#product">Product</a>
            <a href="#architecture">Architecture</a>
            <OpenResolveLink variant="footer">Open Resolve ↗</OpenResolveLink>
          </nav>
          <p className="lp-footer-principle">
            Resolved means proven, not reported.
          </p>
        </div>
      </footer>
    </div>
  );
}
