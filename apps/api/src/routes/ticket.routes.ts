import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { z } from "zod";

/**
 * Ticket routes — all routes require authentication (router.use(authenticate)).
 *
 * GET  /              → Department queue (unassigned + assigned)
 * GET  /mine           → Current user's created tickets
 * GET  /:id            → Single ticket detail (with access control)
 * POST /               → Create new ticket (routes to first pipeline dept)
 * PATCH /:id/status    → Update ticket status (validated transitions)
 * POST /:id/assign     → Assign ticket to department member
 * POST /:id/escalate   → Escalate to next department in pipeline
 * GET  /:id/activities → Activity log for a ticket
 */
const router = Router();

const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  typeId: z.string(),
});

const assignSchema = z.object({
  assigneeId: z.string(),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"]),
  remark: z.string().optional(),
});

const escalateSchema = z.object({
  message: z.string().optional(),
});

router.use(authenticate);

router.get("/", ticketController.getDepartmentTickets);
router.get("/mine", ticketController.getUserTickets);
router.get("/:id", ticketController.getById);
router.post("/", validate(createTicketSchema), ticketController.create);
router.patch("/:id/status", validate(statusSchema), ticketController.updateStatus);
router.post("/:id/assign", validate(assignSchema), ticketController.assign);
router.post("/:id/escalate", validate(escalateSchema), ticketController.escalate);
router.get("/:id/activities", ticketController.getActivities);

export default router;
