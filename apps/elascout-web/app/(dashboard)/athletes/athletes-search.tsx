"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Athlete } from "@/lib/api";

const PAGE_SIZE = 10;

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
  { label: "Sub-18", min: 0, max: 17 },
  { label: "18–23 años", min: 18, max: 23 },
  { label: "24–29 años", min: 24, max: 29 },
  { label: "30–35 años", min: 30, max: 35 },
  { label: "35+ años", min: 36, max: 99 },
];

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

// Colores de avatar deterministas basados en iniciales
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

interface AthletesSearchProps {
  athletes: Athlete[];
}

export function AthletesSearch({ athletes }: AthletesSearchProps) {
  const [query, setQuery] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [ageRangeFilter, setAgeRangeFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const ageRange = AGE_RANGES.find((r) => r.label === ageRangeFilter);

    return athletes.filter((a) => {
      const matchesQuery =
        !q ||
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        a.nationality?.toLowerCase().includes(q) ||
        a.position?.toLowerCase().includes(q) ||
        a.currentClub?.toLowerCase().includes(q) ||
        a.contactEmail?.toLowerCase().includes(q);

      const matchesNationality = !nationalityFilter || a.nationality === nationalityFilter;
      const matchesPosition = !positionFilter || a.position === positionFilter;
      const matchesClub = !clubFilter || a.currentClub?.toLowerCase().includes(clubFilter.toLowerCase());

      const age = computeAge(a.dateOfBirth);
      const matchesAge =
        !ageRange ||
        (age !== null && age >= ageRange.min && age <= ageRange.max);

      return matchesQuery && matchesNationality && matchesPosition && matchesClub && matchesAge;
    });
  }, [athletes, query, nationalityFilter, positionFilter, ageRangeFilter, clubFilter]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = query || nationalityFilter || positionFilter || ageRangeFilter || clubFilter;

  function clearFilters() {
    setQuery("");
    setNationalityFilter("");
    setPositionFilter("");
    setAgeRangeFilter("");
    setClubFilter("");
    setPage(1);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  // Generate page numbers for pagination
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

  const selectClass =
    "h-10 rounded-lg border border-dark-50 bg-dark-50 px-3 text-sm text-surface transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer pr-8";

  return (
    <div className="space-y-4">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleFilterChange(setQuery)}
            placeholder="Buscar por nombre o apellido..."
            className="h-10 w-full rounded-lg border border-dark-50 bg-dark-50 pl-9 pr-4 text-sm text-surface placeholder:text-muted transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Nacionalidad */}
        <div className="relative">
          <select
            value={nationalityFilter}
            onChange={handleFilterChange(setNationalityFilter)}
            className={selectClass}
          >
            <option value="">Nacionalidad</option>
            {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Posición (Deporte en diseño) */}
        <div className="relative">
          <select
            value={positionFilter}
            onChange={handleFilterChange(setPositionFilter)}
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
            value={ageRangeFilter}
            onChange={handleFilterChange(setAgeRangeFilter)}
            className={selectClass}
          >
            <option value="">Rango de edad</option>
            {AGE_RANGES.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Club / Organización */}
        <div className="relative">
          <input
            type="text"
            value={clubFilter}
            onChange={handleFilterChange(setClubFilter)}
            placeholder="Organización"
            className="h-10 w-40 rounded-lg border border-dark-50 bg-dark-50 px-3 text-sm text-surface placeholder:text-muted transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-dark-50 bg-dark-50">
        {/* Table Header */}
        <div className="flex items-center bg-dark-100 px-5 py-0" style={{ height: 48 }}>
          <div className="w-12 shrink-0" />
          <div className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide text-muted">Nombre</div>
          <div className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Nacionalidad</div>
          <div className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Posición</div>
          <div className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Edad</div>
          <div className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Organización</div>
          <div className="w-20 shrink-0 text-center text-xs font-semibold uppercase tracking-wide text-muted">Acciones</div>
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dark-100">
              <svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-surface">
              {hasFilters ? "Sin resultados" : "Sin deportistas aún"}
            </p>
            <p className="mt-1 text-xs text-muted-light">
              {hasFilters
                ? "Ningún deportista coincide con los filtros aplicados."
                : "Agrega tu primer deportista para comenzar."}
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
                  className={`group flex items-center px-5 transition-colors hover:bg-dark-100/50 ${!isLast ? "border-b border-dark-100" : ""}`}
                  style={{ height: 56 }}
                >
                  {/* Avatar */}
                  <div className="w-12 shrink-0">
                    {athlete.photoURL ? (
                      <img
                        src={athlete.photoURL}
                        alt={`${athlete.firstName} ${athlete.lastName}`}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-dark-100"
                      />
                    ) : (
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-dark`}>
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

                  {/* Nacionalidad */}
                  <div className="w-36 shrink-0">
                    <span className="text-sm text-muted-light">{athlete.nationality || "—"}</span>
                  </div>

                  {/* Posición */}
                  <div className="w-32 shrink-0">
                    {athlete.position ? (
                      <span className="inline-block rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
                        {athlete.position}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </div>

                  {/* Edad */}
                  <div className="w-20 shrink-0">
                    <span className="text-sm text-muted-light">{age !== null ? age : "—"}</span>
                  </div>

                  {/* Organización */}
                  <div className="w-40 shrink-0">
                    <span className="truncate text-sm text-muted-light">{athlete.currentClub || "—"}</span>
                  </div>

                  {/* Acciones */}
                  <div className="w-20 shrink-0 flex items-center justify-center gap-3">
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="text-muted transition-colors hover:text-brand-500"
                      title="Ver perfil"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/athletes/${athlete.id}/edit`}
                      className="text-muted transition-colors hover:text-brand-500"
                      title="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-dark-100 bg-dark-100 px-5 py-3">
            <p className="text-xs text-muted">
              Mostrando {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} deportista{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 rounded-md border border-dark-50 px-3 py-1.5 text-xs text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Anterior
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-xs text-muted">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[30px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      safePage === p
                        ? "bg-brand-500 text-dark"
                        : "text-muted-light hover:bg-dark-50 hover:text-surface"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 rounded-md border border-dark-50 px-3 py-1.5 text-xs text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
