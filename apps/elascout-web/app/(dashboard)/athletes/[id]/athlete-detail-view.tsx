"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Athlete } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const FOOT_LABEL: Record<string, string> = {
  left: "Zurdo",
  right: "Derecho",
  both: "Ambidiestro",
};

function computeAge(iso: string): number | null {
  try {
    const birth = new Date(iso);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch { return null; }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-surface">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-muted">{text}</p>;
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

interface RadarDataPoint { label: string; value: number }

function RadarChart({ data, maxValue, color }: {
  data: RadarDataPoint[]; maxValue: number; color: string;
}) {
  const n = data.length;
  const cx = 130, cy = 130, R = 90, levels = 4;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function polarToXY(angle: number, r: number) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = (R * (lvl + 1)) / levels;
    return Array.from({ length: n }, (_, i) => {
      const { x, y } = polarToXY(startAngle + i * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
  });

  const dataPoints = data.map((d, i) => {
    const r = (Math.min(d.value, maxValue) / maxValue) * R;
    return polarToXY(startAngle + i * angleStep, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[220px]">
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const { x, y } = polarToXY(startAngle + i * angleStep, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <polygon points={dataPolygon} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      {/* Data points */}
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />)}
      {/* Labels */}
      {data.map((d, i) => {
        const labelR = R + 26;
        const { x, y } = polarToXY(startAngle + i * angleStep, labelR);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.45)" fontSize={9}>{d.label}</text>
        );
      })}
    </svg>
  );
}

// ─── Score Row ────────────────────────────────────────────────────────────────

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted/80">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Eval Card ────────────────────────────────────────────────────────────────

interface ScoreEntry { label: string; value: number }

function EvalCard({
  title, icon, color, avg, maxValue, radarData, scores,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  avg: number;
  maxValue: number;
  radarData: RadarDataPoint[];
  scores: ScoreEntry[];
}) {
  const avgDisplay = maxValue <= 10
    ? avg.toFixed(1)
    : Math.round(avg).toString();

  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-dark-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <h3 className="text-sm font-semibold text-surface">{title}</h3>
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${color}18`, color }}>
          {avgDisplay}/{maxValue}
        </span>
      </div>

      {/* Radar */}
      <div className="flex justify-center px-4 pb-2">
        <RadarChart data={radarData} maxValue={maxValue} color={color} />
      </div>

      {/* Score grid */}
      <div className="border-t border-white/5 px-5 pb-5 pt-3">
        <div className="grid grid-cols-2 gap-x-6">
          {scores.map((s) => (
            <ScoreRow key={s.label} label={s.label} value={s.value} color={color} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconTechnical = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const IconTactical = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconPhysical = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "info" | "evaluaciones";

// ─── Evaluaciones Tab ─────────────────────────────────────────────────────────

interface EvalEntry {
  evaluationId: string;
  evaluationTitle: string;
  date: string;
  scores: Record<string, unknown>;
}

function EvaluacionesTab({ athlete }: { athlete: Athlete }) {
  const { getFirebaseToken, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [evalList, setEvalList] = useState<EvalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    setLoading(true);
    getFirebaseToken().then(async (token) => {
      try {
        const res = await fetch(`${API_BASE}/athletes/${athlete.id}/evaluations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error");
        const data = await res.json() as { evaluations: EvalEntry[] };
        setEvalList(data.evaluations ?? []);
      } catch {
        setError("No se pudieron cargar las evaluaciones.");
      } finally {
        setLoading(false);
      }
    });
  }, [athlete.id, authLoading, firebaseUser, getFirebaseToken]);

  const hasData = athlete.evaluationCount && athlete.evaluationCount > 0;
  const physical = athlete.physicalAvg as Record<string, number> | undefined;
  const technical = athlete.technicalAvg as Record<string, number> | undefined;
  const tactical = athlete.tacticalAvg as Record<string, number> | undefined;

  if (!hasData && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-100">
          <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-surface">Sin evaluaciones aún</p>
          <p className="mt-1 text-xs text-muted">Este deportista no tiene evaluaciones registradas.</p>
        </div>
        <Link href="/evaluations" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-dark transition-opacity hover:opacity-90">
          Ir a Evaluaciones →
        </Link>
      </div>
    );
  }

  // Compute averages
  const avgOf = (obj: Record<string, number>) => {
    const vals = Object.values(obj).filter((v) => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const physicalColor = "#00E59B";
  const technicalColor = "#00E59B";
  const tacticalColor = "#00E59B";

  return (
    <div className="space-y-6">
      {/* Eval cards row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {technical && (
          <EvalCard
            title="Evaluación Técnica"
            icon={<IconTechnical />}
            color={technicalColor}
            avg={avgOf(technical)}
            maxValue={100}
            radarData={[
              { label: "Control", value: technical.control ?? 0 },
              { label: "Pase Corto", value: technical.paseCorto ?? technical.pase ?? 0 },
              { label: "Pase Largo", value: technical.paseLargo ?? 0 },
              { label: "Regate", value: technical.regate ?? 0 },
              { label: "Tiro", value: technical.tiro ?? technical.disparo ?? 0 },
              { label: "Cabeceo", value: technical.cabecea ?? technical.cabeceo ?? 0 },
            ]}
            scores={[
              { label: "Control", value: technical.control ?? 0 },
              { label: "Pase Corto", value: technical.paseCorto ?? technical.pase ?? 0 },
              { label: "Pase Largo", value: technical.paseLargo ?? 0 },
              { label: "Regate", value: technical.regate ?? 0 },
              { label: "Tiro", value: technical.tiro ?? technical.disparo ?? 0 },
              { label: "Cabeceo", value: technical.cabecea ?? technical.cabeceo ?? 0 },
            ]}
          />
        )}
        {tactical && (
          <EvalCard
            title="Evaluación Táctica"
            icon={<IconTactical />}
            color={tacticalColor}
            avg={avgOf(tactical)}
            maxValue={100}
            radarData={[
              { label: "Posicionam.", value: tactical.posicionamiento ?? 0 },
              { label: "Visión", value: tactical.vision ?? 0 },
              { label: "Liderazgo", value: tactical.liderazgo ?? 0 },
              { label: "Marca", value: tactical.marcaje ?? 0 },
              { label: "Presión", value: tactical.presion ?? 0 },
              { label: "Lectura", value: tactical.lectura ?? tactical.desmarque ?? 0 },
            ]}
            scores={[
              { label: "Posicionamiento", value: tactical.posicionamiento ?? 0 },
              { label: "Visión", value: tactical.vision ?? 0 },
              { label: "Liderazgo", value: tactical.liderazgo ?? 0 },
              { label: "Marca", value: tactical.marcaje ?? 0 },
              { label: "Presión", value: tactical.presion ?? 0 },
              { label: "Lectura", value: tactical.lectura ?? tactical.desmarque ?? 0 },
            ]}
          />
        )}
        {physical && (
          <EvalCard
            title="Evaluación Física"
            icon={<IconPhysical />}
            color={physicalColor}
            avg={avgOf(physical)}
            maxValue={100}
            radarData={[
              { label: "Velocidad", value: physical.velocidad ?? 0 },
              { label: "Aceleración", value: physical.aceleracionCorta ?? physical.aceleracion ?? 0 },
              { label: "Resistencia", value: physical.resistencia ?? 0 },
              { label: "Fuerza", value: physical.fuerzaDuelos ?? physical.fuerza ?? 0 },
              { label: "Potencia", value: physical.potencia ?? 0 },
              { label: "Reacción", value: physical.reaccion ?? 0 },
            ]}
            scores={[
              { label: "Velocidad", value: physical.velocidad ?? 0 },
              { label: "Aceleración", value: physical.aceleracionCorta ?? physical.aceleracion ?? 0 },
              { label: "Fuerza", value: physical.fuerzaDuelos ?? physical.fuerza ?? 0 },
              { label: "Resistencia", value: physical.resistencia ?? 0 },
              { label: "Potencia", value: physical.potencia ?? 0 },
              { label: "Reacción", value: physical.reaccion ?? 0 },
            ]}
          />
        )}
      </div>

      {/* Evaluation history list */}
      <div className="rounded-2xl border border-white/5 bg-dark-100">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-surface">Historial de Evaluaciones</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-400">{error}</p>
        ) : evalList.length === 0 ? (
          <EmptyState text="Sin historial de evaluaciones individuales." />
        ) : (
          <div className="divide-y divide-white/5">
            {evalList.map((ev) => (
              <div key={ev.evaluationId} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-surface">{ev.evaluationTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ev.date ? new Date(ev.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
                <Link
                  href={`/evaluations/${ev.evaluationId}/athletes/${athlete.id}`}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand-500/40 hover:text-surface"
                >
                  Ver detalle
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { athlete: Athlete }

export function AthleteDetailView({ athlete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const age = computeAge(athlete.dateOfBirth);
  const history = athlete.clubHistory ?? [];
  const titles = athlete.titles ?? [];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "info",
      label: "Información",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      id: "evaluaciones",
      label: "Evaluaciones",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 200 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-dark-100 to-dark-100" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-500/10" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-brand-500/5" />

        <div className="relative flex items-center gap-6 px-8 py-7">
          {/* Avatar */}
          {athlete.photoURL ? (
            <img src={athlete.photoURL} alt={`${athlete.firstName} ${athlete.lastName}`}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-brand-500/30" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-xl font-bold text-dark ring-4 ring-brand-500/30">
              {getInitials(athlete.firstName, athlete.lastName)}
            </div>
          )}

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-surface">{athlete.firstName} {athlete.lastName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {athlete.position && (
                <span className="text-sm font-medium text-brand-500">{athlete.position}</span>
              )}
              {athlete.nationality && (
                <span className="text-sm text-muted">· {athlete.nationality}</span>
              )}
              {age !== null && (
                <span className="text-sm text-muted">· {age} años</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {athlete.currentClub && (
                <span className="rounded-full bg-dark-100 px-3 py-1 text-xs font-medium text-muted">
                  {athlete.currentClub}
                </span>
              )}
              {athlete.evaluationCount ? (
                <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
                  {athlete.evaluationCount} evaluación{athlete.evaluationCount !== 1 ? "es" : ""}
                </span>
              ) : null}
            </div>
          </div>

          {/* Edit button */}
          <Link
            href={`/athletes/${athlete.id}/edit`}
            className="shrink-0 rounded-lg border border-dark-50 bg-dark-50/80 px-4 py-2 text-sm font-medium text-surface backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:text-brand-500"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "text-surface" : "text-muted hover:text-surface"
            }`}
          >
            <span className={activeTab === tab.id ? "text-brand-500" : "text-muted"}>
              {tab.icon}
            </span>
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Datos Personales */}
            <div className="rounded-2xl border border-dark-50 bg-dark-50 p-5">
              <SectionTitle icon="person" label="Datos Personales" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Fecha de Nacimiento" value={formatDate(athlete.dateOfBirth)} />
                <DataField label="Nacionalidad" value={athlete.nationality} />
                {age !== null && <DataField label="Edad" value={`${age} años`} />}
                {athlete.contactPhone && <DataField label="Teléfono" value={athlete.contactPhone} />}
                {athlete.contactEmail && (
                  <div className="col-span-2">
                    <DataField label="Email" value={athlete.contactEmail} />
                  </div>
                )}
              </div>
            </div>

            {/* Datos Profesionales */}
            <div className="rounded-2xl border border-dark-50 bg-dark-50 p-5">
              <SectionTitle icon="work" label="Datos Profesionales" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {athlete.position && <DataField label="Posición" value={athlete.position} />}
                {athlete.preferredFoot && (
                  <DataField label="Pie Dominante" value={FOOT_LABEL[athlete.preferredFoot] ?? athlete.preferredFoot} />
                )}
                {athlete.height && <DataField label="Estatura" value={`${athlete.height} m`} />}
                {athlete.weight && <DataField label="Peso" value={`${athlete.weight} kg`} />}
                {athlete.currentClub && <DataField label="Club Actual" value={athlete.currentClub} />}
                {athlete.contractEnd && <DataField label="Fin Contrato" value={athlete.contractEnd} />}
                {athlete.secondaryPosition && (
                  <DataField label="Posición Secundaria" value={athlete.secondaryPosition} />
                )}
              </div>
            </div>

            {/* Representante */}
            {athlete.representative && (
              <div className="rounded-2xl border border-dark-50 bg-dark-50 p-5">
                <SectionTitle icon="contact" label="Representante" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DataField label="Nombre" value={athlete.representative.name} />
                  {athlete.representative.agency && <DataField label="Agencia" value={athlete.representative.agency} />}
                  {athlete.representative.email && (
                    <div className="col-span-2">
                      <DataField label="Email" value={athlete.representative.email} />
                    </div>
                  )}
                  {athlete.representative.phone && <DataField label="Teléfono" value={athlete.representative.phone} />}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Historial de Clubes */}
            <div className="rounded-2xl border border-dark-50 bg-dark-50 p-6">
              <SectionTitle icon="history" label="Historial de Clubes" />
              {history.length === 0 ? (
                <EmptyState text="Sin historial de clubes registrado." />
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-dark-100" />
                  <div className="space-y-6">
                    {history.map((entry, i) => {
                      const isCurrent = !entry.endYear;
                      return (
                        <div key={i} className="relative flex gap-4 pl-6">
                          <div className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ${isCurrent ? "border-brand-500 bg-brand-500" : "border-dark-100 bg-dark-50"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-surface">{entry.club}</p>
                            <p className={`mt-0.5 text-xs font-medium ${isCurrent ? "text-brand-500" : "text-muted"}`}>
                              {entry.startYear} – {isCurrent ? "Presente" : entry.endYear}
                            </p>
                            {entry.position && <p className="mt-0.5 text-xs text-muted">{entry.position}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Títulos y Reconocimientos */}
            <div className="rounded-2xl border border-dark-50 bg-dark-50 p-6">
              <SectionTitle icon="trophy" label="Títulos y Reconocimientos" />
              {titles.length === 0 ? (
                <EmptyState text="Sin títulos registrados." />
              ) : (
                <div className="space-y-3">
                  {titles.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-dark-100 bg-dark-100 px-4 py-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-50">
                        <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface">{t.title}</p>
                        <p className="mt-0.5 text-xs text-muted">{[t.club, t.year].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <EvaluacionesTab athlete={athlete} />
      )}
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ label, icon }: { label: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    person: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    work: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
    contact: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    history: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    trophy: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-brand-500">{icons[icon]}</span>
      <h3 className="text-sm font-semibold text-surface">{label}</h3>
    </div>
  );
}
