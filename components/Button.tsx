import type { ComponentProps } from "react";

const variants = {
  primary:
    "button-primary border-transparent bg-accent text-foreground enabled:hover:bg-accent-hover",
  secondary: "button-quiet border-border bg-surface hover:bg-background",
  demo: "button-demo border-dashed border-line bg-background text-muted hover:bg-section",
};

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: "default" | "small";
}) {
  return (
    <button
      className={`button inline-flex shrink-0 items-center justify-center gap-2 rounded-[5px] border font-[550] transition-colors duration-150 ${size === "small" ? "button-small px-2.5 py-2 text-[11px]" : "px-4 py-[11px] text-[12px]"} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
