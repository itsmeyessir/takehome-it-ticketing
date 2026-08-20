import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service.js";
import * as activityRepo from "../repositories/activity.repository.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.createTicket(
      req.body,
      req.user!.userId,
      req.user!.departmentId
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.getTicket(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.user!.departmentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const result = await ticketService.getDepartmentTickets(req.user!.departmentId, limit, offset);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUserTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const result = await ticketService.getUserTickets(req.user!.userId, limit, offset);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function assign(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.assignTicket(
      req.params.id,
      req.body.assigneeId,
      req.user!.userId,
      req.user!.departmentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.updateTicketStatus(
      req.params.id,
      req.body.status,
      req.body.remark,
      req.user!.userId,
      req.user!.departmentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function escalate(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.escalateTicket(
      req.params.id,
      req.body.message,
      req.user!.userId,
      req.user!.departmentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getActivities(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const result = await activityRepo.getTicketActivities(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
