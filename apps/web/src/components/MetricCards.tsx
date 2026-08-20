"use client";

import { Ticket, UserCheck, CheckCircle2 } from "lucide-react";

interface MetricCardsProps {
  totalOpen: number;
  myAssigned: number;
  resolved: number;
}

export function MetricCards({ totalOpen, myAssigned, resolved }: MetricCardsProps) {
  const metrics = [
    {
      label: "Total Open",
      value: totalOpen,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "My Assigned",
      value: myAssigned,
      icon: UserCheck,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{metric.value}</p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${metric.bg}`}>
            <metric.icon className={`h-6 w-6 ${metric.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
