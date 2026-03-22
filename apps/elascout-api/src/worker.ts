/**
 * Cloudflare Workers entry point for elascout-api.
 * Replaces the Express/firebase-admin stack with Hono + Firestore REST API.
 *
 * All environment variables are injected as Worker secrets via wrangler.toml.
 */

import { Hono, type Context } from "hono";
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
  /** Anthropic API key for Claude AI report generation */
  ANTHROPIC_API_KEY: string;
  /** Resend API key for sending report emails */
  RESEND_API_KEY: string;
  /** Resend sender address. Default: onboarding@resend.dev (testing). Verify domain for production. */
  RESEND_FROM?: string;
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
  c: Context<{ Bindings: Env; Variables: Variables }>,
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
      representative: body.representative ?? null,
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
  const { id: athleteId } = c.req.param();
  const db = c.get("db");

  try {
    const athlete = await db.getDoc("athletes", athleteId);
    if (!athlete) return c.json({ error: "Athlete not found" }, 404);

    // Query athleteScores subcollection across all evaluations using collectionGroup
    const scoresDocs = await db.collectionGroupQuery(
      "athleteScores",
      [{ field: "athleteId", op: "==", value: athleteId }],
      [{ field: "updatedAt", direction: "DESCENDING" }]
    );

    // For each score doc, fetch the parent evaluation title
    const evaluations = await Promise.all(
      scoresDocs.map(async (scoreDoc) => {
        const evalId = (scoreDoc.evaluationId as string) ?? "";
        let evaluationTitle = "Evaluación";
        let date = (scoreDoc.updatedAt as string) ?? "";

        if (evalId) {
          try {
            const evalDoc = await db.getDoc("evaluations", evalId);
            if (evalDoc) {
              evaluationTitle = (evalDoc.title as string) ?? "Evaluación";
              date = (evalDoc.startedAt as string) ?? date;
            }
          } catch { /* ignore */ }
        }

        return {
          evaluationId: evalId,
          evaluationTitle,
          date,
          scores: scoreDoc,
        };
      })
    );

    return c.json({ evaluations });
  } catch (err) {
    console.error("[listAthleteEvaluations]", err);
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

// ─── Evaluation Session routes ────────────────────────────────────────────────

type EvaluationType = "personal" | "game";
type EvaluationStatus = "active" | "completed" | "expired";

interface PhysicalScores {
  velocidad: number;
  aceleracionCorta: number;
  fuerzaDuelos: number;
  resistencia: number;
  potencia: number;
  reaccion: number;
  saquesLargos: number;
  saquesCortos: number;
}

interface TechnicalScores {
  pase: number;
  control: number;
  regate: number;
  disparo: number;
  cabecea: number;
  presion: number;
}

interface TacticalScores {
  posicionamiento: number;
  marcaje: number;
  desmarque: number;
  transicion: number;
}

interface FieldPosition { x: number; y: number; }

interface AthleteEvaluation {
  athleteId: string;
  team?: "home" | "away";
  isSubstitute?: boolean;
  fieldPosition?: FieldPosition;
  physical?: PhysicalScores;
  technical?: TechnicalScores;
  tactical?: TacticalScores;
  notes?: string;
}

interface GameFormation {
  homeTeam: { name: string; formation: string; color: string; };
  awayTeam: { name: string; formation: string; color: string; };
  athletes: AthleteEvaluation[];
}

function isExpired(startedAt: string): boolean {
  return Date.now() - new Date(startedAt).getTime() > 90 * 60 * 1000;
}

// POST /api/evaluations — crear sesión de evaluación
app.post("/api/evaluations", authMiddleware, async (c) => {
  const uid = c.get("uid");
  const db = c.get("db");
  const body = await c.req.json<{ type?: string; title?: string; notes?: string }>();

  if (!body.type || !body.title) {
    return c.json({ error: "type and title are required" }, 400);
  }
  if (body.type !== "personal" && body.type !== "game") {
    return c.json({ error: "type must be 'personal' or 'game'" }, 400);
  }

  try {
    const id = db.newId();
    const now = new Date().toISOString();
    const evaluation = {
      type: body.type as EvaluationType,
      title: body.title,
      notes: body.notes ?? null,
      status: "active" as EvaluationStatus,
      createdBy: uid,
      organizationId: null,
      formation: null,
      startedAt: now,
      closedAt: null,
      createdAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    };
    const created = await db.setDoc("evaluations", id, evaluation);
    return c.json({ evaluation: { id, ...created } }, 201);
  } catch (err) {
    console.error("[createEvaluationSession]", err);
    return c.json({ error: "Failed to create evaluation" }, 500);
  }
});

// GET /api/evaluations — listar evaluaciones del usuario
app.get("/api/evaluations", authMiddleware, async (c) => {
  const uid = c.get("uid");
  const db = c.get("db");
  const { status } = c.req.query();

  try {
    const filters: Array<{ field: string; op: string; value: unknown }> = [
      { field: "createdBy", op: "==", value: uid },
    ];
    let results = await db.query(
      "evaluations",
      filters,
      [{ field: "createdAt", direction: "DESCENDING" }],
      200
    );

    // Virtual expiry: mark active evaluations as expired in the response
    results = results.map((ev) => {
      if (
        ev.status === "active" &&
        typeof ev.startedAt === "string" &&
        isExpired(ev.startedAt)
      ) {
        return { ...ev, status: "expired" };
      }
      return ev;
    });

    if (status) {
      results = results.filter((ev) => ev.status === status);
    }

    return c.json({ evaluations: results });
  } catch (err) {
    console.error("[listEvaluationSessions]", err);
    return c.json({ error: "Failed to list evaluations" }, 500);
  }
});

// GET /api/evaluations/:id
app.get("/api/evaluations/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    // Virtual expiry
    const evaluation =
      ev.status === "active" &&
      typeof ev.startedAt === "string" &&
      isExpired(ev.startedAt)
        ? { ...ev, status: "expired" }
        : ev;

    return c.json({ evaluation: { id, ...evaluation } });
  } catch (err) {
    console.error("[getEvaluationSession]", err);
    return c.json({ error: "Failed to get evaluation" }, 500);
  }
});

