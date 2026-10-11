"use client";

import { Button } from "@/components/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-container w-[min(1600px,_93%)] pt-7 pb-6 mx-auto my-0 px-0 room:pt-11.5">
      <section
        className="
        panel empty-state bg-surface rounded-[7px] overflow-hidden flex flex-col items-center justify-center
        text-center min-h-90 px-[25px] py-17.5 border border-border border-solid gap-4.5
        [&>p:not(.eyebrow)]:max-w-110 [&>p:not(.eyebrow)]:text-muted [&>p:not(.eyebrow)]:leading-[1.9]
        [&_.eyebrow]:mb-0 [&_small]:text-muted [&_small]:text-[11px] [&_h2]:text-[29px] [&_h2]:tracking-[-1px]
      "
      >
        <h1>Could not load your control room.</h1>
        <p>
          Your workflow is saved in Convex. Check your connection and try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
