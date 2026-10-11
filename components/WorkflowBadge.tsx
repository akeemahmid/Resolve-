const statusColors: Record<string, string> = {
  ACTIVE: "bg-accent-soft text-accent-ink",
  READY: "bg-accent-soft text-accent-ink",
  RUNNING: "bg-accent-soft text-accent-ink",
  BLOCKED: "bg-danger-soft text-danger-ink",
  FAILED: "bg-danger-soft text-danger-ink",
  COMPLETED: "bg-success-soft text-success-ink",
  RESOLVED: "bg-success-soft text-success-ink",
  WAITING_HUMAN: "bg-warning-soft text-warning-ink",
  WAITING_EXTERNAL: "bg-warning-soft text-warning-ink",
};

export function WorkflowBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge inline-flex items-center whitespace-nowrap rounded-[3px] px-1.5 py-1 text-[9px] font-semibold tracking-[0.4px] ${statusColors[status.toUpperCase()] ?? "bg-section text-muted"} status-${status.toLowerCase()}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
