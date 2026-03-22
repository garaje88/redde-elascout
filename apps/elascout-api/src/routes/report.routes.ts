import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createReport, checkReportStatus } from "../controllers/report.controller";

export const reportRouter = Router();

reportRouter.use(authMiddleware as any);

// POST /api/reports — generate report async
reportRouter.post("/", createReport as any);

// GET /api/reports/:id/status — check report status
reportRouter.get("/:id/status", checkReportStatus as any);
