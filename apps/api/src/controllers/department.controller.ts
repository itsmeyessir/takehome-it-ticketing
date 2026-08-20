import { Request, Response, NextFunction } from "express";
import * as userRepo from "../repositories/user.repository.js";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await userRepo.findAllDepartments();
    res.json({ data: departments });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const department = await userRepo.findDepartmentById(req.params.id);
    if (!department) {
      res.status(404).json({ error: { message: "Department not found", code: "NOT_FOUND" } });
      return;
    }
    res.json({ data: department });
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const members = await userRepo.findDepartmentMembers(req.params.id);
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
}
