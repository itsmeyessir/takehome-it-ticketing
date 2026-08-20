"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { BarChart3, TrendingUp, Clock, Users, Ticket, CheckCircle } from "lucide-react";
import type { DepartmentTickets, CurrentUser } from "@shared/index";

export default function AnalyticsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<DepartmentTickets | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const token = getToken() || "";

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    api
      .get<DepartmentTickets>("/tickets", token)
      .then(setTickets)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const allTickets = [...(tickets?.unassigned || []), ...(tickets?.assigned || [])];
  const totalTickets = allTickets.length;
  const unassignedCount = tickets?.unassigned.length || 0;
  const assignedCount = tickets?.assigned.length || 0;

  // Status breakdown
  const statusCounts = {
    OPEN: allTickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: allTickets.filter((t) => t.status === "IN_PROGRESS").length,
    ESCALATED: allTickets.filter((t) => t.status === "ESCALATED").length,
    RESOLVED: allTickets.filter((t) => t.status === "RESOLVED").length,
    CLOSED: allTickets.filter((t) => t.status === "CLOSED").length,
  };

  // Ticket type breakdown
  const typeCounts = allTickets.reduce((acc, t) => {
    const type = t.ticketType.name;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent tickets (last 5)
  const recentTickets = [...allTickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of ticket metrics and performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Ticket}
          label="Total Tickets"
          value={totalTickets}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="Unassigned"
          value={unassignedCount}
          color="amber"
        />
        <MetricCard
          icon={Users}
          label="Assigned"
          value={assignedCount}
          color="emerald"
        />
        <MetricCard
          icon={CheckCircle}
          label="Resolution Rate"
          value={totalTickets > 0 ? Math.round(((statusCounts.RESOLVED + statusCounts.CLOSED) / totalTickets) * 100) : 0}
          suffix="%"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Status Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-slate-600">
                  {status.replace("_", " ")}
                </div>
                <div className="flex-1">
                  <div className="h-6 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === "OPEN"
                          ? "bg-blue-500"
                          : status === "IN_PROGRESS"
                          ? "bg-amber-500"
                          : status === "ESCALATED"
                          ? "bg-red-500"
                          : status === "RESOLVED"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${totalTickets > 0 ? (count / totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="w-8 text-right text-sm font-semibold text-slate-900">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Type Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ticket Types
          </h3>
          <div className="space-y-4">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <div className="w-32 text-xs font-medium text-slate-600 truncate">{type}</div>
                <div className="flex-1">
                  <div className="h-6 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${totalTickets > 0 ? (count / totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="w-8 text-right text-sm font-semibold text-slate-900">
                  {count}
                </div>
              </div>
            ))}
            {Object.keys(typeCounts).length === 0 && (
              <p className="text-sm text-slate-500">No ticket data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Recent Tickets</h3>
        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  {ticket.createdBy.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{ticket.title}</p>
                  <p className="text-xs text-slate-500">
                    {ticket.ticketType.name} · {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.status === "OPEN"
                    ? "bg-blue-100 text-blue-700"
                    : ticket.status === "IN_PROGRESS"
                    ? "bg-amber-100 text-amber-700"
                    : ticket.status === "ESCALATED"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {ticket.status.replace("_", " ")}
              </span>
            </button>
          ))}
          {recentTickets.length === 0 && (
            <p className="text-sm text-slate-500">No recent tickets</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  color,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {value}{suffix}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
