"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Athlete } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type EvalViewType = "per_evaluation" | "consolidated";
type ReportStatus = "idle" | "sending" | "processing" | "completed" | "failed";

interface ReportOptions {
  includeCharts: boolean;
  evalViewType: EvalViewType;
  personalData: boolean;
  representativeData: boolean;
  clubHistory: boolean;
  titles: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}


// ─── Toggle Switch ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-brand-500" : "bg-dark-50"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Segmented Control ───────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex rounded-lg bg-dark-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-brand-500 text-dark shadow-sm"
              : "text-muted hover:text-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// (Report HTML is now generated server-side by Claude AI)

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportsClient() {
  const { getFirebaseToken, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("idle");
  const [reportEmail, setReportEmail] = useState("");
  const [reportError, setReportError] = useState("");

  const [options, setOptions] = useState<ReportOptions>({
    includeCharts: true,
    evalViewType: "per_evaluation",
    personalData: true,
    representativeData: false,
    clubHistory: true,
    titles: false,
  });

  // Fetch athletes
  useEffect(() => {
    if (authLoading || !firebaseUser) return;

    setLoading(true);
    getFirebaseToken().then(async (token) => {
      try {
        const res = await fetch(`${API_BASE}/athletes?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAthletes(data.athletes ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    });
  }, [authLoading, firebaseUser, getFirebaseToken]);

  // Filtered athletes
  const filtered = useMemo(() => {
    if (!search.trim()) return athletes;
    const q = search.toLowerCase();
    return athletes.filter(
      (a) =>
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q)
    );
  }, [athletes, search]);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === athletes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(athletes.map((a) => a.id)));
    }
  }, [athletes, selectedIds.size]);

  // Summary items
  const summaryItems = useMemo(() => {
    const items: string[] = [];
    if (options.personalData) items.push("Datos personales");
    if (options.representativeData) items.push("Representante");
    if (options.clubHistory) items.push("Historial de clubes");
    if (options.titles) items.push("Premios y reconocimientos");
    return items;
  }, [options]);

  // Generate report via AI (async — sent by email)
  const handleGenerate = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setReportStatus("sending");
    setReportError("");
    setReportEmail("");

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          athleteIds: Array.from(selectedIds),
          options,
          userName: firebaseUser?.displayName ?? undefined,
        }),
      });

      const data = await res.json() as {
        message?: string;
        reportId?: string;
        email?: string;
        error?: string;
      };

      if (!res.ok) {
        setReportStatus("failed");
        setReportError(data.error ?? `Error ${res.status}`);
        return;
      }

      setReportStatus("processing");
      setReportEmail(data.email ?? "");

      // Poll status for up to 2 minutes
      if (data.reportId) {
        const reportId = data.reportId;
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`${API_BASE}/reports/${reportId}/status`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const statusData = await statusRes.json() as {
              report?: { status: string; error?: string };
            };
            if (statusData.report?.status === "completed") {
              setReportStatus("completed");
              clearInterval(poll);
            } else if (statusData.report?.status === "failed") {
              setReportStatus("failed");
              setReportError(statusData.report.error ?? "Error al generar el reporte");
              clearInterval(poll);
            }
          } catch { /* ignore polling errors */ }
          if (attempts >= 24) {
            // Stop polling after ~2 min, assume still processing
            setReportStatus("completed");
            clearInterval(poll);
          }
        }, 5000);
      }
    } catch (err) {
      setReportStatus("failed");
      setReportError(err instanceof Error ? err.message : "Error de conexion");
    }
  }, [selectedIds, options, getFirebaseToken, firebaseUser]);

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
        <h1 className="text-2xl font-bold text-surface">Generar Reporte</h1>
        <p className="mt-1 text-sm text-muted">
          Configura y genera informes detallados de tus deportistas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
        {/* ── Left Panel: Select Athletes ── */}
        <div className="rounded-xl border border-dark-50 bg-dark-100">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-surface">
              Seleccionar Deportistas
            </h2>
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="border-b border-white/5 px-5 py-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar deportista por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-dark-50 bg-dark py-2.5 pl-10 pr-4 text-sm text-surface placeholder:text-muted focus:border-brand-500/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Athletes list */}
          <div className="max-h-[460px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">
                {search ? "Sin resultados" : "Sin deportistas registrados"}
              </p>
            ) : (
              filtered.map((a) => {
                const isSelected = selectedIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleSelect(a.id)}
                    className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-3.5 text-left transition-colors last:border-0 ${
                      isSelected
                        ? "bg-brand-500/5"
                        : "hover:bg-dark-50/50"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-500"
                          : "border-dark-50"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>

                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {a.photoURL ? (
                        <img src={a.photoURL} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-xs font-bold text-dark">
                          {getInitials(a.firstName, a.lastName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-surface">
                          {a.firstName} {a.lastName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {a.position ?? "Sin posición"} · {a.currentClub ?? "Sin club"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <span className="text-xs text-muted">
              {selectedIds.size} deportista{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <button
              onClick={selectAll}
              className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-400"
            >
              {selectedIds.size === athletes.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>
        </div>

        {/* ── Right Panel: Report Options ── */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-dark-50 bg-dark-100">
            <div className="border-b border-white/5 px-5 py-4">
              <h2 className="text-sm font-semibold text-surface">
                Opciones del Reporte
              </h2>
            </div>

            <div className="divide-y divide-white/5 px-5">
              {/* Include charts */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-surface">Incluir gráficos</p>
                  <p className="mt-0.5 text-xs text-muted">Radar charts y gráficos de evolución</p>
                </div>
                <Toggle
                  checked={options.includeCharts}
                  onChange={(v) => setOptions((o) => ({ ...o, includeCharts: v }))}
                />
              </div>

              {/* Evaluation type */}
              <div className="py-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-surface">Tipo de evaluación</p>
                  <p className="mt-0.5 text-xs text-muted">Detalle individual o resumen consolidado</p>
                </div>
                <SegmentedControl
                  value={options.evalViewType}
                  onChange={(v) =>
                    setOptions((o) => ({ ...o, evalViewType: v as EvalViewType }))
                  }
                  options={[
                    { value: "per_evaluation", label: "Por evaluación" },
                    { value: "consolidated", label: "Consolidado" },
                  ]}
                />
              </div>

              {/* Personal data */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-surface">Datos personales</p>
                  <p className="mt-0.5 text-xs text-muted">Nombre, edad, nacionalidad, contacto</p>
                </div>
                <Toggle
                  checked={options.personalData}
                  onChange={(v) => setOptions((o) => ({ ...o, personalData: v }))}
                />
              </div>

              {/* Representative */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-surface">Datos del representante</p>
                  <p className="mt-0.5 text-xs text-muted">Nombre, contacto y relación contractual</p>
                </div>
                <Toggle
                  checked={options.representativeData}
                  onChange={(v) => setOptions((o) => ({ ...o, representativeData: v }))}
                />
              </div>

              {/* Club history */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-surface">Historial de clubes</p>
                  <p className="mt-0.5 text-xs text-muted">Timeline de clubes anteriores</p>
                </div>
                <Toggle
                  checked={options.clubHistory}
                  onChange={(v) => setOptions((o) => ({ ...o, clubHistory: v }))}
                />
              </div>

              {/* Titles */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-surface">Premios y reconocimientos</p>
                  <p className="mt-0.5 text-xs text-muted">Títulos, logros y distinciones</p>
                </div>
                <Toggle
                  checked={options.titles}
                  onChange={(v) => setOptions((o) => ({ ...o, titles: v }))}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-dark-50 bg-dark-50 px-5 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
              Resumen del reporte
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-surface">
                <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {selectedIds.size} deportista{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2 text-xs text-surface">
                <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                {options.includeCharts ? "Con gráficos" : "Sin gráficos"} · {options.evalViewType === "per_evaluation" ? "Por evaluación" : "Consolidado"}
              </div>
              {summaryItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-surface">
                  <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  {summaryItems.join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Status message */}
          {reportStatus === "processing" && (
            <div className="flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent shrink-0" />
              <div>
                <p className="text-sm font-medium text-brand-500">Generando reporte con IA...</p>
                <p className="text-xs text-muted mt-0.5">
                  Sera enviado a <span className="font-medium text-surface">{reportEmail}</span>
                </p>
              </div>
            </div>
          )}

          {reportStatus === "completed" && (
            <div className="flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3">
              <svg className="h-5 w-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <div>
                <p className="text-sm font-medium text-brand-500">Reporte enviado</p>
                <p className="text-xs text-muted mt-0.5">
                  Revisa tu correo: <span className="font-medium text-surface">{reportEmail}</span>
                </p>
              </div>
            </div>
          )}

          {reportStatus === "failed" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-400">Error al generar</p>
                <p className="text-xs text-muted mt-0.5">{reportError}</p>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || reportStatus === "sending" || reportStatus === "processing"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reportStatus === "sending" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark border-t-transparent" />
                Enviando solicitud...
              </>
            ) : reportStatus === "processing" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark border-t-transparent" />
                Procesando con IA...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Generar Reporte con IA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
