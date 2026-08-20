import { TicketStatus } from "@prisma/client";

/**
 * Centralized env loader — throws at startup if required vars are missing.
 * Avoids cryptic "undefined" errors deep in the app.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_EXPIRY = "15m";

/**
 * Hardcoded pipeline definitions — maps ticket type slug → ordered department slugs.
 * Each ticket type flows through departments left-to-right.
 * Escalation moves the ticket to the next department in the array.
 * Adding a new pipeline is a one-line change here.
 */
export const PIPELINE_STAGES: Record<string, string[]> = {
  "it-hardware": ["help-desk", "tier-2-support", "infrastructure"],
  "software-request": ["help-desk", "tier-2-support"],
  "access-request": ["help-desk", "tier-2-support", "infrastructure"],
};

/**
 * Valid status transitions — enforces the ticket lifecycle state machine.
 * A ticket can only move to statuses listed in its current state's array.
 * CLOSED is terminal (empty array = no transitions out).
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED, TicketStatus.CLOSED],
  IN_PROGRESS: [TicketStatus.OPEN, TicketStatus.ESCALATED, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  ESCALATED: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.OPEN],
  CLOSED: [],
};
