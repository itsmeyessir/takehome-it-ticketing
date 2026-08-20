"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  MessageSquare,
  Send,
  ChevronRight,
} from "lucide-react";
import type { TicketWithDetails, User as UserType, CurrentUser, TicketStatus } from "@shared/index";
import { STATUS_TRANSITIONS } from "@shared/index";

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [members, setMembers] = useState<Pick<UserType, "id" | "name" | "email">[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [escalateMessage, setEscalateMessage] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);

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

    // Single API call — activities are embedded in the ticket response
    api.get<TicketWithDetails>(`/tickets/${ticketId}`, token)
      .then((ticketData) => {
        setTicket(ticketData);
        return api.get<UserType[]>(`/departments/${ticketData.currentDepartmentId}/members`, token);
      })
      .then(setMembers)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [ticketId, token, router]);

  async function handleAssign(assigneeId: string) {
    try {
      setActionError("");
      await api.post(`/tickets/${ticketId}/assign`, { assigneeId }, token);
      const updated = await api.get<TicketWithDetails>(`/tickets/${ticketId}`, token);
      setTicket(updated);
    } catch (err: any) {
      setActionError(err.message || "Failed to assign ticket");
    }
  }

  async function handleStatusChange(status: string, remark?: string) {
    try {
      setActionError("");
      await api.patch(`/tickets/${ticketId}/status`, { status, remark }, token);
      const updated = await api.get<TicketWithDetails>(`/tickets/${ticketId}`, token);
      setTicket(updated);
    } catch (err: any) {
      setActionError(err.message || "Failed to update status");
    }
  }

  async function handleEscalate() {
    try {
      setActionError("");
      await api.post(`/tickets/${ticketId}/escalate`, { message: escalateMessage || undefined }, token);
      const updated = await api.get<TicketWithDetails>(`/tickets/${ticketId}`, token);
      setTicket(updated);
      setShowEscalate(false);
      setEscalateMessage("");
    } catch (err: any) {
      setActionError(err.message || "Failed to escalate ticket");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket || !user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Queue
      </button>

      {actionError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{ticket.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {ticket.ticketType.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {ticket.createdBy.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Activity Log
            </h3>
            <div className="space-y-4">
              {(ticket.activities || []).map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                      {activity.actor.name.charAt(0)}
                    </div>
                    {index < (ticket.activities || []).length - 1 && (
                      <div className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {activity.actor.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {activity.action === "CREATED"
                          ? "created this ticket"
                          : activity.action.toLowerCase().replaceAll("_", " ")}
                      </span>
                    </div>
                    {activity.oldValue && activity.action !== "CREATED" && (
                      <p className="mt-1 text-xs text-slate-500">
                        From: <span className="font-medium">{activity.oldValue}</span>
                        {activity.newValue && (
                          <> → <span className="font-medium">{activity.newValue}</span></>
                        )}
                      </p>
                    )}
                    {activity.message && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        {activity.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Assign */}
          {ticket.status !== "CLOSED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assign To
              </h4>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={ticket.assignedToId || ""}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Change */}
          {ticket.status !== "CLOSED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                Change Status
              </h4>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${STATUS_TRANSITIONS[ticket.status as TicketStatus].length === 4 ? 2 : STATUS_TRANSITIONS[ticket.status as TicketStatus].length}, minmax(0, 1fr))` }}
              >
                {STATUS_TRANSITIONS[ticket.status as TicketStatus].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Escalate */}
          {ticket.status !== "CLOSED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Escalate
              </h4>
              {showEscalate ? (
                <div className="space-y-3">
                  <textarea
                    value={escalateMessage}
                    onChange={(e) => setEscalateMessage(e.target.value)}
                    placeholder="Optional message for next department..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEscalate}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => setShowEscalate(false)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEscalate(true)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  Escalate to Next Department
                </button>
              )}
            </div>
          )}

          {/* Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Details
            </h4>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Department</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {ticket.currentDepartment.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Created</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Last Updated</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
