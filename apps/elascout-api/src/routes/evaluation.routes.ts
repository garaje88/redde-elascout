import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createEvaluationHandler,
  listEvaluationsHandler,
  getEvaluationHandler,
  updateEvaluationHandler,
  deleteEvaluationHandler,
  saveFormationHandler,
  getFormationHandler,
  saveAthleteScoresHandler,
  getAthleteScoresHandler,
} from "../controllers/evaluation.controller";

export const evaluationRouter = Router();

evaluationRouter.use(authMiddleware);

evaluationRouter.post("/", createEvaluationHandler);
evaluationRouter.get("/", listEvaluationsHandler);
evaluationRouter.get("/:id", getEvaluationHandler);
evaluationRouter.put("/:id", updateEvaluationHandler);
evaluationRouter.delete("/:id", deleteEvaluationHandler);

evaluationRouter.put("/:id/formation", saveFormationHandler);
evaluationRouter.get("/:id/formation", getFormationHandler);

evaluationRouter.put("/:id/athletes/:athleteId/scores", saveAthleteScoresHandler);
evaluationRouter.get("/:id/athletes/:athleteId/scores", getAthleteScoresHandler);
