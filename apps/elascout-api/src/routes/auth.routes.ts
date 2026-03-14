import { Router } from "express";
import { verifyToken } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/verify", verifyToken);
