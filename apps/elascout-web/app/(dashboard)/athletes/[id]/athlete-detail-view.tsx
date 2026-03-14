"use client";

import type { Athlete } from "@/lib/api";

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
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

interface Props {
  athlete: Athlete;
}

export function AthleteDetailView({ athlete }: Props) {
  const age = computeAge(athlete.dateOfBirth);
  const history = athlete.clubHistory ?? [];
  const titles = athlete.titles ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
      {/* ── Left column ── */}
      <div className="flex flex-col gap-5">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 220 }}>
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-dark-100 to-dark-100" />
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-500/10" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-brand-500/5" />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center">
            {/* Avatar */}
            {athlete.photoURL ? (
              <img
                src={athlete.photoURL}
                alt={`${athlete.firstName} ${athlete.lastName}`}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-500/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-2xl font-bold text-dark ring-4 ring-brand-500/30">
                {getInitials(athlete.firstName, athlete.lastName)}
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-surface">
                {athlete.firstName} {athlete.lastName}
              </h2>
              {athlete.position && (
                <p className="mt-1 text-sm font-medium text-brand-500">{athlete.position}</p>
              )}
              <p className="mt-1 text-xs text-muted-light">{athlete.nationality}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {athlete.currentClub && (
                <span className="rounded-full bg-dark-50 px-3 py-1 text-xs font-medium text-muted-light">
                  {athlete.currentClub}
                </span>
              )}
              {age !== null && (
                <span className="rounded-full bg-dark-50 px-3 py-1 text-xs font-medium text-muted-light">
                  {age} años
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Datos Personales */}
        <div className="rounded-2xl border border-dark-50 bg-dark-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface">Datos Personales</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DataField label="Fecha de Nacimiento" value={formatDate(athlete.dateOfBirth)} />
            <DataField label="Nacionalidad" value={athlete.nationality} />
            {age !== null && <DataField label="Edad" value={`${age} años`} />}
            {athlete.contactPhone && <DataField label="Contacto" value={athlete.contactPhone} />}
            {athlete.contactEmail && (
              <div className="col-span-2">
                <DataField label="Email" value={athlete.contactEmail} />
              </div>
            )}
          </div>
        </div>

        {/* Datos Profesionales */}
        <div className="rounded-2xl border border-dark-50 bg-dark-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <h3 className="text-sm font-semibold text-surface">Datos Profesionales</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {athlete.position && <DataField label="Posición" value={athlete.position} />}
            {athlete.preferredFoot && (
              <DataField label="Pie Dominante" value={FOOT_LABEL[athlete.preferredFoot] ?? athlete.preferredFoot} />
            )}
            {athlete.height && <DataField label="Estatura" value={`${athlete.height} m`} />}
            {athlete.weight && <DataField label="Peso" value={`${athlete.weight} kg`} />}
            {athlete.currentClub && <DataField label="Club Actual" value={athlete.currentClub} />}
            {athlete.contractEnd && <DataField label="Contrato" value={athlete.contractEnd} />}
            {athlete.secondaryPosition && (
              <DataField label="Posición Secundaria" value={athlete.secondaryPosition} />
            )}
          </div>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="flex flex-col gap-5">
        {/* Historial de Clubes */}
        <div className="rounded-2xl border border-dark-50 bg-dark-50 p-6">
          <div className="mb-5 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-surface">Historial de Clubes</h3>
          </div>

          {history.length === 0 ? (
            <EmptyState text="Sin historial de clubes registrado." />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-dark-100" />

              <div className="space-y-6">
                {history.map((entry, i) => {
                  const isCurrent = !entry.endYear;
                  return (
                    <div key={i} className="relative flex gap-4 pl-6">
                      {/* Dot */}
                      <div
                        className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                          isCurrent
                            ? "border-brand-500 bg-brand-500"
                            : "border-dark-100 bg-dark-50"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface">{entry.club}</p>
                        <p className={`mt-0.5 text-xs font-medium ${isCurrent ? "text-brand-500" : "text-muted"}`}>
                          {entry.startYear} – {isCurrent ? "Presente" : entry.endYear}
                        </p>
                        {entry.position && (
                          <p className="mt-0.5 text-xs text-muted-light">{entry.position}</p>
                        )}
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
          <div className="mb-5 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <h3 className="text-sm font-semibold text-surface">Títulos y Reconocimientos</h3>
          </div>

          {titles.length === 0 ? (
            <EmptyState text="Sin títulos registrados." />
          ) : (
            <div className="space-y-3">
              {titles.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-dark-100 bg-dark-100 px-4 py-3 transition-colors hover:border-brand-500/20"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-50">
                    {t.category === "individual" ? (
                      <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-light">
                      {[t.club, t.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-surface">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-4 text-center text-sm text-muted-light">{text}</p>
  );
}
