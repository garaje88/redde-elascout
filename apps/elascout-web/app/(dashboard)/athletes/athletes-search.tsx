"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Athlete } from "@/lib/api";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";

const NATIONALITIES = [
  "Argentina", "Brasil", "Colombia", "España", "Francia",
  "México", "Portugal", "Uruguay", "Alemania", "Italia",
  "Chile", "Perú", "Venezuela", "Ecuador", "Bolivia",
];

const POSITIONS = [
  "Portero", "Defensa central", "Lateral derecho", "Lateral izquierdo",
  "Mediocampista defensivo", "Mediocampista", "Mediocampista ofensivo",
  "Extremo derecho", "Extremo izquierdo", "Delantero centro", "Segunda punta",
];

const AGE_RANGES = [
  { label: "Sub-18", value: "0-17" },
  { label: "18–23 años", value: "18-23" },
  { label: "24–29 años", value: "24-29" },
  { label: "30–35 años", value: "30-35" },
  { label: "35+ años", value: "36-99" },
];

const PAGE_SIZE = 10;
const TEXT_MIN_CHARS = 3;
const DEBOUNCE_MS = 400;

interface FilterState {
  query: string;
  nationality: string;
  position: string;
  ageRange: string;
  club: string;
}

const EMPTY_FILTERS: FilterState = {
  query: "",
  nationality: "",
  position: "",
  ageRange: "",
  club: "",
};

