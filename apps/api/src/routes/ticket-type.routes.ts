import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { findAllTicketTypes } from "../repositories/ticket.repository.js";

const router = Router();

router.use(authenticate);

router.get("/", async (_req, res, next) => {
  try {
    const types = await findAllTicketTypes();
    res.json({ data: types });
  } catch (err) {
    next(err);
  }
});

export default router;
