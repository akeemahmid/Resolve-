"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import type { ReactNode } from "react";

const variants = {
  primary:
    "lp-button lp-button-primary inline-flex items-center justify-between min-h-12 rounded-[4px] text-[12px] font-[550] transition-[background,transform] duration-200 bg-accent text-foreground px-4 py-3.5 gap-[25px] sm:text-[13px] sm:px-5 sm:gap-8.5 hover:bg-accent-hover motion-safe:hover:-translate-y-0.5",
  nav: "lp-button lp-button-dark lp-nav-cta inline-flex items-center justify-between min-h-10 rounded-[4px] text-[12px] font-[550] transition-colors duration-200 bg-foreground text-surface order-1 px-4 py-2.5 gap-[25px] sm:min-h-10.5 sm:text-[13px] sm:order-0 sm:py-[11px] sm:gap-6.5 hover:bg-ink-hover",
  text: "lp-text-link inline-flex items-center min-h-11 text-[12px] font-[550] underline underline-offset-1.5 decoration-line gap-3 sm:text-[13px] sm:gap-5.5 hover:decoration-accent",
  footer: "lp-footer-cta",
};

export function OpenResolveLink({
  children = (
    <>
      Open Resolve <span aria-hidden="true">↗</span>
    </>
  ),
  variant = "primary",
}: {
  children?: ReactNode;
  variant?: keyof typeof variants;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  // During session restoration, /app lets the existing middleware decide.
  return (
    <Link
      className={variants[variant]}
      href={isAuthenticated || isLoading ? "/app" : "/signin"}
    >
      {children}
    </Link>
  );
}
