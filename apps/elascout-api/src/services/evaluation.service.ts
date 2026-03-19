import { db } from "../config/firebase";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const COLLECTION = "evaluations";
const EXPIRY_MS = 90 * 60 * 1000; // 90 minutes

export type EvaluationType = "personal" | "game";
export type EvaluationStatus = "active" | "completed" | "expired";

export interface Evaluation {
  id: string;
  type: EvaluationType;
  title: string;
  notes?: string;
  status: EvaluationStatus;
  createdBy: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  minutesRemaining?: number;
  formation?: unknown;
}

function isExpired(startedAt: string): boolean {
  return Date.now() - new Date(startedAt).getTime() > EXPIRY_MS;
}

function computeMinutesRemaining(startedAt: string): number {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return Math.max(0, Math.floor((EXPIRY_MS - elapsed) / 60000));
}

function serializeEvaluation(
  id: string,
  data: FirebaseFirestore.DocumentData
): Evaluation {
  const startedAt =
    data.startedAt instanceof Timestamp
      ? data.startedAt.toDate().toISOString()
      : (data.startedAt as string) ?? new Date().toISOString();

  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string) ?? new Date().toISOString();

  const updatedAt =
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : (data.updatedAt as string) ?? new Date().toISOString();

  let status: EvaluationStatus = data.status as EvaluationStatus;
  if (status === "active" && isExpired(startedAt)) {
    status = "expired";
  }

  return {
    id,
    type: data.type as EvaluationType,
    title: data.title as string,
    notes: data.notes as string | undefined,
    status,
    createdBy: data.createdBy as string,
    startedAt,
    completedAt: data.completedAt
      ? data.completedAt instanceof Timestamp
        ? data.completedAt.toDate().toISOString()
        : (data.completedAt as string)
      : undefined,
    createdAt,
    updatedAt,
    minutesRemaining: status === "active" ? computeMinutesRemaining(startedAt) : undefined,
    formation: data.formation ?? undefined,
  };
}

export async function createEvaluation(
  input: { type: EvaluationType; title: string; notes?: string },
  uid: string
): Promise<Evaluation> {
  const now = FieldValue.serverTimestamp();
  const ref = await db.collection(COLLECTION).add({
    type: input.type,
    title: input.title,
    notes: input.notes ?? "",
    status: "active",
    createdBy: uid,
    startedAt: new Date().toISOString(),
    createdAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return serializeEvaluation(ref.id, snap.data()!);
}

export async function listEvaluations(
  uid: string,
  statusFilter?: string
): Promise<Evaluation[]> {
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTION)
    .where("createdBy", "==", uid)
    .orderBy("createdAt", "desc");

  if (statusFilter && statusFilter !== "all") {
    query = query.where("status", "==", statusFilter);
  }

  const snap = await query.get();
  return snap.docs.map((d) => serializeEvaluation(d.id, d.data()));
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return serializeEvaluation(snap.id, snap.data()!);
}

export async function updateEvaluation(
  id: string,
  input: { status?: EvaluationStatus; notes?: string }
): Promise<Evaluation | null> {
  const ref = db.collection(COLLECTION).doc(id);
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.status !== undefined) updates.status = input.status;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.status === "completed") updates.completedAt = new Date().toISOString();
  await ref.update(updates);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return serializeEvaluation(snap.id, snap.data()!);
}

export async function deleteEvaluation(id: string): Promise<void> {
  await db.collection(COLLECTION).doc(id).delete();
}

export async function saveFormation(
  id: string,
  formation: unknown
): Promise<void> {
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ formation, updatedAt: FieldValue.serverTimestamp() });
}

export async function getFormation(id: string): Promise<unknown> {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return snap.data()?.formation ?? null;
}

export async function saveAthleteScores(
  evaluationId: string,
  athleteId: string,
  scores: unknown
): Promise<void> {
  const scoresData = (scores as Record<string, unknown>) ?? {};

  // Save scores in the evaluation subcollection
  // Include athleteId + evaluationId as fields for collectionGroup queries
  await db
    .collection(COLLECTION)
    .doc(evaluationId)
    .collection("athleteScores")
    .doc(athleteId)
    .set({ ...scoresData, athleteId, evaluationId, updatedAt: FieldValue.serverTimestamp() });

  // Compute and persist aggregated averages on the athlete document
  await updateAthleteAggregatedScores(athleteId);
}