// PUT /api/evaluations/:id — actualizar estado/notas
app.put("/api/evaluations/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    const body = await c.req.json<Record<string, unknown>>();
    // Prevent overwriting protected fields
    const { id: _id, createdBy: _cb, createdAt: _ca, ...safe } = body;
    void _id; void _cb; void _ca;

    const updated = await db.updateDoc("evaluations", id, {
      ...safe,
      updatedAt: SERVER_TIMESTAMP,
    });
    return c.json({ evaluation: { id, ...updated } });
  } catch (err) {
    console.error("[updateEvaluationSession]", err);
    return c.json({ error: "Failed to update evaluation" }, 500);
  }
});

// DELETE /api/evaluations/:id
app.delete("/api/evaluations/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    await db.deleteDoc("evaluations", id);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[deleteEvaluationSession]", err);
    return c.json({ error: "Failed to delete evaluation" }, 500);
  }
});

// PUT /api/evaluations/:id/formation — guardar formación completa
app.put("/api/evaluations/:id/formation", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);
    if (ev.type !== "game") return c.json({ error: "Only game evaluations have formations" }, 400);

    const formation = await c.req.json<GameFormation>();
    await db.updateDoc("evaluations", id, {
      formation,
      updatedAt: SERVER_TIMESTAMP,
    });
    return c.json({ ok: true });
  } catch (err) {
    console.error("[saveFormation]", err);
    return c.json({ error: "Failed to save formation" }, 500);
  }
});

// GET /api/evaluations/:id/formation
app.get("/api/evaluations/:id/formation", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    return c.json({ formation: ev.formation ?? null });
  } catch (err) {
    console.error("[getFormation]", err);
    return c.json({ error: "Failed to get formation" }, 500);
  }
});

// PUT /api/evaluations/:id/athletes/:athleteId/scores
app.put("/api/evaluations/:id/athletes/:athleteId/scores", authMiddleware, async (c) => {
  const { id, athleteId } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    const scores = await c.req.json<AthleteEvaluation>();
    const saved = await db.setDoc(`evaluations/${id}/athleteScores`, athleteId, {
      ...scores,
      athleteId,
      updatedAt: SERVER_TIMESTAMP,
    });
    return c.json({ scores: { athleteId, ...saved } });
  } catch (err) {
    console.error("[saveAthleteScores]", err);
    return c.json({ error: "Failed to save athlete scores" }, 500);
  }
});

