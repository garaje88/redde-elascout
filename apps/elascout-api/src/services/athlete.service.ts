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

/** Convierte un Firestore Timestamp a string "YYYY-MM-DD" */
function timestampToDateString(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString().split("T")[0]!;
  if (typeof ts === "string") return ts;
  return "";
}

/** Convert Firestore Timestamps to strings for JSON serialization */
function serializeAthlete(
  doc: AthleteDoc & { id: string }
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...doc };

  // Timestamps de auditoría → ISO string completo
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = (data.createdAt as Timestamp).toDate().toISOString();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = (data.updatedAt as Timestamp).toDate().toISOString();
  }

  // Fechas de dominio → "YYYY-MM-DD" (el seed las guardó como Timestamp)
  if (data.dateOfBirth instanceof Timestamp || typeof data.dateOfBirth !== "string") {
    data.dateOfBirth = timestampToDateString(data.dateOfBirth);
  }
  if (data.contractEnd instanceof Timestamp) {
    data.contractEnd = timestampToDateString(data.contractEnd);
  }

  // Normalizar null → undefined para campos opcionales
  if (data.contactEmail === null) data.contactEmail = "";
  if (data.contactPhone === null) data.contactPhone = "";

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
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    photoURL: data.photoURL || null,
    organizationId: data.organizationId || null,
    position: data.position || null,
    secondaryPosition: data.secondaryPosition || null,
    preferredFoot: data.preferredFoot || null,
    height: data.height ?? null,
    weight: data.weight ?? null,
    currentClub: data.currentClub || null,
    contractEnd: data.contractEnd || null,
    clubHistory: data.clubHistory ?? [],
    titles: data.titles ?? [],
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

export async function listAthletes(
  filters: AthleteFilters,
  pagination: PaginationParams
): Promise<{ athletes: (AthleteDoc & { id: string })[]; hasMore: boolean }> {
  const FETCH_LIMIT = 500;

  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (filters.createdBy) {
    query = query.where("createdBy", "==", filters.createdBy);
  }

  if (filters.organizationId) {
    query = query.where("organizationId", "==", filters.organizationId);
  }

  query = query.orderBy("createdAt", "desc").limit(FETCH_LIMIT);
  const snapshot = await query.get();

  let results = snapshot.docs.map((doc) =>
    serializeAthlete({
      id: doc.id,
      ...(doc.data() as AthleteDoc),
    })
  );

  if (filters.nationality) {
    const nat = filters.nationality.toLowerCase();
    results = results.filter((doc) => {
      const nationality = typeof doc.nationality === "string" ? doc.nationality : "";
      return nationality.toLowerCase() === nat;
    });
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter((doc) => {
      const firstName = typeof doc.firstName === "string" ? doc.firstName : "";
      const lastName = typeof doc.lastName === "string" ? doc.lastName : "";
      return (
        firstName.toLowerCase().includes(searchLower) ||
        lastName.toLowerCase().includes(searchLower)
      );
    });
  }

  if (filters.position) {
    const positionLower = filters.position.toLowerCase();
    results = results.filter((doc) => {
      const position = typeof doc.position === "string" ? doc.position : undefined;
      return position !== undefined && position.toLowerCase() === positionLower;
    });
  }

  if (filters.ageRange) {
    const parts = filters.ageRange.split("-");
    const minAge = parseInt(parts[0] ?? "", 10);
    const maxAge = parseInt(parts[1] ?? "", 10);
    if (!isNaN(minAge) && !isNaN(maxAge)) {
      results = results.filter((doc) => {
        const dateOfBirth = typeof doc.dateOfBirth === "string" ? doc.dateOfBirth : undefined;
        if (!dateOfBirth) return false;
        const age = calcAge(dateOfBirth);
        return age >= minAge && age <= maxAge;
      });
    }
  }

  if (filters.club) {
    const clubLower = filters.club.toLowerCase();
    results = results.filter((doc) => {
      const currentClub = typeof doc.currentClub === "string" ? doc.currentClub : undefined;
      return currentClub !== undefined && currentClub.toLowerCase().includes(clubLower);
    });
  }

  const limit = pagination.limit || 20;
  const paginated = results.slice(0, limit);
  const hasMore = results.length > limit;

  return {
    athletes: paginated as unknown as (AthleteDoc & { id: string })[],
    hasMore,
  };
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
