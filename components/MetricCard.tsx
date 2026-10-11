import type { ReactNode } from "react";

const dotColors = {
  orange: "bg-accent",
  neutral: "bg-muted",
  amber: "bg-warning",
  green: "bg-success",
};

export function MetricCard({
  label,
  value,
  color,
  index,
}: {
  label: string;
  value: ReactNode;
  color?: keyof typeof dotColors;
  index?: number;
}) {
  return (
    <div
      className="
      metric border-r border-b border-border p-4.5 room:border-b-0 room:px-6 room:py-5.5 last:border-0
      [&:nth-child(2)]:border-r-0 room:[&:nth-child(2)]:border-r [&:nth-child(3)]:border-b-0
    "
    >
      <p className="flex items-center gap-2 text-[12px] text-muted">
        {color && (
          <span
            className={`dot dot-${color} inline-block size-1.5 shrink-0 rounded-full ${dotColors[color]}`}
          />
        )}
        {label}
        {index !== undefined && (
          <span className="metric-index ml-auto font-mono text-[10px] text-faint">
            0{index}
          </span>
        )}
      </p>
      <strong className="mt-[13px] block text-[34px] leading-none font-medium tracking-[-1px]">
        {value}
      </strong>
    </div>
  );
}
