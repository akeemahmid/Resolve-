import type { ReactNode } from "react";

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="
      lp-eyebrow flex items-center gap-[9px] mb-5 font-mono text-[8px] leading-[1.6] font-medium
      tracking-[0.8px] text-muted-strong sm:mb-6 sm:text-[10px] sm:tracking-[1.3px]
    "
    >
      {children}
    </p>
  );
}
