"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AthleteCreateInput, ClubHistoryEntry, TitleEntry, RepresentativeInfo } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIONS = [
  "Portero",
  "Defensa Central",
  "Lateral Derecho",
  "Lateral Izquierdo",
  "Mediocentro Defensivo",
  "Mediocentro",
  "Mediocentro Ofensivo",
  "Extremo Derecho",
  "Extremo Izquierdo",
  "Segundo Delantero",
  "Delantero Centro",
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala",
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "Portugal", "República Dominicana", "Uruguay", "Venezuela",
  "Alemania", "Francia", "Inglaterra", "Italia", "Países Bajos",
  "Bélgica", "Croacia", "Ghana", "Costa de Marfil", "Nigeria", "Senegal",
  "Marruecos", "Japón", "Corea del Sur", "Australia",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactEmail?: string;
  contactPhone?: string;
  height?: string;
  weight?: string;
}

function validate(data: Partial<AthleteCreateInput>): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName?.trim()) errors.firstName = "El nombre es obligatorio";
  if (!data.lastName?.trim()) errors.lastName = "El apellido es obligatorio";
  if (!data.dateOfBirth) errors.dateOfBirth = "La fecha de nacimiento es obligatoria";
  if (!data.nationality?.trim()) errors.nationality = "La nacionalidad es obligatoria";
  if (!data.contactEmail?.trim()) {
    errors.contactEmail = "El email es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = "Email no válido";
  }
  if (!data.contactPhone?.trim()) errors.contactPhone = "El teléfono es obligatorio";
  if (data.height !== undefined && data.height !== null) {
    const h = Number(data.height);
    if (isNaN(h) || h < 100 || h > 250) errors.height = "Estatura entre 100 y 250 cm";
  }
  if (data.weight !== undefined && data.weight !== null) {
    const w = Number(data.weight);
    if (isNaN(w) || w < 30 || w > 200) errors.weight = "Peso entre 30 y 200 kg";
  }
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dark-50 bg-dark-50 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-brand-500">{icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-surface">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-surface">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface",
          "transition-colors duration-150 appearance-none",
          "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          !value ? "text-muted" : "",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "",
        ].join(" ")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Club History ─────────────────────────────────────────────────────────────

const EMPTY_CLUB: ClubHistoryEntry = { club: "", startYear: CURRENT_YEAR, endYear: undefined, position: "" };

