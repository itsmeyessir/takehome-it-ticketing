"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { Inbox, Clock, User, Filter, Search } from "lucide-react";
import type { TicketWithDetails, CurrentUser } from "@shared/index";

export default function MyQueuesPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
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
      .get<TicketWithDetails[]>("/tickets/mine", token)
      .then(setTickets)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading queues...</p>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "open" && ticket.status === "OPEN") ||
      (filter === "in-progress" && ticket.status === "IN_PROGRESS") ||
      (filter === "escalated" && ticket.status === "ESCALATED") ||
      (filter === "resolved" && ticket.status === "RESOLVED");
    const matchesSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Queues</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and filter all your submitted tickets
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Filter className="h-4 w-4 shrink-0 text-slate-500" />
        <div className="flex-1 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "in-progress", label: "In Progress" },
            { value: "escalated", label: "Escalated" },
            { value: "resolved", label: "Resolved" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{tickets.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Open</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">
            {tickets.filter((t) => t.status === "OPEN").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">In Progress</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">
            {tickets.filter((t) => t.status === "IN_PROGRESS").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Resolved</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {tickets.filter((t) => t.status === "RESOLVED").length}
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => router.push(`/tickets/${ticket.id}`)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {ticket.title}
                  </h4>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-sm text-slate-600 truncate mb-2">{ticket.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {ticket.ticketType.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {ticket.createdBy.name}
                  </span>
                  {ticket.assignedTo && (
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
        ))}

        {filteredTickets.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <Inbox className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">No tickets found</p>
            <p className="mt-1 text-xs text-slate-400">
              {search ? "Try a different search term" : "No tickets match the selected filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
