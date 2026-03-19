import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createEvaluation,
  listEvaluations,
  getEvaluation,
  updateEvaluation,
  deleteEvaluation,
  saveFormation,
  getFormation,
  saveAthleteScores,
  getAthleteScores,
} from "../services/evaluation.service";

export async function createEvaluationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { type, title, notes } = req.body as {
    type?: string;
    title?: string;
    notes?: string;
  };
  if (!type || !title) {
    res.status(400).json({ error: "type and title are required" });
    return;
  }
  if (type !== "personal" && type !== "game") {
    res.status(400).json({ error: "type must be 'personal' or 'game'" });
    return;
  }
  try {
    const evaluation = await createEvaluation({ type, title, notes }, req.uid!);
    res.status(201).json({ evaluation });
  } catch (err) {
    console.error("[createEvaluation]", err);
    res.status(500).json({ error: "Failed to create evaluation" });
  }
}

export async function listEvaluationsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const evaluations = await listEvaluations(req.uid!, status);
    res.json({ evaluations });
  } catch (err) {
    console.error("[listEvaluations]", err);
    res.status(500).json({ error: "Failed to list evaluations" });
  }
}

export async function getEvaluationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  try {
    const evaluation = await getEvaluation(id as string);
    if (!evaluation) {
      res.status(404).json({ error: "Evaluation not found" });
      return;
    }
    res.json({ evaluation });
  } catch (err) {
    console.error("[getEvaluation]", err);
    res.status(500).json({ error: "Failed to get evaluation" });
  }
}

export async function updateEvaluationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  try {
    const evaluation = await updateEvaluation(id as string, req.body);
    if (!evaluation) {
      res.status(404).json({ error: "Evaluation not found" });
      return;
    }
    res.json({ evaluation });
  } catch (err) {
    console.error("[updateEvaluation]", err);
    res.status(500).json({ error: "Failed to update evaluation" });
  }
}

export async function deleteEvaluationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  try {
    await deleteEvaluation(id as string);
    res.json({ success: true });
  } catch (err) {
    console.error("[deleteEvaluation]", err);
    res.status(500).json({ error: "Failed to delete evaluation" });
  }
}

export async function saveFormationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  try {
    await saveFormation(id as string, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("[saveFormation]", err);
    res.status(500).json({ error: "Failed to save formation" });
  }
}

export async function getFormationHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  try {
    const formation = await getFormation(id as string);
    res.json({ formation });
  } catch (err) {
    console.error("[getFormation]", err);
    res.status(500).json({ error: "Failed to get formation" });
  }
}

export async function saveAthleteScoresHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id, athleteId } = req.params;
  try {
    await saveAthleteScores(id as string, athleteId as string, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("[saveAthleteScores]", err);
    res.status(500).json({ error: "Failed to save athlete scores" });
  }
}

export async function getAthleteScoresHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id, athleteId } = req.params;
  try {
    const scores = await getAthleteScores(id as string, athleteId as string);
    res.json({ scores });
  } catch (err) {
    console.error("[getAthleteScores]", err);
    res.status(500).json({ error: "Failed to get athlete scores" });
  }
}
