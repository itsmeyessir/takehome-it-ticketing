import { Router } from "express";
import * as departmentController from "../controllers/department.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public endpoint for registration (no auth required)
router.get("/", departmentController.list);

// Protected endpoints
router.get("/:id", authenticate, departmentController.getById);
router.get("/:id/members", authenticate, departmentController.getMembers);

export default router;
