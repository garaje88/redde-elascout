import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ---------- Types ----------

export interface ClubHistoryEntry {
  club: string;
  startYear: number;
  endYear?: number;
  position?: string;
}

export interface TitleEntry {
  title: string;
  year: number;
  club?: string;
  category?: string;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  contactEmail?: string;
  contactPhone?: string;
  photoURL?: string;
  position?: string;
  secondaryPosition?: string;
  preferredFoot?: "left" | "right" | "both";
  height?: number;
  weight?: number;
  currentClub?: string;
  contractEnd?: string;
  clubHistory?: ClubHistoryEntry[];
  titles?: TitleEntry[];
  createdBy: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type AthleteCreateInput = Pick<
  Athlete,
  "firstName" | "lastName" | "dateOfBirth" | "nationality"
> &
  Partial<
    Pick<
      Athlete,
      | "contactEmail"
      | "contactPhone"
      | "photoURL"
      | "position"
      | "secondaryPosition"
      | "preferredFoot"
      | "height"
      | "weight"
      | "currentClub"
      | "contractEnd"
      | "clubHistory"
      | "titles"
    >
  >;

// ---------- Helpers ----------

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (session?.user) {
    // The backend expects a Bearer token. In the Auth.js JWT strategy the id
    // token is stored on the session — fall back to a placeholder so the
    // request still goes through during local dev without a real backend.
    headers["Authorization"] = `Bearer ${(session as any).idToken ?? (session as any).accessToken ?? "dev"}`;
  }

  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------- Athletes API ----------

export async function getAthletes(): Promise<Athlete[]> {
  const data = await request<{ athletes: Athlete[]; hasMore: boolean }>(
    "/athletes?limit=100"
  );
  return data.athletes;
}

export async function getAthlete(id: string): Promise<Athlete> {
  const data = await request<{ athlete: Athlete }>(`/athletes/${id}`);
  return data.athlete;
}

export async function createAthlete(
  data: AthleteCreateInput
): Promise<Athlete> {
  const res = await request<{ athlete: Athlete }>("/athletes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.athlete;
}

export async function updateAthlete(
  id: string,
  data: Partial<Athlete>
): Promise<Athlete> {
  const res = await request<{ athlete: Athlete }>(`/athletes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.athlete;
}

export async function deleteAthlete(id: string): Promise<void> {
  await request<void>(`/athletes/${id}`, { method: "DELETE" });
}
