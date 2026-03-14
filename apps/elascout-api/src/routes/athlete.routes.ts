import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createAthlete,
  getAthlete,
  listAthletes,
  updateAthlete,
  deleteAthlete,
} from "../controllers/athlete.controller";

export const athleteRouter = Router();

athleteRouter.use(authMiddleware);

athleteRouter.post("/", createAthlete);
athleteRouter.get("/", listAthletes);
athleteRouter.get("/:id", getAthlete);
athleteRouter.put("/:id", updateAthlete);
athleteRouter.delete("/:id", deleteAthlete);
