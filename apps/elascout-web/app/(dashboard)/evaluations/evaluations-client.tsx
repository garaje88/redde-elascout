"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Evaluation, EvaluationStatus, GameFormation } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function minutesRemaining(startedAt: string): number {
  return Math.max(0, 90 - Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { getFirebaseToken } = useFirebaseAuth();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`${API_BASE}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "game", title: title.trim(), notes: notes.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Error al crear");
      const data = await res.json() as { evaluation: Evaluation };
      onCreated(data.evaluation.id);
    } catch {
      setError("No se pudo crear la evaluación. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-dark-50 bg-dark-50 p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface">Nueva Evaluación</h2>
            <p className="text-sm text-muted">Campo interactivo con equipos y deportistas</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface">Título *</label>
            <input
              type="text"
              placeholder="Ej. Pretemporada — Semana 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface">Notas (opcional)</label>
            <textarea
              placeholder="Contexto, objetivos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted transition-colors hover:text-surface"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || saving}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-dark transition-opacity disabled:opacity-50 hover:opacity-90"
          >
            {saving ? "Creando..." : "Ir al Campo →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ evaluation }: { evaluation: Evaluation }) {
  if (evaluation.status === "active") {
    const mins = minutesRemaining(evaluation.startedAt);
    const urgent = mins < 15;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${urgent ? "bg-amber-500/20 text-amber-400" : "bg-brand-500/20 text-brand-500"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-amber-400" : "bg-brand-500"} animate-pulse`} />
        Activa{mins < 30 ? ` · ${mins}min` : ""}
      </span>
    );
  }
  if (evaluation.status === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Expirada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-100 px-2.5 py-1 text-xs font-semibold text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
      Completada
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function EvaluationsClient() {
  const router = useRouter();
  const { getFirebaseToken, loading: authLoading, firebaseUser } = useFirebaseAuth();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [filterStatus, setFilterStatus] = useState<EvaluationStatus | "">("");
  const [search, setSearch] = useState("");

  const hasFetched = useRef(false);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getFirebaseToken();
      const qs = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`${API_BASE}/evaluations${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json() as { evaluations: Evaluation[] };
      setEvaluations(data.evaluations);
    } catch {
      setError("No se pudieron cargar las evaluaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [getFirebaseToken, filterStatus]);

  useEffect(() => {
    if (authLoading || !firebaseUser || hasFetched.current) return;
    hasFetched.current = true;
    fetchEvaluations();
  }, [authLoading, firebaseUser, fetchEvaluations]);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    hasFetched.current = false;
    fetchEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  function handleCreated(id: string) {
    setShowCreate(false);
    router.push(`/evaluations/${id}`);
  }

  const urgentEvals = evaluations.filter(
    (e) => e.status === "active" && minutesRemaining(e.startedAt) < 15
  );

  const filtered = evaluations.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface">Evaluaciones</h1>
          <p className="mt-1 text-sm text-muted">
            Crea y gestiona evaluaciones de tus deportistas en campo interactivo.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-dark transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear Evaluación
        </button>
      </div>

      {/* Urgent alert */}
      {urgentEvals.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-300">
            <span className="font-semibold">
              {urgentEvals.length} evaluación{urgentEvals.length > 1 ? "es" : ""} activa{urgentEvals.length > 1 ? "s" : ""}
            </span>
            {" "}se {urgentEvals.length > 1 ? "cierran" : "cierra"} en menos de 15 minutos.
          </p>
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-xl border border-dark-50 bg-dark-50">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-dark-50 px-5 py-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as EvaluationStatus | "")}
            className="rounded-lg border border-dark-50 bg-dark-100 px-3 py-2 text-sm text-surface focus:border-brand-500 focus:outline-none"
          >
            <option value="">Estado</option>
            <option value="active">Activas</option>
            <option value="completed">Completadas</option>
            <option value="expired">Expiradas</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar evaluación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-dark-50 bg-dark-100 pl-9 pr-4 py-2 text-sm text-surface placeholder:text-muted focus:border-brand-500 focus:outline-none"
            />
          </div>

          {(filterStatus || search) && (
            <button
              onClick={() => { setFilterStatus(""); setSearch(""); }}
              className="text-sm text-muted transition-colors hover:text-surface"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={fetchEvaluations} className="mt-3 text-sm text-brand-500 hover:underline">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
            <p className="text-sm font-medium text-muted">Sin evaluaciones aún</p>
            <p className="mt-1 text-xs text-muted">
              {search || filterStatus ? "Prueba con otros filtros" : "Crea tu primera evaluación"}
            </p>
            {!search && !filterStatus && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-dark transition-opacity hover:opacity-90"
              >
                Crear Evaluación →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-50 bg-dark-100/50">
                  {["Evaluación", "Fecha", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {filtered.map((ev) => {
                  const formation = ev.formation as GameFormation | undefined;
                  const totalPlayers = formation?.athletes?.length ?? 0;
                  const homeName = formation?.homeTeam?.name;
                  const awayName = formation?.awayTeam?.name;
                  const hasMatch = totalPlayers > 0;

                  return (
                    <tr key={ev.id} className="group transition-colors hover:bg-dark-100/40">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-surface">{ev.title}</p>
                        {hasMatch ? (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {homeName || "Local"}
                            </span>
                            <span className="text-[10px] text-muted">vs</span>
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {awayName || "Visitante"}
                            </span>
                            <span className="text-[10px] text-muted">{totalPlayers} jugadores</span>
                          </div>
                        ) : ev.notes ? (
                          <p className="mt-0.5 text-xs text-muted line-clamp-1">{ev.notes}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted">
                        {formatDate(ev.startedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge evaluation={ev} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/evaluations/${ev.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-dark-100 hover:text-surface"
                          title="Abrir campo"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
