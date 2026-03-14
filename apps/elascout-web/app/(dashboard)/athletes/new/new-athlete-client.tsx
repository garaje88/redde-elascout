"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import { apiClient } from "@/lib/api-client";
import type { AthleteCreateInput, Athlete } from "@/lib/api";

export function NewAthleteClient() {
  const router = useRouter();
  const { getFirebaseToken } = useFirebaseAuth();
  const [saving, setSaving] = useState(false);

  async function handleCreate(data: AthleteCreateInput) {
    setSaving(true);
    try {
      const token = await getFirebaseToken();
      await apiClient<Athlete>("/athletes", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push("/athletes");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-dark/80 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-dark-50 border-t-brand-500" />
          <p className="text-sm font-medium text-muted-light">Guardando deportista...</p>
        </div>
      )}
      <AthleteForm onSubmit={handleCreate} />
    </>
  );
}
