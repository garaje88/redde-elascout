import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase";
import { OAuth2Client } from "google-auth-library";

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const oauthClient = googleClientId ? new OAuth2Client(googleClientId) : null;

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  // Strategy 1: Try Firebase ID token
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    console.log("[auth] Firebase token verified: uid=%s email=%s", decoded.uid, decoded.email);
    next();
    return;
  } catch (err) {
    console.log("[auth] Firebase token verification failed, trying Google OIDC...", (err as Error).message);
  }

  // Strategy 2: Try Google OIDC ID token
  if (oauthClient && googleClientId) {
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        res.status(401).json({ error: "Google token missing email" });
        return;
      }

      // Find or create Firebase user for this Google account
      let firebaseUser;
      try {
        firebaseUser = await adminAuth.getUserByEmail(payload.email);
      } catch {
        // User doesn't exist in Firebase Auth — create them
        firebaseUser = await adminAuth.createUser({
          email: payload.email,
          displayName: payload.name,
          photoURL: payload.picture,
        });
      }

      req.uid = firebaseUser.uid;
      req.email = firebaseUser.email;
      console.log("[auth] Google OIDC verified: uid=%s email=%s", firebaseUser.uid, firebaseUser.email);
      next();
      return;
    } catch (err) {
      console.error("[auth] Google OIDC verification failed:", (err as Error).message);
    }
  }

  res.status(401).json({ error: "Invalid or expired token" });
}
