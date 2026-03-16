/**
 * Cloudflare Workers entry point for elascout-api.
 * Replaces the Express/firebase-admin stack with Hono + Firestore REST API.
 *
 * All environment variables are injected as Worker secrets via wrangler.toml.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

import { getServiceAccountToken } from "./lib/service-account";
import { FirestoreRest, SERVER_TIMESTAMP } from "./lib/firestore-rest";
import { verifyFirebaseToken } from "./lib/auth-verify";

// ─── Environment bindings ─────────────────────────────────────────────────────

type Env = {
  /** Firebase project ID (e.g. "my-project-id") */
  FIREBASE_PROJECT_ID: string;
  /** Firebase service account email */
  FIREBASE_CLIENT_EMAIL: string;
  /**
   * Firebase service account private key (PEM format).
   * Use "-----BEGIN PRIVATE KEY-----" (PKCS#8) or
   * "-----BEGIN RSA PRIVATE KEY-----" (PKCS#1) — both are handled.
   * In wrangler secrets, replace literal \n with actual newlines.
   */
  FIREBASE_PRIVATE_KEY: string;
  /** Google OAuth client ID used to validate Firebase tokens */
  GOOGLE_CLIENT_ID: string;
  /** Allowed CORS origin, e.g. "https://elascout.pages.dev" */
  CORS_ORIGIN: string;
};

// ─── Context variables ────────────────────────────────────────────────────────

type Variables = {
  uid: string;
  email: string;
  db: FirestoreRest;
};

// ─── App setup ────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  const corsOrigin = c.env.CORS_ORIGIN ?? "http://localhost:3000";
  return cors({ origin: corsOrigin, credentials: true })(c, next);
});

/** Attach a Firestore client to the context. */
app.use("*", async (c, next) => {
  const getToken = () =>
    getServiceAccountToken(
      c.env.FIREBASE_CLIENT_EMAIL,
      c.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    );
  c.set("db", new FirestoreRest(c.env.FIREBASE_PROJECT_ID, getToken));
  await next();
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (c) => c.json({ status: "ok", service: "elascout-api" }));

// ─── Auth middleware (for protected routes) ───────────────────────────────────

async function authMiddleware(
  c: Parameters<Parameters<typeof app.use>[1]>[0],
  next: () => Promise<void>
) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const { uid, email } = await verifyFirebaseToken(
      token,
      c.env.FIREBASE_PROJECT_ID
    );
    c.set("uid", uid);
    c.set("email", email);
    await next();
  } catch (err) {
    console.error("[auth] Token verification failed:", (err as Error).message);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

// ─── Auth routes ──────────────────────────────────────────────────────────────

app.post("/api/auth/verify", async (c) => {
  const body = await c.req.json<{ idToken?: string }>();
  if (!body.idToken) return c.json({ error: "idToken is required" }, 400);

  try {
    const { uid, email } = await verifyFirebaseToken(
      body.idToken,
      c.env.FIREBASE_PROJECT_ID
    );

    const db = c.get("db");

    // Find or create user in Firestore
    const existing = await db.getDoc("users", uid);

    if (existing) {
      await db.updateDoc("users", uid, { updatedAt: SERVER_TIMESTAMP });
      return c.json({ user: existing });
    }

    const newUser = {
      uid,
      email,
      displayName: "",
      photoURL: "",
      mode: null,
      organizationId: null,
      role: null,
      createdAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    };

    const created = await db.setDoc("users", uid, newUser);
    return c.json({ user: created });
  } catch (err) {
    console.error("[auth/verify]", (err as Error).message);
    return c.json({ error: "Invalid token" }, 401);
  }
});

// ─── Athlete routes (all protected) ──────────────────────────────────────────

function calcAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

app.post("/api/athletes", authMiddleware, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const { firstName, lastName, dateOfBirth, nationality } = body;

  if (!firstName || !lastName || !dateOfBirth || !nationality) {
    return c.json(
      { error: "firstName, lastName, dateOfBirth, and nationality are required" },
      400
    );
  }

  try {
    const db = c.get("db");
    const uid = c.get("uid");
    const id = db.newId();

    const athlete = {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      photoURL: body.photoURL ?? null,
      organizationId: body.organizationId ?? null,
      position: body.position ?? null,
      secondaryPosition: body.secondaryPosition ?? null,
      preferredFoot: body.preferredFoot ?? null,
      height: body.height ?? null,
      weight: body.weight ?? null,
      currentClub: body.currentClub ?? null,
      contractEnd: body.contractEnd ?? null,
      clubHistory: body.clubHistory ?? [],
      titles: body.titles ?? [],
      createdBy: uid,
      createdAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    };

    const created = await db.setDoc("athletes", id, athlete);
    return c.json({ athlete: { id, ...created } }, 201);
  } catch (err) {
    console.error("[createAthlete]", err);
    return c.json({ error: "Failed to create athlete" }, 500);
  }
});

