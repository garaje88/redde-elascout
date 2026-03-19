import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ---------- Types ----------

export interface RepresentativeInfo {
  name: string;
  email?: string;
  phone?: string;
  agency?: string;
}

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
  contactEmail: string;
  contactPhone: string;
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
  representative?: RepresentativeInfo;
  physicalAvg?: PhysicalScores;
  technicalAvg?: TechnicalScores;
  tacticalAvg?: TacticalScores;
  evaluationCount?: number;
  createdBy: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type AthleteCreateInput = Pick<
  Athlete,
  "firstName" | "lastName" | "dateOfBirth" | "nationality" | "contactEmail" | "contactPhone"
> &
  Partial<
    Pick<
      Athlete,
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
      | "representative"
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

// ---------- Evaluation Types ----------

export type EvaluationType = "personal" | "game";
export type EvaluationStatus = "active" | "completed" | "expired";

export interface PhysicalScores {
  velocidad: number;
  aceleracionCorta: number;
  fuerzaDuelos: number;
  resistencia: number;
  potencia: number;
  reaccion: number;
  saquesLargos: number;
  saquesCortos: number;
}

export interface TechnicalScores {
  pase: number;
  control: number;
  regate: number;
  disparo: number;
  cabecea: number;
  presion: number;
}

export interface TacticalScores {
  posicionamiento: number;
  marcaje: number;
  desmarque: number;
  transicion: number;
}

export interface FieldPosition {
  x: number;
  y: number;
}

export interface AthleteEvaluation {
  athleteId: string;
  name?: string;
  initials?: string;
  position?: string;
  team?: "home" | "away";
  isSubstitute?: boolean;
  fieldPosition?: FieldPosition;
  physical?: PhysicalScores;
  technical?: TechnicalScores;
  tactical?: TacticalScores;
  notes?: string;
}

export interface GameFormation {
  homeTeam: { name: string; formation: string; color: string };
  awayTeam: { name: string; formation: string; color: string };
  athletes: AthleteEvaluation[];
}

export interface Evaluation {
  id: string;
  type: EvaluationType;
  status: EvaluationStatus;
  title: string;
  createdBy: string;
  organizationId?: string;
  formation?: GameFormation;
  athletes?: AthleteEvaluation[];
  startedAt: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EvaluationCreateInput = {
  type: EvaluationType;
  title: string;
  notes?: string;
};

// ---------- Evaluations API ----------

export async function getEvaluations(status?: EvaluationStatus): Promise<Evaluation[]> {
  const qs = status ? `?status=${status}` : "";
  const data = await request<{ evaluations: Evaluation[] }>(`/evaluations${qs}`);
  return data.evaluations;
}

export async function getEvaluation(id: string): Promise<Evaluation> {
  const data = await request<{ evaluation: Evaluation }>(`/evaluations/${id}`);
  return data.evaluation;
}

export async function createEvaluation(data: EvaluationCreateInput): Promise<Evaluation> {
  const res = await request<{ evaluation: Evaluation }>("/evaluations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.evaluation;
}

export async function updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation> {
  const res = await request<{ evaluation: Evaluation }>(`/evaluations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.evaluation;
}

export async function deleteEvaluation(id: string): Promise<void> {
  await request<void>(`/evaluations/${id}`, { method: "DELETE" });
}

export async function saveFormation(id: string, formation: GameFormation): Promise<void> {
  await request<{ ok: boolean }>(`/evaluations/${id}/formation`, {
    method: "PUT",
    body: JSON.stringify(formation),
  });
}

export async function saveAthleteScores(
  evalId: string,
  athleteId: string,
  scores: AthleteEvaluation
): Promise<void> {
  await request<{ scores: AthleteEvaluation }>(
    `/evaluations/${evalId}/athletes/${athleteId}/scores`,
    { method: "PUT", body: JSON.stringify(scores) }
  );
}

export async function getAthleteScores(
  evalId: string,
  athleteId: string
): Promise<AthleteEvaluation | null> {
  const data = await request<{ scores: AthleteEvaluation | null }>(
    `/evaluations/${evalId}/athletes/${athleteId}/scores`
  );
  return data.scores;
}
