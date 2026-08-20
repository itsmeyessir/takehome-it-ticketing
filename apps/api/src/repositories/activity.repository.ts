import { prisma } from "../config/db.js";
import { ActionType } from "@prisma/client";

/**
 * Logs a structured activity event for a ticket.
 * Called by services after every state change (create, assign, status, escalate).
 * old_value/new_value capture the before/after state for audit trail.
 */
export async function logActivity(data: {
  ticketId: string;
  actorId: string;
  action: ActionType;
  oldValue?: string;
  newValue?: string;
  message?: string;
}) {
  return prisma.activityLog.create({
    data: {
      ticketId: data.ticketId,
      actorId: data.actorId,
      action: data.action,
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      message: data.message || null,
    },
  });
}

/** Returns all activity log entries for a ticket, ordered chronologically with actor info */
export async function getTicketActivities(ticketId: string) {
  return prisma.activityLog.findMany({
    where: { ticketId },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