app.get("/api/athletes", authMiddleware, async (c) => {
  const {
    search,
    organizationId,
    nationality,
    position,
    ageRange,
    club,
    limit: limitStr = "20",
  } = c.req.query();

  const uid = c.get("uid");
  const db = c.get("db");
  const limit = Math.min(parseInt(limitStr, 10) || 20, 100);

  try {
    const filters: Array<{ field: string; op: string; value: unknown }> = [];

    if (organizationId) {
      filters.push({ field: "organizationId", op: "==", value: organizationId });
    } else {
      filters.push({ field: "createdBy", op: "==", value: uid });
    }

    let results = await db.query(
      "athletes",
      filters,
      [{ field: "createdAt", direction: "DESCENDING" }],
      500
    );

    // In-memory filters (Firestore doesn't support full-text / range-by-age)
    if (nationality) {
      const nat = nationality.toLowerCase();
      results = results.filter(
        (a) => typeof a.nationality === "string" && a.nationality.toLowerCase() === nat
      );
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (a) =>
          (typeof a.firstName === "string" && a.firstName.toLowerCase().includes(q)) ||
          (typeof a.lastName === "string" && a.lastName.toLowerCase().includes(q))
      );
    }

    if (position) {
      const pos = position.toLowerCase();
      results = results.filter(
        (a) => typeof a.position === "string" && a.position.toLowerCase() === pos
      );
    }

    if (ageRange) {
      const [minStr, maxStr] = ageRange.split("-");
      const minAge = parseInt(minStr ?? "", 10);
      const maxAge = parseInt(maxStr ?? "", 10);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        results = results.filter((a) => {
          if (typeof a.dateOfBirth !== "string") return false;
          const age = calcAge(a.dateOfBirth);
          return age >= minAge && age <= maxAge;
        });
      }
    }

    if (club) {
      const clubQ = club.toLowerCase();
      results = results.filter(
        (a) =>
          typeof a.currentClub === "string" &&
          a.currentClub.toLowerCase().includes(clubQ)
      );
    }

    const paginated = results.slice(0, limit);
    return c.json({ athletes: paginated, hasMore: results.length > limit });
  } catch (err) {
    console.error("[listAthletes]", err);
    return c.json({ error: "Failed to list athletes" }, 500);
  }
});

app.get("/api/athletes/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const athlete = await db.getDoc("athletes", id);
    if (!athlete) return c.json({ error: "Athlete not found" }, 404);
    return c.json({ athlete: { id, ...athlete } });
  } catch (err) {
    console.error("[getAthlete]", err);
    return c.json({ error: "Failed to get athlete" }, 500);
  }
});

app.put("/api/athletes/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const existing = await db.getDoc("athletes", id);
    if (!existing) return c.json({ error: "Athlete not found" }, 404);
    if (existing.createdBy !== uid) {
      return c.json({ error: "Not authorized to update this athlete" }, 403);
    }

    const body = await c.req.json<Record<string, unknown>>();
    const updated = await db.updateDoc("athletes", id, {
      ...body,
      updatedAt: SERVER_TIMESTAMP,
    });
    return c.json({ athlete: { id, ...updated } });
  } catch (err) {
    console.error("[updateAthlete]", err);
    return c.json({ error: "Failed to update athlete" }, 500);
  }
});

app.delete("/api/athletes/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const existing = await db.getDoc("athletes", id);
    if (!existing) return c.json({ error: "Athlete not found" }, 404);
    if (existing.createdBy !== uid) {
      return c.json({ error: "Not authorized to delete this athlete" }, 403);
    }

    await db.deleteDoc("athletes", id);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[deleteAthlete]", err);
    return c.json({ error: "Failed to delete athlete" }, 500);
  }
});

// ─── Evaluation routes ────────────────────────────────────────────────────────

app.get("/api/athletes/:id/evaluations", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const athlete = await db.getDoc("athletes", id);
    if (!athlete) return c.json({ error: "Athlete not found" }, 404);

    // Evaluations are stored as a subcollection: athletes/{id}/evaluations
    const evaluations = await db.query(
      `athletes/${id}/evaluations`,
      [],
      [{ field: "date", direction: "DESCENDING" }]
    );
    return c.json({ evaluations });
  } catch (err) {
    console.error("[listEvaluations]", err);
    return c.json({ error: "Failed to list evaluations" }, 500);
  }
});

app.post("/api/athletes/:id/evaluations", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const athlete = await db.getDoc("athletes", id);
    if (!athlete) return c.json({ error: "Athlete not found" }, 404);

    const body = await c.req.json<Record<string, unknown>>();
    const evalId = db.newId();

    const evaluation = {
      ...body,
      evaluatorId: uid,
      createdAt: SERVER_TIMESTAMP,
    };

    const created = await db.setDoc(
      `athletes/${id}/evaluations`,
      evalId,
      evaluation
    );
    return c.json({ evaluation: { id: evalId, ...created } }, 201);
  } catch (err) {
    console.error("[createEvaluation]", err);
    return c.json({ error: "Failed to create evaluation" }, 500);
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default app;
