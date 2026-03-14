import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { athleteRouter } from "./routes/athlete.routes";

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "elascout-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/athletes", athleteRouter);

app.listen(PORT, () => {
  console.log(`[elascout-api] Running on http://localhost:${PORT}`);
});
