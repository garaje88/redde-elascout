"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Athlete, AthleteCreateInput } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface Props {
  athlete: Athlete;
}

export function EditAthleteClient({ athlete }: Props) {
  const router = useRouter();
  const { getFirebaseToken } = useFirebaseAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(data: AthleteCreateInput) {
    setSaving(true);
    setError(null);
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`${API_BASE}/athletes/${athlete.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Error ${res.status}: ${body}`);
      }

      router.push(`/athletes/${athlete.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-surface">Guardando cambios...</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <AthleteForm
        initialData={{
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          dateOfBirth: athlete.dateOfBirth,
          nationality: athlete.nationality,
          contactEmail: athlete.contactEmail,
          contactPhone: athlete.contactPhone,
          position: athlete.position,
          preferredFoot: athlete.preferredFoot,
          height: athlete.height,
          weight: athlete.weight,
          currentClub: athlete.currentClub,
          contractEnd: athlete.contractEnd,
          clubHistory: athlete.clubHistory ?? [],
          titles: athlete.titles ?? [],
        }}
        onSubmit={handleUpdate}
      />
    </>
  );
}
