import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createAthlete as createAthleteSvc,
  getAthleteById,
  listAthletes as listAthletesSvc,
  updateAthlete as updateAthleteSvc,
  deleteAthlete as deleteAthleteSvc,
} from "../services/athlete.service";

export async function createAthlete(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { firstName, lastName, dateOfBirth, nationality, contactEmail, contactPhone } = req.body;

  if (!firstName || !lastName || !dateOfBirth || !nationality || !contactEmail || !contactPhone) {
    res.status(400).json({
      error: "firstName, lastName, dateOfBirth, nationality, contactEmail and contactPhone are required",
    });
    return;
  }

  try {
    const athlete = await createAthleteSvc(req.body, req.uid!);
    res.status(201).json({ athlete });
  } catch (err) {
    console.error("[createAthlete] uid=%s error:", req.uid, err);
    res.status(500).json({ error: "Failed to create athlete" });
  }
}

export async function getAthlete(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const athlete = await getAthleteById(id as string);

    if (!athlete) {
      res.status(404).json({ error: "Athlete not found" });
      return;
    }

    res.json({ athlete });
  } catch (err) {
    console.error("[getAthlete] id=%s error:", id, err);
    res.status(500).json({ error: "Failed to get athlete" });
  }
}

export async function listAthletes(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const {
    search,
    organizationId,
    nationality,
    position,
    ageRange,
    club,
    limit = "20",
    startAfter,
  } = req.query as Record<string, string>;

  try {
    console.log("[listAthletes] uid=%s orgId=%s search=%s limit=%s", req.uid, organizationId, search, limit);

    const result = await listAthletesSvc(
      { organizationId, search, nationality, position, ageRange, club },
      {
        limit: Math.min(parseInt(limit, 10) || 20, 100),
        startAfter,
      }
    );

    console.log("[listAthletes] found %d athletes, hasMore=%s", result.athletes.length, result.hasMore);
    res.json(result);
  } catch (err) {
    console.error("[listAthletes] uid=%s error:", req.uid, err);
    res.status(500).json({ error: "Failed to list athletes" });
  }
}

export async function updateAthlete(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const athlete = await updateAthleteSvc(id as string, req.body, req.uid!);

    if (!athlete) {
      res.status(404).json({ error: "Athlete not found" });
      return;
    }

    res.json({ athlete });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not authorized to update this athlete" });
      return;
    }
    console.error("[updateAthlete] id=%s uid=%s error:", id, req.uid, err);
    res.status(500).json({ error: "Failed to update athlete" });
  }
}

export async function deleteAthlete(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const deleted = await deleteAthleteSvc(id as string, req.uid!);

    if (!deleted) {
      res.status(404).json({ error: "Athlete not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not authorized to delete this athlete" });
      return;
    }
    console.error("[deleteAthlete] id=%s uid=%s error:", id, req.uid, err);
    res.status(500).json({ error: "Failed to delete athlete" });
  }
}