function computeAge(iso: string | undefined): number | null {
  if (!iso) return null;
  try {
    const birth = new Date(iso);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-brand-500 to-cyan-500",
  "from-violet-500 to-brand-500",
  "from-blue-500 to-brand-500",
  "from-orange-500 to-brand-500",
  "from-rose-500 to-violet-500",
];

function getGradient(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

const selectClass =
  "h-10 rounded-lg border border-dark-50 bg-dark-50 px-3 text-sm text-surface transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer pr-8";

export function AthletesSearch() {
  const { firebaseUser, getFirebaseToken, loading: authLoading } = useFirebaseAuth();

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Refs for debounce timers
  const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clubDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAthletes = useCallback(
    async (currentFilters: FilterState) => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getFirebaseToken();
        const base = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/athletes`;
        const params = new URLSearchParams();
        if (currentFilters.query) params.set("search", currentFilters.query);
        if (currentFilters.nationality) params.set("nationality", currentFilters.nationality);
        if (currentFilters.position) params.set("position", currentFilters.position);
        if (currentFilters.ageRange) params.set("ageRange", currentFilters.ageRange);
        if (currentFilters.club) params.set("club", currentFilters.club);
        params.set("limit", "100");

        const url = `${base}?${params.toString()}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json() as { athletes: Athlete[]; hasMore: boolean };
        setAthletes(data.athletes);
        setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar deportistas");
      } finally {
        setIsLoading(false);
      }
    },
    [getFirebaseToken]
  );

  // Handlers for select filters (immediate)
  function handleSelectChange(key: keyof FilterState) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const next = { ...filters, [key]: value };
      setFilters(next);
      setPage(1);
      void fetchAthletes(next);
    };
  }

  // Handler for text inputs with debounce (0 chars or 3+ chars)
  function handleTextChange(
    key: "query" | "club",
    debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const next = { ...filters, [key]: value };
      setFilters(next);
      setPage(1);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const shouldFetch = value.length === 0 || value.length >= TEXT_MIN_CHARS;
      if (!shouldFetch) return;

      debounceRef.current = setTimeout(() => {
        void fetchAthletes(next);
      }, DEBOUNCE_MS);
    };
  }

  function clearFilters() {
    if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current);
    setFilters(EMPTY_FILTERS);
    setAthletes([]);
    setPage(1);
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(athletes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = athletes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters =
    filters.query || filters.nationality || filters.position || filters.ageRange || filters.club;

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (safePage > 3) pages.push("...");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  // Auth loading state
  if (authLoading || !firebaseUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full flex-1 sm:min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={filters.query}
            onChange={handleTextChange("query", queryDebounceRef)}
            placeholder="Buscar por nombre o apellido..."
            className="h-10 w-full rounded-lg border border-dark-50 bg-dark-50 pl-9 pr-4 text-sm text-surface placeholder:text-muted transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Nacionalidad */}
        <div className="relative">
          <select
            value={filters.nationality}
            onChange={handleSelectChange("nationality")}
            className={selectClass}
          >
            <option value="">Nacionalidad</option>
            {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Posición */}
        <div className="relative">
          <select
            value={filters.position}
            onChange={handleSelectChange("position")}
            className={selectClass}
          >
            <option value="">Posición</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Rango de edad */}
        <div className="relative">
          <select
            value={filters.ageRange}
            onChange={handleSelectChange("ageRange")}
            className={selectClass}
          >
            <option value="">Rango de edad</option>
            {AGE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Club / Organización */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={filters.club}
            onChange={handleTextChange("club", clubDebounceRef)}
            placeholder="Organización"
            className="h-10 w-full rounded-lg border border-dark-50 bg-dark-50 px-3 text-sm text-surface placeholder:text-muted transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-40"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-dark-50 bg-dark-50 px-3 text-xs font-medium text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
      </div>

      {/* ── Counter ── */}
      {!isLoading && (
        <p className="text-xs text-muted">
          {athletes.length} deportista{athletes.length !== 1 ? "s" : ""} encontrado{athletes.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-dark-50 bg-dark-50">
        <div className="overflow-x-auto">
        {/* Table Header */}
        <div className="flex min-w-[640px] items-center bg-dark-100 px-4 py-0 sm:px-5" style={{ height: 48 }}>
          <div className="w-10 shrink-0 sm:w-12" />
          <div className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide text-muted">Nombre</div>
          <div className="hidden w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted md:block lg:w-36">Nacionalidad</div>
          <div className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted sm:w-32">Posición</div>
          <div className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted sm:w-20">Edad</div>
          <div className="hidden w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted lg:block xl:w-40">Organización</div>
          <div className="w-16 shrink-0 text-center text-xs font-semibold uppercase tracking-wide text-muted sm:w-20">Acciones</div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-xs text-muted-light">Cargando deportistas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-surface">Error al cargar</p>
            <p className="mt-1 text-xs text-muted-light">{error}</p>
            <button
              onClick={() => void fetchAthletes(filters)}
              className="mt-4 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dark-100">
              <svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-surface">
              {hasFilters ? "Sin resultados" : "Usa los filtros para buscar"}
            </p>
            <p className="mt-1 text-xs text-muted-light">
              {hasFilters
                ? "Ningún deportista coincide con los filtros aplicados."
                : "Selecciona un filtro o escribe 3+ caracteres para buscar deportistas."}
            </p>
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors"
              >
                Limpiar filtros
              </button>
            ) : (
              <Link
                href="/athletes/new"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar deportista
              </Link>
            )}
          </div>
        ) : (
          <div>
            {paginated.map((athlete, i) => {
              const age = computeAge(athlete.dateOfBirth);
              const initials = getInitials(athlete.firstName, athlete.lastName);
              const gradient = getGradient(athlete.firstName);
              const isLast = i === paginated.length - 1;

              return (
                <div
                  key={athlete.id}
                  className={`group flex min-w-[640px] items-center px-4 transition-colors hover:bg-dark-100/50 active:bg-dark-100/50 sm:px-5 ${!isLast ? "border-b border-dark-100" : ""}`}
                  style={{ height: 56 }}
                >
                  {/* Avatar */}
                  <div className="w-10 shrink-0 sm:w-12">
                    {athlete.photoURL ? (
                      <img
                        src={athlete.photoURL}
                        alt={`${athlete.firstName} ${athlete.lastName}`}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-dark-100 sm:h-9 sm:w-9"
                      />
                    ) : (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-dark sm:h-9 sm:w-9`}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-surface">
                      {athlete.firstName} {athlete.lastName}
                    </p>
                    {athlete.contactEmail && (
                      <p className="truncate text-xs text-muted">{athlete.contactEmail}</p>
                    )}
                  </div>

                  {/* Nacionalidad — hidden on small screens */}
                  <div className="hidden w-32 shrink-0 md:block lg:w-36">
                    <span className="text-sm text-muted-light">{athlete.nationality || "—"}</span>
                  </div>

                  {/* Posición */}
                  <div className="w-28 shrink-0 sm:w-32">
                    {athlete.position ? (
                      <span className="inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-500 sm:px-2.5 sm:text-xs">
                        {athlete.position}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </div>

                  {/* Edad */}
                  <div className="w-16 shrink-0 sm:w-20">
                    <span className="text-sm text-muted-light">{age !== null ? age : "—"}</span>
                  </div>

                  {/* Organización — hidden on small screens */}
                  <div className="hidden w-36 shrink-0 lg:block xl:w-40">
                    <span className="truncate text-sm text-muted-light">{athlete.currentClub || "—"}</span>
                  </div>

                  {/* Acciones — touch-friendly size */}
                  <div className="w-16 shrink-0 flex items-center justify-center gap-2 sm:w-20 sm:gap-3">
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
                      title="Ver perfil"
                    >
                      <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/athletes/${athlete.id}/edit`}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
                      title="Editar"
                    >
                      <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>{/* close overflow-x-auto */}

        {/* ── Pagination ── */}
        {!isLoading && athletes.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-dark-100 bg-dark-100 px-4 py-3 sm:flex-row sm:px-5">
            <p className="text-xs text-muted">
              Mostrando {Math.min((safePage - 1) * PAGE_SIZE + 1, athletes.length)}–{Math.min(safePage * PAGE_SIZE, athletes.length)} de {athletes.length}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 rounded-md border border-dark-50 px-2 py-1.5 text-xs text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface active:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-muted sm:px-2">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[36px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      safePage === p
                        ? "bg-brand-500 text-dark"
                        : "text-muted-light hover:bg-dark-50 hover:text-surface active:bg-dark-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 rounded-md border border-dark-50 px-2 py-1.5 text-xs text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface active:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
