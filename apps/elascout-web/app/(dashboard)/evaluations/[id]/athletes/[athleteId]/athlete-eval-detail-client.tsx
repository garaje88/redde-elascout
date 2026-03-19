"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface AthleteInfo {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  nationality?: string;
  dateOfBirth?: string;
  photoURL?: string;
  currentClub?: string;
  contactEmail?: string;
}

const DEFAULT_PHYSICAL: PhysicalScores = {
  velocidad: 50, aceleracionCorta: 50, fuerzaDuelos: 50,
  resistencia: 50, potencia: 50, reaccion: 50,
  saquesLargos: 50, saquesCortos: 50,
};

const DEFAULT_TECHNICAL: TechnicalScores = {
  pase: 5, control: 5, regate: 5, disparo: 5, cabecea: 5, presion: 5,
};

const DEFAULT_TACTICAL: TacticalScores = {
  posicionamiento: 5, marcaje: 5, desmarque: 5, transicion: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Score Bar (0-100) ────────────────────────────────────────────────────────

function ScoreBar({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  const pct = (value / 100) * 100;
  const color = value >= 70 ? "from-brand-500 to-teal-400" : value >= 40 ? "from-amber-400 to-yellow-400" : "from-red-500 to-red-400";
  return (
    <div className="rounded-lg border border-dark-50 bg-dark-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-surface">{label}</span>
        {readOnly ? (
          <span className="text-sm font-semibold text-brand-500">{value}</span>
        ) : (
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-16 rounded-lg border border-dark-50 bg-dark-100 px-2 py-1 text-center text-sm font-semibold text-brand-500 focus:border-brand-500 focus:outline-none"
          />
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-dark-100">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Score Input (1-10) ───────────────────────────────────────────────────────

function ScoreInput({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  const stars = Math.round(value / 2);
  return (
    <div className="flex items-center justify-between rounded-lg border border-dark-50 bg-dark-50 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-surface">{label}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`h-3.5 w-3.5 ${i < stars ? "text-amber-400" : "text-dark-100"}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      {readOnly ? (
        <span className="text-sm font-semibold text-brand-500">{value}</span>
      ) : (
        <input
          type="number"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Math.min(10, Math.max(1, Number(e.target.value))))}
          className="w-14 rounded-lg border border-dark-50 bg-dark-100 px-2 py-1.5 text-center text-sm font-semibold text-brand-500 focus:border-brand-500 focus:outline-none"
        />
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dark-50 bg-dark-50 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-brand-500">{icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-surface">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {badge && (
          <span className="rounded-full bg-dark-100 px-2.5 py-1 text-xs font-semibold text-muted">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AthleteEvalDetailClient({
  evaluationId,
  athleteId,
}: {
  evaluationId: string;
  athleteId: string;
}) {
  const router = useRouter();
  const { getFirebaseToken, loading: authLoading, firebaseUser } = useFirebaseAuth();

  const [athlete, setAthlete] = useState<AthleteInfo | null>(null);
  const [physical, setPhysical] = useState<PhysicalScores>(DEFAULT_PHYSICAL);
  const [technical, setTechnical] = useState<TechnicalScores>(DEFAULT_TECHNICAL);
  const [tactical, setTactical] = useState<TacticalScores>(DEFAULT_TACTICAL);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalStatus, setEvalStatus] = useState<string>("active");

  const isReadOnly = evalStatus === "completed" || evalStatus === "expired";

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getFirebaseToken();
        const [athleteRes, scoresRes, evalRes] = await Promise.all([
          fetch(`${API_BASE}/athletes/${athleteId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/evaluations/${evaluationId}/athletes/${athleteId}/scores`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/evaluations/${evaluationId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (evalRes.ok) {
          const evalData = await evalRes.json() as { evaluation: { status: string } };
          setEvalStatus(evalData.evaluation.status);
        }

        if (athleteRes.ok) {
          const data = await athleteRes.json() as { athlete: AthleteInfo };
          setAthlete(data.athlete);
        }

        if (scoresRes.ok) {
          const data = await scoresRes.json() as {
            scores: {
              physical?: PhysicalScores;
              technical?: TechnicalScores;
              tactical?: TacticalScores;
              notes?: string;
            } | null;
          };
          if (data.scores) {
            if (data.scores.physical) setPhysical(data.scores.physical);
            if (data.scores.technical) setTechnical(data.scores.technical);
            if (data.scores.tactical) setTactical(data.scores.tactical);
            if (data.scores.notes) setNotes(data.scores.notes);
          }
        }
      } catch {
        setError("Error al cargar datos del deportista.");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, firebaseUser, athleteId, evaluationId, getFirebaseToken]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`${API_BASE}/evaluations/${evaluationId}/athletes/${athleteId}/scores`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ athleteId, physical, technical, tactical, notes }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError("No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const initials = athlete ? `${athlete.firstName[0]}${athlete.lastName[0]}` : "??";
  const fullName = athlete ? `${athlete.firstName} ${athlete.lastName}` : "Deportista";

  return (
    <>
      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-surface">Guardando evaluación...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/evaluations/${evaluationId}`}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-surface"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Link href="/evaluations" className="hover:text-surface">Evaluaciones</Link>
                <span>/</span>
                <Link href={`/evaluations/${evaluationId}`} className="hover:text-surface">Partido</Link>
                <span>/</span>
                <span className="text-muted-light">{fullName}</span>
              </div>
              <h1 className="text-xl font-bold text-surface">Evaluación del Deportista</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isReadOnly ? (
              <span className="rounded-full bg-dark-100 px-3 py-1.5 text-xs font-semibold text-muted">
                Solo lectura — {evalStatus === "completed" ? "Evaluación completada" : "Evaluación expirada"}
              </span>
            ) : (
              <>
                {saved && (
                  <span className="text-sm font-medium text-brand-500">✓ Evaluación guardada</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-dark transition-opacity disabled:opacity-50 hover:opacity-90"
                >
                  Guardar Evaluación
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Athlete card */}
        <div className="flex items-center gap-5 rounded-xl border border-dark-50 bg-dark-50 p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-400 text-xl font-bold text-dark">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-surface">{fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {athlete?.position && (
                <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                  {athlete.position}
                </span>
              )}
              {athlete?.nationality && (
                <span className="text-xs text-muted">{athlete.nationality}</span>
              )}
              {athlete?.dateOfBirth && (
                <span className="text-xs text-muted">{calcAge(athlete.dateOfBirth)} años</span>
              )}
              {athlete?.currentClub && (
                <span className="text-xs text-muted">· {athlete.currentClub}</span>
              )}
            </div>
          </div>
        </div>

        {/* Physical attributes 0-100 */}
        <SectionCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          title="Atributos Físicos (M5)"
          description="Escala 0-100"
          badge="0 – 100"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Velocidad" value={physical.velocidad} onChange={(v) => setPhysical((p) => ({ ...p, velocidad: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Aceleración Corta" value={physical.aceleracionCorta} onChange={(v) => setPhysical((p) => ({ ...p, aceleracionCorta: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Fuerza en Duelos" value={physical.fuerzaDuelos} onChange={(v) => setPhysical((p) => ({ ...p, fuerzaDuelos: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Resistencia" value={physical.resistencia} onChange={(v) => setPhysical((p) => ({ ...p, resistencia: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Potencia" value={physical.potencia} onChange={(v) => setPhysical((p) => ({ ...p, potencia: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Reacción" value={physical.reaccion} onChange={(v) => setPhysical((p) => ({ ...p, reaccion: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Saques Largos" value={physical.saquesLargos} onChange={(v) => setPhysical((p) => ({ ...p, saquesLargos: v }))} readOnly={isReadOnly} />
            <ScoreBar label="Saques Cortos" value={physical.saquesCortos} onChange={(v) => setPhysical((p) => ({ ...p, saquesCortos: v }))} readOnly={isReadOnly} />
          </div>
        </SectionCard>

        {/* Technical 1-10 */}
        <SectionCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Evaluación Técnica"
          description="Habilidades técnicas con balón"
          badge="1 – 10"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreInput label="Pase" value={technical.pase} onChange={(v) => setTechnical((t) => ({ ...t, pase: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Control de balón" value={technical.control} onChange={(v) => setTechnical((t) => ({ ...t, control: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Regate" value={technical.regate} onChange={(v) => setTechnical((t) => ({ ...t, regate: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Disparo" value={technical.disparo} onChange={(v) => setTechnical((t) => ({ ...t, disparo: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Cabeceo" value={technical.cabecea} onChange={(v) => setTechnical((t) => ({ ...t, cabecea: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Presión" value={technical.presion} onChange={(v) => setTechnical((t) => ({ ...t, presion: v }))} readOnly={isReadOnly} />
          </div>
        </SectionCard>

        {/* Tactical 1-10 */}
        <SectionCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
          title="Evaluación Táctica"
          description="Comprensión táctica del juego"
          badge="1 – 10"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreInput label="Posicionamiento" value={tactical.posicionamiento} onChange={(v) => setTactical((t) => ({ ...t, posicionamiento: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Marcaje" value={tactical.marcaje} onChange={(v) => setTactical((t) => ({ ...t, marcaje: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Desmarque" value={tactical.desmarque} onChange={(v) => setTactical((t) => ({ ...t, desmarque: v }))} readOnly={isReadOnly} />
            <ScoreInput label="Transición" value={tactical.transicion} onChange={(v) => setTactical((t) => ({ ...t, transicion: v }))} readOnly={isReadOnly} />
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
          title="Notas del Evaluador"
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? "Sin notas registradas." : "Observaciones, comentarios sobre el rendimiento..."}
            rows={4}
            className={`w-full resize-none rounded-lg border border-dark-50 bg-dark-100 px-4 py-3 text-sm text-surface placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${isReadOnly ? "cursor-default opacity-80" : ""}`}
          />
        </SectionCard>

        {/* Bottom actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href={`/evaluations/${evaluationId}`}
            className="rounded-lg px-4 py-2.5 text-sm text-muted transition-colors hover:text-surface"
          >
            ← Volver al Campo
          </Link>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-dark transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              Guardar Evaluación
            </button>
          )}
        </div>
      </div>
    </>
  );
}
