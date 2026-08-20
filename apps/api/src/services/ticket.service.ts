import * as ticketRepo from "../repositories/ticket.repository.js";
import * as activityRepo from "../repositories/activity.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import { createError } from "../middleware/error.middleware.js";
import { PIPELINE_STAGES, STATUS_TRANSITIONS } from "../config/constants.js";
import { ActionType, TicketStatus } from "@prisma/client";

/**
 * Creates a new ticket and routes it to the first department in its pipeline.
 * Any authenticated user can create. Status starts as OPEN, assignee is null.
 * Logs a CREATED activity event.
 */
export async function createTicket(
  data: { title: string; description: string; typeId: string },
  userId: string,
  userDepartmentId: string
) {
  // Look up the ticket type and resolve its pipeline
  const ticketTypes = await ticketRepo.findAllTicketTypes();
  const ticketType = ticketTypes.find((t) => t.id === data.typeId);
  if (!ticketType) {
    throw createError("Ticket type not found", 404, "NOT_FOUND");
  }

  const pipelineKey = ticketType.name.toLowerCase().replace(/\s+/g, "-");
  const pipeline = PIPELINE_STAGES[pipelineKey];
  if (!pipeline || pipeline.length === 0) {
    throw createError("No pipeline defined for this ticket type", 400, "INVALID_PIPELINE");
  }

  // Route to the first department in the pipeline
  const departments = await userRepo.findAllDepartments();
  const firstDept = departments.find((d) => d.slug === pipeline[0]);
  if (!firstDept) {
    throw createError("First department in pipeline not found", 500, "PIPELINE_ERROR");
  }

  const ticket = await ticketRepo.createTicket({
    title: data.title,
    description: data.description,
    typeId: data.typeId,
    createdById: userId,
    currentDepartmentId: firstDept.id,
  });

  await activityRepo.logActivity({
    ticketId: ticket.id,
    actorId: userId,
    action: ActionType.CREATED,
  });

  return ticket;
}

/**
 * Fetches a single ticket with access control.
 * - END_USER: can only view tickets they created
 * - DEPARTMENT_MEMBER: can view tickets in their department OR tickets they created
 *   (the creator check allows users to track their own tickets even after escalation)
 */
export async function getTicket(ticketId: string, userId: string, userRole: string, userDepartmentId: string) {
  const ticket = await ticketRepo.findTicketById(ticketId);
  if (!ticket) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  // END_USER can only view tickets they created
  if (userRole === "END_USER" && ticket.createdById !== userId) {
    throw createError("Access denied", 403, "FORBIDDEN");
  }

  // DEPARTMENT_MEMBER can view tickets in their department OR tickets they created
  if (userRole === "DEPARTMENT_MEMBER" && ticket.currentDepartmentId !== userDepartmentId && ticket.createdById !== userId) {
    throw createError("Access denied — ticket not in your department", 403, "FORBIDDEN");
  }

  return ticket;
}

/**
 * Returns all tickets in a department, split into unassigned and assigned queues.
 * Supports pagination via limit/offset query params.
 */
export async function getDepartmentTickets(departmentId: string, limit?: number, offset?: number) {
  const tickets = await ticketRepo.findTicketsByDepartment(departmentId, limit, offset);
  return {
    unassigned: tickets.filter((t) => !t.assignedToId),
    assigned: tickets.filter((t) => t.assignedToId),
  };
}

/**
 * Returns tickets created by a specific user (across all departments).
 * Used by END_USER dashboard and My Queues page. Supports pagination.
 */
export async function getUserTickets(userId: string, limit?: number, offset?: number) {
  return ticketRepo.findTicketsByUser(userId, limit, offset);
}

/**
 * Assigns a ticket to a department member. Validates:
 * 1. Actor is in the same department as the ticket
 * 2. Assignee is in the same department as the actor
 * Logs ASSIGNED (first time) or REASSIGNED (subsequent) activity.
 */
