import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { generateAndSendReport, getReportStatus } from "../services/report.service";

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const uid = req.uid as string;
    const email = req.email as string;

    const { athleteIds, options, userName } = req.body;

    if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0) {
      res.status(400).json({ error: "athleteIds is required and must be a non-empty array" });
      return;
    }

    if (!options || typeof options !== "object") {
      res.status(400).json({ error: "options is required" });
      return;
    }

    const result = await generateAndSendReport({
      athleteIds,
      options,
      userEmail: email,
      userName,
      uid,
    });

    res.status(202).json({
      message: "Reporte en proceso. Sera enviado a tu correo electronico.",
      reportId: result.reportId,
      email,
    });
  } catch (err) {
    console.error("[createReport]", err);
    const message = err instanceof Error ? err.message : "Failed to generate report";
    res.status(500).json({ error: message });
  }
}

export async function checkReportStatus(req: AuthRequest, res: Response) {
  try {
    const uid = req.uid as string;
    const { id } = req.params;

    const report = await getReportStatus(id as string, uid);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json({ report });
  } catch (err) {
    console.error("[checkReportStatus]", err);
    res.status(500).json({ error: "Failed to check report status" });
  }
}