// GET /api/evaluations/:id/athletes/:athleteId/scores
app.get("/api/evaluations/:id/athletes/:athleteId/scores", authMiddleware, async (c) => {
  const { id, athleteId } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  try {
    const ev = await db.getDoc("evaluations", id);
    if (!ev) return c.json({ error: "Evaluation not found" }, 404);
    if (ev.createdBy !== uid) return c.json({ error: "Not authorized" }, 403);

    const scores = await db.getDoc(`evaluations/${id}/athleteScores`, athleteId);
    return c.json({ scores: scores ?? null });
  } catch (err) {
    console.error("[getAthleteScores]", err);
    return c.json({ error: "Failed to get athlete scores" }, 500);
  }
});

// ─── Reports ──────────────────────────────────────────────────────────────────

// POST /api/reports — generate report async with Claude AI
app.post("/api/reports", authMiddleware, async (c) => {
  const uid = c.get("uid");
  const email = c.get("email");
  const db = c.get("db");
  const body = await c.req.json() as {
    athleteIds: string[];
    options: {
      includeCharts: boolean;
      evalViewType: "per_evaluation" | "consolidated";
      personalData: boolean;
      representativeData: boolean;
      clubHistory: boolean;
      titles: boolean;
    };
    userName?: string;
  };

  const { athleteIds, options, userName } = body;

  if (!athleteIds?.length || !options) {
    return c.json({ error: "athleteIds and options are required" }, 400);
  }

  const anthropicKey = c.env.ANTHROPIC_API_KEY;
  const resendKey = c.env.RESEND_API_KEY;

  if (!anthropicKey || !resendKey) {
    return c.json({ error: "Report generation not configured" }, 503);
  }

  // Create report record
  const reportId = crypto.randomUUID();
  await db.setDoc("reports", reportId, {
    status: "processing",
    athleteIds,
    options,
    userEmail: email,
    userName,
    createdBy: uid,
  });

  // Process async using waitUntil
  const ctx = c.executionCtx;
  ctx.waitUntil((async () => {
    try {
      // 1. Fetch athletes data
      const athletes: Record<string, unknown>[] = [];
      for (const id of athleteIds) {
        const doc = await db.getDoc("athletes", id);
        if (doc) athletes.push({ id, ...doc });
      }

      if (athletes.length === 0) {
        await db.updateDoc("reports", reportId, { status: "failed", error: "No athletes found" });
        return;
      }

      // 2. Build prompt
      const athleteDataJson = athletes.map((a: any) => {
        const data: Record<string, unknown> = { nombre: `${a.firstName} ${a.lastName}`, id: a.id };
        if (options.personalData) {
          data.datosPersonales = {
            fechaNacimiento: a.dateOfBirth, nacionalidad: a.nationality, email: a.contactEmail,
            telefono: a.contactPhone, posicion: a.position, pieDominante: a.preferredFoot,
            estatura: a.height ? `${a.height} m` : undefined, peso: a.weight ? `${a.weight} kg` : undefined,
            clubActual: a.currentClub, finContrato: a.contractEnd,
          };
        }
        if (options.representativeData && a.representative) data.representante = a.representative;
        if (options.clubHistory && a.clubHistory?.length) data.historialClubes = a.clubHistory;
        if (options.titles && a.titles?.length) data.titulosReconocimientos = a.titles;
        if (a.physicalAvg || a.technicalAvg || a.tacticalAvg) {
          data.evaluaciones = {
            cantidadEvaluaciones: a.evaluationCount ?? 0,
            promedioFisico: a.physicalAvg, promedioTecnico: a.technicalAvg, promedioTactico: a.tacticalAvg,
            tipoVista: options.evalViewType === "consolidated" ? "Consolidado" : "Por evaluacion",
          };
        }
        return data;
      });

      const chartInstructions = options.includeCharts ? `
GRAFICOS RADAR CHART (OBLIGATORIO):
- Genera SVG radar charts inline (NO JavaScript, solo SVG puro con <polygon>, <line>, <text>, <circle>)
- Un radar chart FISICO con 6 ejes: Velocidad, Aceleracion, Fuerza, Resistencia, Potencia, Reaccion (escala 0-100)
- Un radar chart TECNICO con 6 ejes: Pase, Control, Regate, Disparo, Cabeceo, Presion (escala 0-10, normalizar a porcentaje)
- Un radar chart TACTICO con 4 ejes: Posicionamiento, Marcaje, Desmarque, Transicion (escala 0-10, normalizar a porcentaje)
- Cada radar chart: 300x300px viewBox, cuadricula poligonal al 25%/50%/75%/100%, area rellena rgba(0,229,155,0.3) con borde #00E59B, etiquetas con nombre y valor en cada vertice, fondo #f8f9fa
- Coloca los 3 charts en fila (display:flex, justify-content:space-around)
- Ademas incluye barras de progreso CSS para cada atributo individual` : "";

      const prompt = `Eres un analista de scouting deportivo profesional que trabaja para clubes de futbol de primera division. Genera un REPORTE PROFESIONAL DE SCOUTING en formato HTML completo (<!DOCTYPE html>...) con CSS embebido. Sin JavaScript. Diseno elegante con colores #0B0F14 y #00E59B. Portada con "ElaScout", fecha, total deportistas. Cada deportista con page-break. ${options.personalData ? "Incluye datos personales." : ""} ${options.representativeData ? "Incluye representante." : ""} ${options.clubHistory ? "Incluye historial de clubes." : ""} ${options.titles ? "Incluye titulos." : ""} ${chartInstructions} Incluye analisis de fortalezas, areas de mejora y recomendacion de scouting. Datos:\n\`\`\`json\n${JSON.stringify(athleteDataJson, null, 2)}\n\`\`\`\nResponde UNICAMENTE con HTML.`;

      // 3. Call Claude
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const claudeData = await claudeRes.json() as { content: Array<{ type: string; text: string }> };
      const htmlContent = claudeData.content?.filter((b) => b.type === "text").map((b) => b.text).join("") ?? "";

      if (!htmlContent.includes("<html") && !htmlContent.includes("<!DOCTYPE")) {
        await db.updateDoc("reports", reportId, { status: "failed", error: "AI did not generate valid HTML" });
        return;
      }

      // 4. Send email via Resend
      const athleteNames = athletes.map((a: any) => `${a.firstName} ${a.lastName}`).join(", ");
      const dateStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

      const encodedHtml = btoa(
        String.fromCharCode(...new TextEncoder().encode(htmlContent))
      );

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: c.env.RESEND_FROM || "ElaScout <onboarding@resend.dev>",
          to: email,
          subject: `Reporte de Scouting — ${athleteNames} — ${dateStr}`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#0B0F14;font-size:24px;text-align:center;">ElaScout</h1><p style="color:#666;text-align:center;">Reporte de Scouting Profesional</p><p>Hola${userName ? ` ${userName}` : ""},</p><p>Tu reporte de scouting con <strong>${athletes.length} deportista${athletes.length !== 1 ? "s" : ""}</strong> ha sido generado. El reporte esta adjunto en formato HTML.</p><p style="color:#999;font-size:11px;text-align:center;margin-top:32px;">Generado por ElaScout AI</p></div>`,
          attachments: [{
            filename: `reporte-scouting-${new Date().toISOString().slice(0, 10)}.html`,
            content: encodedHtml,
            content_type: "text/html",
          }],
        }),
      });

      await db.updateDoc("reports", reportId, { status: "completed" });
      console.log(`[report:${reportId}] Sent to ${email}`);
    } catch (err) {
      console.error(`[report:${reportId}] Failed:`, err);
      await db.updateDoc("reports", reportId, { status: "failed", error: String(err) });
    }
  })());

  return c.json({
    message: "Reporte en proceso. Sera enviado a tu correo electronico.",
    reportId,
    email,
  }, 202);
});

// GET /api/reports/:id/status
app.get("/api/reports/:id/status", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const uid = c.get("uid");
  const db = c.get("db");

  const doc = await db.getDoc("reports", id);
  if (!doc || doc.createdBy !== uid) return c.json({ error: "Not found" }, 404);

  return c.json({ report: { id, status: doc.status, error: doc.error } });
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default app;
