"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Athlete, Evaluation } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const POSITION_GROUPS: Record<string, string> = {
  Portero: "Portero",
  "Defensa Central": "Defensa",
  "Lateral Derecho": "Defensa",
  "Lateral Izquierdo": "Defensa",
  Defensa: "Defensa",
  "Mediocampista Central": "Medio",
  "Mediocampista Ofensivo": "Medio",
  "Mediocampista Defensivo": "Medio",
  Mediocampista: "Medio",
  "Medio Centro": "Medio",
  Volante: "Medio",
  "Extremo Derecho": "Delantero",
  "Extremo Izquierdo": "Delantero",
  "Delantero Centro": "Delantero",
  Delantero: "Delantero",
  "Media Punta": "Delantero",
};

const GROUP_ORDER = ["Portero", "Defensa", "Medio", "Delantero"];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
];

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconAthletes() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconEval() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function IconScouts() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  sub,
  subColor = "text-brand-500",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-xl border border-dark-50 bg-dark-100 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
        {icon}
      </div>
      <p className="text-3xl font-bold text-surface">{value}</p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-56 items-end justify-around gap-4 px-4 pb-8 pt-4">
      {data.map((d) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-surface tabular-nums">{d.value}</span>
            <div className="w-full max-w-[64px] overflow-hidden rounded-t-lg bg-brand-500/20" style={{ height: `${Math.max(pct, 4)}%` }}>
              <div
                className="h-full w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-emerald-400"
                style={{ height: "100%" }}
              />
            </div>
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Line Chart ──────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const W = 500;
  const H = 200;
  const px = 10;
  const py = 10;

  const points = data.map((d, i) => ({
    x: px + (i / Math.max(data.length - 1, 1)) * (W - 2 * px),
    y: py + (1 - (d.value - minVal) / range) * (H - 2 * py),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1]!.x},${H} L${points[0]!.x},${H} Z`;

  // Y-axis labels
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(minVal + (range * i) / ySteps));

  return (
    <div className="relative h-56 px-4 pb-8 pt-4">
      {/* Y labels */}
      <div className="absolute left-0 top-4 bottom-8 flex flex-col justify-between pl-2">
        {yLabels.reverse().map((v, i) => (
          <span key={i} className="text-[10px] text-muted tabular-nums">{v}</span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="ml-6 h-full w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {Array.from({ length: ySteps + 1 }, (_, i) => {
          const y = py + (i / ySteps) * (H - 2 * py);
          return <line key={i} x1={px} y1={y} x2={W - px} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
        })}
        {/* Area */}
        <path d={areaD} fill="url(#lineGrad)" opacity={0.2} />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#00E59B" strokeWidth={2.5} strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#00E59B" />
        ))}
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E59B" />
            <stop offset="100%" stopColor="#00E59B" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* X labels */}
      <div className="ml-6 flex justify-between px-2">
        {data.map((d) => (
          <span key={d.label} className="text-[10px] text-muted">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Score Bar (inline mini bar) ─────────────────────────────────────────────

function ScoreMiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 70 ? "bg-brand-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-dark-50">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-surface tabular-nums">{Math.round(value)}</span>
    </div>
  );
}

// ─── Activity Item ───────────────────────────────────────────────────────────

function ActivityItem({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────────────────

export function DashboardClient() {
  const { getFirebaseToken, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;

    setLoading(true);
    getFirebaseToken().then(async (token) => {
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [athRes, evalRes] = await Promise.all([
          fetch(`${API_BASE}/athletes?limit=100`, { headers }),
          fetch(`${API_BASE}/evaluations`, { headers }),
        ]);

        if (athRes.ok) {
          const data = await athRes.json();
          setAthletes(data.athletes ?? []);
        }
        if (evalRes.ok) {
          const data = await evalRes.json();
          setEvaluations(data.evaluations ?? []);
        }
      } catch {
        // silently fail - dashboard shows zeros
      } finally {
        setLoading(false);
      }
    });
  }, [authLoading, firebaseUser, getFirebaseToken]);

  // ── Computed stats ──

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const athletesThisMonth = athletes.filter((a) => {
    const d = new Date(a.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const evalsThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return evaluations.filter((e) => new Date(e.createdAt).getTime() > weekAgo).length;
  }, [evaluations]);

  const completedEvals = evaluations.filter((e) => e.status === "completed");

  const overallAvg = useMemo(() => {
    const withScores = athletes.filter(
      (a) => a.evaluationCount && a.evaluationCount > 0 && a.physicalAvg
    );
    if (withScores.length === 0) return 0;

    const total = withScores.reduce((sum, a) => {
      const phys = a.physicalAvg as Record<string, number> | undefined;
      if (!phys) return sum;
      const vals = Object.values(phys).filter((v) => v > 0);
      return sum + (vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0);
    }, 0);

    return Math.round((total / withScores.length) * 10) / 10;
  }, [athletes]);

  // Position distribution
  const positionDist = useMemo(() => {
    const counts: Record<string, number> = { Portero: 0, Defensa: 0, Medio: 0, Delantero: 0 };
    athletes.forEach((a) => {
      const group = POSITION_GROUPS[a.position ?? ""] ?? "Medio";
      counts[group] = (counts[group] ?? 0) + 1;
    });
    return GROUP_ORDER.map((g) => ({ label: g, value: counts[g] ?? 0 }));
  }, [athletes]);

  // Monthly evaluation trend (last 6 months)
  const evalTrend = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const count = evaluations.filter((e) => {
        const ed = new Date(e.createdAt);
        return ed.getMonth() === month && ed.getFullYear() === year;
      }).length;
      months.push({
        label: d.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
        value: count,
      });
    }
    return months;
  }, [evaluations, thisMonth, thisYear]);

  // Recent athletes (last 5)
  const recentAthletes = useMemo(() => {
    return [...athletes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [athletes]);

  // Recent activity (combine athletes + evaluations, sorted by date)
  const recentActivity = useMemo(() => {
    const items: { type: string; title: string; subtitle: string; date: string }[] = [];

    athletes.slice(0, 20).forEach((a) => {
      items.push({
        type: "athlete",
        title: "Nuevo deportista agregado",
        subtitle: `${a.firstName} ${a.lastName} · ${timeAgo(a.createdAt)}`,
        date: a.createdAt,
      });
    });

    evaluations.slice(0, 20).forEach((e) => {
      if (e.status === "completed") {
        items.push({
          type: "eval_done",
          title: "Evaluación completada",
          subtitle: `${e.title} · ${timeAgo(e.updatedAt)}`,
          date: e.updatedAt,
        });
      } else {
        items.push({
          type: "eval_created",
          title: "Evaluación creada",
          subtitle: `${e.title} · ${timeAgo(e.createdAt)}`,
          date: e.createdAt,
        });
      }
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [athletes, evaluations]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Vista general de tu organización</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconAthletes />}
          value={athletes.length}
          label="Total Deportistas"
          sub={athletesThisMonth > 0 ? `+${athletesThisMonth} este mes` : undefined}
        />
        <StatCard
          icon={<IconEval />}
          value={evaluations.length}
          label="Evaluaciones Realizadas"
          sub={evalsThisWeek > 0 ? `+${evalsThisWeek} esta semana` : undefined}
        />
        <StatCard
          icon={<IconTarget />}
          value={overallAvg > 0 ? overallAvg : "—"}
          label="Promedio General"
          sub={overallAvg > 0 ? "/100" : undefined}
        />
        <StatCard
          icon={<IconScouts />}
          value={completedEvals.length}
          label="Evaluaciones Completadas"
          sub={completedEvals.length > 0 ? `${Math.round((completedEvals.length / Math.max(evaluations.length, 1)) * 100)}% del total` : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Position Distribution */}
        <div className="rounded-xl border border-dark-50 bg-dark-100">
          <div className="border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-surface">Distribución por Posición</h2>
          </div>
          {athletes.length > 0 ? (
            <BarChart data={positionDist} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Sin datos de posiciones</p>
          )}
        </div>

        {/* Evaluation Trend */}
        <div className="rounded-xl border border-dark-50 bg-dark-100">
          <div className="border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-surface">Tendencia de Evaluaciones</h2>
          </div>
          {evaluations.length > 0 ? (
            <LineChart data={evalTrend} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Sin evaluaciones registradas</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        {/* Recent Athletes Table */}
        <div className="rounded-xl border border-dark-50 bg-dark-100">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-surface">Deportistas Recientes</h2>
            <Link
              href="/athletes"
              className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-400"
            >
              Ver todos →
            </Link>
          </div>

          {recentAthletes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Sin deportistas registrados</p>
          ) : (
            <div className="overflow-x-auto">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_100px_80px] items-center gap-2 border-b border-white/5 px-5 py-2.5">
                <span className="text-xs text-muted">Nombre</span>
                <span className="text-xs text-muted">Posición</span>
                <span className="text-xs text-muted">Club</span>
                <span className="text-xs text-muted text-right">Puntuación</span>
              </div>

              {/* Table rows */}
              {recentAthletes.map((a, i) => {
                const physAvg = a.physicalAvg as Record<string, number> | undefined;
                const avgScore = physAvg
                  ? (() => {
                      const vals = Object.values(physAvg).filter((v) => v > 0);
                      return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                    })()
                  : 0;

                return (
                  <Link
                    key={a.id}
                    href={`/athletes/${a.id}`}
                    className="grid grid-cols-[1fr_80px_100px_80px] items-center gap-2 border-b border-white/5 px-5 py-3 transition-colors last:border-0 hover:bg-dark-50/50"
                  >
                    {/* Name + avatar */}
                    <div className="flex items-center gap-3 min-w-0">
                      {a.photoURL ? (
                        <img src={a.photoURL} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {getInitials(a.firstName, a.lastName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-surface">
                          {a.firstName} {a.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          {calcAge(a.dateOfBirth)} años · {a.nationality}
                        </p>
                      </div>
                    </div>

                    {/* Position badge */}
                    <span className="inline-flex items-center justify-center rounded bg-dark-50 px-1.5 py-0.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                      {a.position
                        ? a.position
                            .split(" ")
                            .map((w) => w.charAt(0))
                            .join("")
                            .toUpperCase()
                        : "—"}
                    </span>

                    {/* Club */}
                    <span className="truncate text-xs text-muted">{a.currentClub ?? "—"}</span>

                    {/* Score */}
                    <div className="flex justify-end">
                      {avgScore > 0 ? (
                        <ScoreMiniBar value={avgScore} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-dark-50 bg-dark-100">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-surface">Actividad Reciente</h2>
            {recentActivity.length > 0 && (
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-500">
                {recentActivity.length} nuevas
              </span>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-white/5 px-5">
              {recentActivity.map((item, i) => {
                let icon: React.ReactNode;
                let iconBg: string;

                switch (item.type) {
                  case "athlete":
                    icon = (
                      <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                      </svg>
                    );
                    iconBg = "bg-blue-500/10";
                    break;
                  case "eval_done":
                    icon = (
                      <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    );
                    iconBg = "bg-brand-500/10";
                    break;
                  default:
                    icon = (
                      <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    );
                    iconBg = "bg-amber-500/10";
                }

                return (
                  <ActivityItem
                    key={i}
                    icon={icon}
                    iconBg={iconBg}
                    title={item.title}
                    subtitle={item.subtitle}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
