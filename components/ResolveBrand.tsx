import Link from "next/link";

export function ResolveBrand({ subtitle }: { subtitle?: string }) {
  return (
    <Link
      href="/"
      className="
      brand flex items-center gap-3 [&_strong]:block [&_strong]:text-[22px] [&_strong]:tracking-[-0.9px]
      [&_strong]:font-[650] [&_strong]:leading-[1.15] [&_small]:block [&_small]:text-muted
      [&_small]:text-[11px] [&_small]:mt-[5px] [&_small]:max-w-45 [&_small]:leading-[1.4]
      room:[&_small]:max-w-none room:[&_small]:leading-[inherit]
    "
      aria-label="Resolve home"
    >
      <svg
        className="resolve-symbol shrink-0"
        width="36"
        height="36"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="12" fill="currentColor" />
        <path d="M18 46V20h9v5c3-4 7-6 13-6v9c-8-1-13 3-13 10v8z" fill="#fff" />
        <circle cx="45" cy="42" r="5" fill="#ff4f1f" />
      </svg>
      <span>
        <strong>Resolve</strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </Link>
  );
}
