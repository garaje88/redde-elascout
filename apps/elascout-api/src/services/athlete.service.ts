import { db } from "../config/firebase";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  AthleteDoc,
  CreateAthleteInput,
  UpdateAthleteInput,
  AthleteFilters,
  PaginationParams,
} from "../models/athlete.model";

const COLLECTION = "athletes";

/** Convert Firestore Timestamps to ISO strings for JSON serialization */
function serializeAthlete(
  doc: AthleteDoc & { id: string }
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...doc };
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = (data.createdAt as Timestamp).toDate().toISOString();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = (data.updatedAt as Timestamp).toDate().toISOString();
  }
  return data;
}

export async function createAthlete(
  data: CreateAthleteInput,
  uid: string
): Promise<AthleteDoc & { id: string }> {
  const docRef = db.collection(COLLECTION).doc();

  const athlete = {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    nationality: data.nationality,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    photoURL: data.photoURL || null,
    organizationId: data.organizationId || null,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(athlete);

  const created = await docRef.get();
  const result = { id: docRef.id, ...(created.data() as AthleteDoc) };
  return serializeAthlete(result) as unknown as AthleteDoc & { id: string };
}

export async function getAthleteById(
  id: string
): Promise<(AthleteDoc & { id: string }) | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  const result = { id: doc.id, ...(doc.data() as AthleteDoc) };
  return serializeAthlete(result) as unknown as AthleteDoc & { id: string };
}

export async function listAthletes(
  filters: AthleteFilters,
  pagination: PaginationParams
): Promise<{ athletes: (AthleteDoc & { id: string })[]; hasMore: boolean }> {
  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (filters.createdBy) {
    query = query.where("createdBy", "==", filters.createdBy);
  }

  if (filters.organizationId) {
    query = query.where("organizationId", "==", filters.organizationId);
  }

  query = query.orderBy("createdAt", "desc");

  if (pagination.startAfter) {
    const startDoc = await db
      .collection(COLLECTION)
      .doc(pagination.startAfter)
      .get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const limit = pagination.limit || 20;
  const snapshot = await query.limit(limit + 1).get();

  const athletes = snapshot.docs.slice(0, limit).map((doc) =>
    serializeAthlete({
      id: doc.id,
      ...(doc.data() as AthleteDoc),
    }) as unknown as AthleteDoc & { id: string }
  );

  const hasMore = snapshot.docs.length > limit;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const filtered = athletes.filter(
      (a) =>
        a.firstName.toLowerCase().includes(searchLower) ||
        a.lastName.toLowerCase().includes(searchLower)
    );
    return { athletes: filtered, hasMore };
  }

  return { athletes, hasMore };
}

export async function updateAthlete(
  id: string,
  data: UpdateAthleteInput,
  uid: string
): Promise<(AthleteDoc & { id: string }) | null> {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const existing = doc.data() as AthleteDoc;

  if (existing.createdBy !== uid) {
    throw new Error("FORBIDDEN");
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.update(updateData);

  const updated = await docRef.get();
  const result = { id: docRef.id, ...(updated.data() as AthleteDoc) };
  return serializeAthlete(result) as unknown as AthleteDoc & { id: string };
}

export async function deleteAthlete(
  id: string,
  uid: string
): Promise<boolean> {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  const existing = doc.data() as AthleteDoc;

  if (existing.createdBy !== uid) {
    throw new Error("FORBIDDEN");
  }

  await docRef.delete();
  return true;
}
