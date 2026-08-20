"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCards } from "@/components/MetricCards";
import { Plus, Clock, User } from "lucide-react";
import type { DepartmentTickets, TicketWithDetails, CurrentUser } from "@shared/index";

export default function DashboardPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<DepartmentTickets | null>(null);
  const [myTickets, setMyTickets] = useState<TicketWithDetails[] | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
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

    const stored = storedUser ? JSON.parse(storedUser) : null;
    const fetchPromise =
      stored?.role === "END_USER"
        ? api.get<TicketWithDetails[]>("/tickets/mine", token).then((data) => {
            setMyTickets(data);
            return null;
          })
        : api.get<DepartmentTickets>("/tickets", token).then((data) => {
            setTickets(data);
            return data;
          });

    fetchPromise
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isEndUser = user.role === "END_USER";
  const allTickets = isEndUser ? myTickets || [] : [...(tickets?.unassigned || []), ...(tickets?.assigned || [])];
  const totalOpen = isEndUser
    ? allTickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED").length
    : allTickets.length;
  const myAssigned = isEndUser ? 0 : tickets?.assigned.length || 0;
  const resolved = allTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEndUser ? "My Tickets" : "Department Queue"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEndUser
              ? "Track the status of your submitted tickets"
              : "Manage and assign tickets in your department"}
          </p>
        </div>
        <button
          onClick={() => router.push("/tickets/new")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Metric Cards */}
      <div className="mb-8">
        <MetricCards totalOpen={totalOpen} myAssigned={myAssigned} resolved={resolved} />
      </div>

      {/* Ticket Queues */}
      {isEndUser ? (
        <TicketSection
          title="My Tickets"
          tickets={myTickets || []}
          emptyMessage="No tickets yet"
          onTicketClick={(id) => router.push(`/tickets/${id}`)}
        />
      ) : (
        <div className="space-y-8">
          <TicketSection
            title="Unassigned"
            tickets={tickets?.unassigned || []}
            emptyMessage="No unassigned tickets"
            onTicketClick={(id) => router.push(`/tickets/${id}`)}
            showAssignee={false}
          />
          <TicketSection
            title="Assigned"
            tickets={tickets?.assigned || []}
            emptyMessage="No assigned tickets"
            onTicketClick={(id) => router.push(`/tickets/${id}`)}
            showAssignee={true}
          />
        </div>
      )}
    </div>
  );
}

function TicketSection({
  title,
  tickets,
  emptyMessage,
  onTicketClick,
  showAssignee = false,
}: {
  title: string;
  tickets: TicketWithDetails[];
  emptyMessage: string;
  onTicketClick: (id: string) => void;
  showAssignee?: boolean;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </h3>
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {tickets.length}
        </span>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => onTicketClick(ticket.id)}
            showAssignee={showAssignee}
          />
        ))}

        {tickets.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TicketCard({
  ticket,
  onClick,
  showAssignee,
}: {
  ticket: TicketWithDetails;
  onClick: () => void;
  showAssignee: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {ticket.title}
            </h4>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              {ticket.ticketType.name}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ticket.createdBy.name}
            </span>
            {showAssignee && ticket.assignedTo && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                → {ticket.assignedTo.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
          <Clock className="h-3 w-3" />
          {new Date(ticket.createdAt).toLocaleDateString()}
        </div>
      </div>
    </button>
  );
}
