"use client";
import Link from "next/link";
import { ConvexError } from "convex/values";
import { ResolveBrand } from "./ResolveBrand";

export const fieldClass =
  "w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm";
export function inspectionError(error: unknown) {
  return error instanceof ConvexError
    ? String(error.data)
    : "Something went wrong. Please try again.";
}
export function InspectionShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-[4%] py-5">
        <ResolveBrand subtitle="Private inspection workspace" />
        <Link className="text-sm underline underline-offset-4" href="/app">
          ← Control Room
        </Link>
      </header>
      <main className="mx-auto w-[92%] max-w-5xl py-8 sm:py-12">
        {children}
      </main>
    </>
  );
}
export function InspectionStatus({ status }: { status: string }) {
  const colors =
    status === "FAILED"
      ? "bg-danger-soft text-danger-ink"
      : status === "CONFIRMED"
        ? "bg-success-soft text-success-ink"
        : "bg-warning-soft text-warning-ink";
  return (
    <span
      className={`inline-flex rounded px-2.5 py-1 text-xs font-medium ${colors}`}
    >
      {status === "CONFIRMED"
        ? "Review complete"
        : status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
export function ErrorNotice({ message }: { message: string | null }) {
  return message ? (
    <p
      role="alert"
      className="my-4 rounded-md border border-danger-border bg-danger-soft p-4 text-sm text-danger-ink"
    >
      {message}
    </p>
  ) : null;
}
