import type { TicketStatus } from "@shared/index";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; dotColor: string }
> = {
  OPEN: {
    label: "Open",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    dotColor: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    dotColor: "bg-amber-500",
  },
  ESCALATED: {
    label: "Escalated",
    className: "bg-red-100 text-red-700 border border-red-200",
    dotColor: "bg-red-500",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    dotColor: "bg-slate-400",
  },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
