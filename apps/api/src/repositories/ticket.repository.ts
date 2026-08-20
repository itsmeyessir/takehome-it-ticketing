import { prisma } from "../config/db.js";
import { Ticket, TicketStatus } from "@prisma/client";

/**
 * Fetches a ticket with all related data (creator, assignee, department, type, activities).
 * Activities are included inline so the frontend makes a single API call.
 */
export async function findTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      currentDepartment: { select: { id: true, name: true, slug: true } },
      ticketType: { select: { id: true, name: true } },
      activities: {
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Returns all tickets in a department's queue (with pagination) */
export async function findTicketsByDepartment(departmentId: string, limit = 50, offset = 0) {
  return prisma.ticket.findMany({
    where: { currentDepartmentId: departmentId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      ticketType: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/** Returns tickets created by a user (with pagination) */
export async function findTicketsByUser(userId: string, limit = 50, offset = 0) {
  return prisma.ticket.findMany({
    where: { createdById: userId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      currentDepartment: { select: { id: true, name: true, slug: true } },
      ticketType: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/** Creates a new ticket with OPEN status in the first pipeline department */
export async function createTicket(data: {
  title: string;
  description: string;
  typeId: string;
  createdById: string;
  currentDepartmentId: string;
}): Promise<Ticket> {
  return prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      typeId: data.typeId,
      createdById: data.createdById,
      currentDepartmentId: data.currentDepartmentId,
      status: "OPEN",
    },
  });
}

/** Updates ticket status only (used by status change endpoint) */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<Ticket> {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
  });
}

/** Updates ticket assignee only (null = unassigned) */
export async function assignTicket(
  ticketId: string,
  assigneeId: string | null
): Promise<Ticket> {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToId: assigneeId },
  });
}

/**
 * Escalates ticket: sets status=ESCALATED, clears assignee,
 * moves to next department — all in a single atomic update.
 */
export async function escalateTicket(
  ticketId: string,
  newDepartmentId: string
): Promise<Ticket> {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "ESCALATED",
      assignedToId: null,
      currentDepartmentId: newDepartmentId,
    },
  });
}

/** Returns all ticket types for new ticket form and pipeline resolution */
export async function findAllTicketTypes() {
  return prisma.ticketType.findMany({ orderBy: { name: "asc" } });
}