export async function assignTicket(
  ticketId: string,
  assigneeId: string,
  actorId: string,
  actorDepartmentId: string
) {
  const ticket = await ticketRepo.findTicketById(ticketId);
  if (!ticket) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  if (ticket.currentDepartmentId !== actorDepartmentId) {
    throw createError("Ticket not in your department", 403, "FORBIDDEN");
  }

  const assignee = await userRepo.findUserById(assigneeId);
  if (!assignee || assignee.departmentId !== actorDepartmentId) {
    throw createError("Assignee not in your department", 400, "INVALID_ASSIGNEE");
  }

  const oldAssignee = ticket.assignedToId;
  const updated = await ticketRepo.assignTicket(ticketId, assigneeId);

  await activityRepo.logActivity({
    ticketId,
    actorId,
    action: oldAssignee ? ActionType.REASSIGNED : ActionType.ASSIGNED,
    oldValue: oldAssignee || "Unassigned",
    newValue: assignee.name,
  });

  return updated;
}

/**
 * Updates ticket status with transition validation.
 * Only allows transitions defined in STATUS_TRANSITIONS (state machine).
 * Logs STATUS_CHANGE with old → new status and optional remark.
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  remark: string | undefined,
  actorId: string,
  actorDepartmentId: string
) {
  const ticket = await ticketRepo.findTicketById(ticketId);
  if (!ticket) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  if (ticket.currentDepartmentId !== actorDepartmentId) {
    throw createError("Ticket not in your department", 403, "FORBIDDEN");
  }

  // Validate the status transition is allowed from current state
  const allowed = STATUS_TRANSITIONS[ticket.status];
  if (!allowed.includes(newStatus)) {
    throw createError(
      `Cannot transition from ${ticket.status} to ${newStatus}`,
      400,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const updated = await ticketRepo.updateTicketStatus(ticketId, newStatus);

  await activityRepo.logActivity({
    ticketId,
    actorId,
    action: ActionType.STATUS_CHANGE,
    oldValue: ticket.status,
    newValue: newStatus,
    message: remark,
  });

  return updated;
}

/**
 * Escalates a ticket to the next department in its pipeline.
 * Validates the current department isn't the last in the pipeline.
 * Sets status to ESCALATED, clears assignee (next dept re-assigns).
 * Logs ESCALATED with from → to department names and optional message.
 */
export async function escalateTicket(
  ticketId: string,
  message: string | undefined,
  actorId: string,
  actorDepartmentId: string
) {
  const ticket = await ticketRepo.findTicketById(ticketId);
  if (!ticket) {
    throw createError("Ticket not found", 404, "NOT_FOUND");
  }

  if (ticket.currentDepartmentId !== actorDepartmentId) {
    throw createError("Ticket not in your department", 403, "FORBIDDEN");
  }

  // Resolve the pipeline for this ticket type
  const ticketType = await ticketRepo.findAllTicketTypes();
  const type = ticketType.find((t) => t.id === ticket.typeId);
  if (!type) {
    throw createError("Ticket type not found", 404, "NOT_FOUND");
  }

  const pipelineKey = type.name.toLowerCase().replace(/\s+/g, "-");
  const pipeline = PIPELINE_STAGES[pipelineKey];
  if (!pipeline) {
    throw createError("No pipeline defined", 400, "INVALID_PIPELINE");
  }

  // Find current position in pipeline and determine next department
  const currentDept = await userRepo.findDepartmentById(ticket.currentDepartmentId);
  const currentIndex = pipeline.indexOf(currentDept?.slug || "");

  if (currentIndex === -1 || currentIndex >= pipeline.length - 1) {
    throw createError("Ticket is already at the last department in the pipeline", 400, "PIPELINE_END");
  }

  const nextDeptSlug = pipeline[currentIndex + 1];
  const departments = await userRepo.findAllDepartments();
  const nextDept = departments.find((d) => d.slug === nextDeptSlug);
  if (!nextDept) {
    throw createError("Next department not found", 500, "PIPELINE_ERROR");
  }

  const updated = await ticketRepo.escalateTicket(ticketId, nextDept.id);

  await activityRepo.logActivity({
    ticketId,
    actorId,
    action: ActionType.ESCALATED,
    oldValue: currentDept?.name,
    newValue: nextDept.name,
    message: message || undefined,
  });

  return updated;
}