function ClubHistorySection({
  entries,
  onChange,
}: {
  entries: ClubHistoryEntry[];
  onChange: (entries: ClubHistoryEntry[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ClubHistoryEntry>(EMPTY_CLUB);

  function openAdd() {
    setDraft(EMPTY_CLUB);
    setEditIndex(null);
    setShowForm(true);
  }

  function openEdit(idx: number) {
    setDraft({ ...entries[idx]! });
    setEditIndex(idx);
    setShowForm(true);
  }

  function remove(idx: number) {
    onChange(entries.filter((_, i) => i !== idx));
  }

  function save() {
    if (!draft.club.trim()) return;
    if (editIndex !== null) {
      const updated = [...entries];
      updated[editIndex] = draft;
      onChange(updated);
    } else {
      onChange([...entries, draft]);
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg border border-dark-50 bg-dark-100 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface">{entry.club}</p>
              <p className="text-xs text-muted">
                {entry.startYear} – {entry.endYear ?? "Presente"}
                {entry.position ? ` · ${entry.position}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEdit(idx)}
              className="rounded-md p-1.5 text-muted hover:bg-dark-50 hover:text-surface transition-colors"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="rounded-md p-1.5 text-muted hover:bg-dark-50 hover:text-red-400 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="rounded-lg border border-brand-500/30 bg-dark-100 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {editIndex !== null ? "Editar club" : "Agregar club"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Club"
              placeholder="Ej. FC Barcelona"
              value={draft.club}
              onChange={(e) => setDraft((d) => ({ ...d, club: e.target.value }))}
            />
            <Input
              label="Posición"
              placeholder="Ej. Centrocampista"
              value={draft.position ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
            />
            <SelectField
              label="Año de inicio"
              value={draft.startYear.toString()}
              onChange={(v) => setDraft((d) => ({ ...d, startYear: Number(v) }))}
              options={YEARS.map(String)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-surface">Año de fin</label>
              <select
                value={draft.endYear?.toString() ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    endYear: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 appearance-none"
              >
                <option value="">Presente</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={!draft.club.trim()}>
              {editIndex !== null ? "Guardar cambios" : "Agregar"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dark-50 py-3 text-sm text-muted hover:border-brand-500/50 hover:text-brand-500 transition-colors"
        >
          <PlusIcon />
          Agregar Club
        </button>
      )}
    </div>
  );
}

// ─── Titles ───────────────────────────────────────────────────────────────────

const EMPTY_TITLE: TitleEntry = { title: "", year: CURRENT_YEAR, club: "", category: "" };

function TitlesSection({
  entries,
  onChange,
}: {
  entries: TitleEntry[];
  onChange: (entries: TitleEntry[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<TitleEntry>(EMPTY_TITLE);

  function openAdd() {
    setDraft(EMPTY_TITLE);
    setEditIndex(null);
    setShowForm(true);
  }

  function openEdit(idx: number) {
    setDraft({ ...entries[idx]! });
    setEditIndex(idx);
    setShowForm(true);
  }

  function remove(idx: number) {
    onChange(entries.filter((_, i) => i !== idx));
  }

  function save() {
    if (!draft.title.trim()) return;
    if (editIndex !== null) {
      const updated = [...entries];
      updated[editIndex] = draft;
      onChange(updated);
    } else {
      onChange([...entries, draft]);
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-dark-50 bg-dark-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <TrophyIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface">{entry.title}</p>
                  <p className="text-xs text-muted">
                    {entry.year}
                    {entry.club ? ` · ${entry.club}` : ""}
                    {entry.category ? ` · ${entry.category}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(idx)}
                  className="rounded-md p-1.5 text-muted hover:bg-dark-50 hover:text-surface transition-colors"
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="rounded-md p-1.5 text-muted hover:bg-dark-50 hover:text-red-400 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-lg border border-brand-500/30 bg-dark-100 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {editIndex !== null ? "Editar título" : "Agregar título"}
          </p>
          <div className="grid gap-4">
            <Input
              label="Título / Premio"
              placeholder="Ej. Copa del Rey 2022"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Año"
                value={draft.year.toString()}
                onChange={(v) => setDraft((d) => ({ ...d, year: Number(v) }))}
                options={YEARS.map(String)}
              />
              <Input
                label="Club (opcional)"
                placeholder="Ej. Club Ejemplo FC"
                value={draft.club ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, club: e.target.value }))}
              />
              <Input
                label="Categoría (opcional)"
                placeholder="Ej. Selección Nacional"
                value={draft.category ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={!draft.title.trim()}>
              {editIndex !== null ? "Guardar cambios" : "Agregar"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dark-50 py-3 text-sm text-muted hover:border-brand-500/50 hover:text-brand-500 transition-colors"
        >
          <PlusIcon />
          Agregar Título
        </button>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface AthleteFormProps {
  initialData?: Partial<AthleteCreateInput>;
  onSubmit: (data: AthleteCreateInput) => Promise<void>;
}

export function AthleteForm({ initialData, onSubmit }: AthleteFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<AthleteCreateInput>>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    contactEmail: "",
    contactPhone: "",
    position: "",
    preferredFoot: undefined,
    height: undefined,
    weight: undefined,
    currentClub: "",
    contractEnd: "",
    clubHistory: [],
    titles: [],
    representative: undefined,
    ...initialData,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof AthleteCreateInput>(field: K, value: AthleteCreateInput[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function updateRepresentative(field: keyof RepresentativeInfo, value: string) {
    setFormData((prev) => ({
      ...prev,
      representative: {
        name: prev.representative?.name ?? "",
        ...prev.representative,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.keys(validationErrors)[0];
      document.getElementById(firstError ?? "")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const rep = formData.representative;
      const payload: AthleteCreateInput = {
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        dateOfBirth: formData.dateOfBirth!,
        nationality: formData.nationality!,
        contactEmail: formData.contactEmail!,
        contactPhone: formData.contactPhone!,
        position: formData.position || undefined,
        preferredFoot: formData.preferredFoot || undefined,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        currentClub: formData.currentClub || undefined,
        contractEnd: formData.contractEnd || undefined,
        clubHistory: formData.clubHistory?.length ? formData.clubHistory : undefined,
        titles: formData.titles?.length ? formData.titles : undefined,
        representative: rep?.name?.trim()
          ? {
              name: rep.name.trim(),
              ...(rep.email?.trim() && { email: rep.email.trim() }),
              ...(rep.phone?.trim() && { phone: rep.phone.trim() }),
              ...(rep.agency?.trim() && { agency: rep.agency.trim() }),
            }
          : undefined,
      };
      await onSubmit(payload);
    } catch {
      // Error handling delegado al padre
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page header with breadcrumb + title + actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href="/athletes" className="hover:text-surface transition-colors">
            Deportistas
          </Link>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-muted-light">
            {initialData ? "Editar deportista" : "Nuevo Deportista"}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface">
              {initialData ? "Editar deportista" : "Nuevo Deportista"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {initialData
                ? "Actualiza la información del deportista."
                : "Completa la información para registrar un nuevo deportista."}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/athletes")}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? "Guardando..." : initialData ? "Guardar cambios" : "Guardar Deportista"}
            </Button>
          </div>
        </div>
      </div>

      {/* M1 — Información Personal */}
      <SectionCard
        icon={<UserIcon />}
        title="Información Personal"
        description="Datos básicos de identificación del deportista"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="firstName"
            label="Nombre *"
            placeholder="Ej. Juan Carlos"
            value={formData.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            id="lastName"
            label="Apellido *"
            placeholder="Ej. Martínez López"
            value={formData.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dateOfBirth" className="text-sm font-medium text-surface">
              Fecha de Nacimiento *
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={[
                "w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface",
                "transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
                errors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "",
              ].join(" ")}
            />
            {errors.dateOfBirth && <p className="text-xs text-red-400">{errors.dateOfBirth}</p>}
          </div>
          <SelectField
            label="Nacionalidad *"
            value={formData.nationality ?? ""}
            onChange={(v) => update("nationality", v)}
            options={COUNTRIES}
            placeholder="Seleccionar país"
            error={errors.nationality}
          />
          <Input
            id="contactEmail"
            label="Email *"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <Input
            id="contactPhone"
            label="Teléfono *"
            type="tel"
            placeholder="+34 600 000 000"
            value={formData.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            error={errors.contactPhone}
          />
        </div>
      </SectionCard>

      {/* Representante */}
      <SectionCard
        icon={<AgentIcon />}
        title="Representante"
        description="Datos de contacto del agente o representante del deportista (opcional)"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nombre del representante"
              placeholder="Ej. Jorge Mendes"
              value={formData.representative?.name ?? ""}
              onChange={(e) => updateRepresentative("name", e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="representante@agencia.com"
            value={formData.representative?.email ?? ""}
            onChange={(e) => updateRepresentative("email", e.target.value)}
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="+34 600 000 000"
            value={formData.representative?.phone ?? ""}
            onChange={(e) => updateRepresentative("phone", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label="Agencia / Empresa"
              placeholder="Ej. Gestifute"
              value={formData.representative?.agency ?? ""}
              onChange={(e) => updateRepresentative("agency", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* M2 — Información Profesional */}
      <SectionCard
        icon={<BriefcaseIcon />}
        title="Información Profesional"
        description="Datos deportivos y contractuales"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Posición"
            value={formData.position ?? ""}
            onChange={(v) => update("position", v)}
            options={POSITIONS}
            placeholder="Seleccionar posición"
          />
          <SelectField
            label="Pie Dominante"
            value={formData.preferredFoot ?? ""}
            onChange={(v) => update("preferredFoot", v as "left" | "right" | "both")}
            options={["Derecho", "Izquierdo", "Ambos"]}
            placeholder="Seleccionar"
          />
          <Input
            label="Estatura (cm)"
            type="number"
            placeholder="Ej. 178"
            value={formData.height?.toString() ?? ""}
            onChange={(e) => update("height", e.target.value ? Number(e.target.value) : undefined)}
            error={errors.height}
            min={100}
            max={250}
          />
          <Input
            label="Peso (kg)"
            type="number"
            placeholder="Ej. 75"
            value={formData.weight?.toString() ?? ""}
            onChange={(e) => update("weight", e.target.value ? Number(e.target.value) : undefined)}
            error={errors.weight}
            min={30}
            max={200}
          />
          <Input
            label="Club Actual"
            placeholder="Ej. FC Barcelona"
            value={formData.currentClub}
            onChange={(e) => update("currentClub", e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface">Fin de Contrato</label>
            <input
              type="date"
              value={formData.contractEnd ?? ""}
              onChange={(e) => update("contractEnd", e.target.value)}
              className="w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>
      </SectionCard>

      {/* M3 — Historial Deportivo */}
      <SectionCard
        icon={<HistoryIcon />}
        title="Historial Deportivo"
        description="Registro cronológico de clubes anteriores del deportista"
      >
        <ClubHistorySection
          entries={formData.clubHistory ?? []}
          onChange={(entries) => update("clubHistory", entries)}
        />
      </SectionCard>

      {/* M4 — Títulos y Reconocimientos */}
      <SectionCard
        icon={<TrophyIcon />}
        title="Títulos y Reconocimientos"
        description="Logros y premios obtenidos a lo largo de su carrera"
      >
        <TitlesSection
          entries={formData.titles ?? []}
          onChange={(entries) => update("titles", entries)}
        />
      </SectionCard>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/athletes")}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? "Guardando..." : initialData ? "Guardar cambios" : "Guardar Deportista"}
        </Button>
      </div>
    </form>
  );
}
