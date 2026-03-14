"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AthleteCreateInput } from "@/lib/api";

interface AthleteFormProps {
  initialData?: Partial<AthleteCreateInput>;
  onSubmit: (data: AthleteCreateInput) => Promise<void>;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactEmail?: string;
}

function validate(data: Partial<AthleteCreateInput>): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName?.trim()) errors.firstName = "El nombre es obligatorio";
  if (!data.lastName?.trim()) errors.lastName = "El apellido es obligatorio";
  if (!data.dateOfBirth) errors.dateOfBirth = "La fecha de nacimiento es obligatoria";
  if (!data.nationality?.trim()) errors.nationality = "La nacionalidad es obligatoria";
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = "Email no válido";
  }
  return errors;
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
    ...initialData,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof AthleteCreateInput, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData as AthleteCreateInput);
    } catch {
      // Error handling delegado al padre
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="mb-4 text-base font-semibold text-surface">Información personal</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Nombre *"
            placeholder="Ej. Lionel"
            value={formData.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Apellido *"
            placeholder="Ej. Messi"
            value={formData.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
          />
          <Input
            label="Fecha de nacimiento *"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            error={errors.dateOfBirth}
          />
          <Input
            label="Nacionalidad *"
            placeholder="Ej. Argentina"
            value={formData.nationality}
            onChange={(e) => update("nationality", e.target.value)}
            error={errors.nationality}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-surface">
          Contacto
          <span className="ml-2 text-xs font-normal text-muted">(opcional)</span>
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            placeholder="deportista@email.com"
            value={formData.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="+54 11 1234 5678"
            value={formData.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-dark-50 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push("/athletes")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? "Guardar cambios" : "Crear deportista"}
        </Button>
      </div>
    </form>
  );
}