async function updateAthleteAggregatedScores(athleteId: string): Promise<void> {
  // Fetch all evaluations that have scores for this athlete
  const evaluationsSnap = await db.collection(COLLECTION).get();

  const allPhysical: Record<string, number[]> = {};
  const allTechnical: Record<string, number[]> = {};
  const allTactical: Record<string, number[]> = {};
  let evalCount = 0;

  for (const evalDoc of evaluationsSnap.docs) {
    const scoreSnap = await evalDoc.ref
      .collection("athleteScores")
      .doc(athleteId)
      .get();

    if (!scoreSnap.exists) continue;
    const data = scoreSnap.data()!;
    evalCount++;

    if (data.physical) {
      for (const [key, val] of Object.entries(data.physical as Record<string, number>)) {
        if (!allPhysical[key]) allPhysical[key] = [];
        allPhysical[key]!.push(val);
      }
    }
    if (data.technical) {
      for (const [key, val] of Object.entries(data.technical as Record<string, number>)) {
        if (!allTechnical[key]) allTechnical[key] = [];
        allTechnical[key]!.push(val);
      }
    }
    if (data.tactical) {
      for (const [key, val] of Object.entries(data.tactical as Record<string, number>)) {
        if (!allTactical[key]) allTactical[key] = [];
        allTactical[key]!.push(val);
      }
    }
  }

  if (evalCount === 0) return;

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const avgObj = (map: Record<string, number[]>) => {
    const result: Record<string, number> = {};
    for (const [key, vals] of Object.entries(map)) {
      result[key] = avg(vals);
    }
    return result;
  };

  const updates: Record<string, unknown> = {
    evaluationCount: evalCount,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (Object.keys(allPhysical).length > 0) updates.physicalAvg = avgObj(allPhysical);
  if (Object.keys(allTechnical).length > 0) updates.technicalAvg = avgObj(allTechnical);
  if (Object.keys(allTactical).length > 0) updates.tacticalAvg = avgObj(allTactical);

  await db.collection("athletes").doc(athleteId).update(updates);
}

export interface AthleteEvaluationEntry {
  evaluationId: string;
  evaluationTitle: string;
  date: string;
  scores: Record<string, unknown>;
}

export async function getAthleteEvaluationList(
  athleteId: string
): Promise<AthleteEvaluationEntry[]> {
  // collectionGroup query — requires index: athleteScores / athleteId ASCENDING
  const snap = await db
    .collectionGroup("athleteScores")
    .where("athleteId", "==", athleteId)
    .orderBy("updatedAt", "desc")
    .get();

  if (snap.empty) return [];

  // Fetch evaluation titles in parallel
  const results = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const evalId = data.evaluationId as string ?? doc.ref.parent.parent?.id ?? "";
      let title = "Evaluación";
      let date = "";
      try {
        if (evalId) {
          const evalDoc = await db.collection(COLLECTION).doc(evalId).get();
          if (evalDoc.exists) {
            title = (evalDoc.data()?.title as string) ?? "Evaluación";
            const startedAt = evalDoc.data()?.startedAt;
            date = startedAt instanceof Timestamp
              ? startedAt.toDate().toISOString()
              : (startedAt as string) ?? "";
          }
        }
      } catch { /* ignore */ }

      const updatedAt = data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string) ?? "";

      return {
        evaluationId: evalId,
        evaluationTitle: title,
        date: date || updatedAt,
        scores: data as Record<string, unknown>,
      };
    })
  );

  return results;
}

export async function getAthleteScores(
  evaluationId: string,
  athleteId: string
): Promise<unknown> {
  const snap = await db
    .collection(COLLECTION)
    .doc(evaluationId)
    .collection("athleteScores")
    .doc(athleteId)
    .get();
  if (!snap.exists) return null;
  return snap.data();
}
