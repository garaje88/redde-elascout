import { Request, Response } from "express";
import { adminAuth } from "../config/firebase";
import { findOrCreateUser } from "../services/user.service";

export async function verifyToken(
  req: Request,
  res: Response
): Promise<void> {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await findOrCreateUser({
      uid: decoded.uid,
      email: decoded.email || "",
      displayName: decoded.name || "",
      photoURL: decoded.picture || "",
    });

    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
