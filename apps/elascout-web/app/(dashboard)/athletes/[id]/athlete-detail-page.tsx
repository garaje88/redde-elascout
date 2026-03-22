"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import { AthleteDetailView } from "./athlete-detail-view";
import type { Athlete } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function AthleteDetailPage({ athleteId }: { athleteId: string }) {
  const { getFirebaseToken, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;

    setLoading(true);
    getFirebaseToken().then(async (token) => {
      try {
        const res = await fetch(`${API_BASE}/athletes/${athleteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Error ${res.status}: ${body}`);
        }
        const data = await res.json();
        setAthlete(data.athlete);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el deportista.");
      } finally {
        setLoading(false);
      }
    });
  }, [athleteId, authLoading, firebaseUser, getFirebaseToken]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <p className="text-sm text-red-400">{error ?? "Deportista no encontrado."}</p>
        <Link
          href="/athletes"
          className="rounded-lg bg-dark-50 px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-dark-100"
        >
          Volver a Deportistas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/athletes"
          className="flex items-center gap-1.5 rounded-lg border border-dark-50 bg-dark-50 px-3 py-2 text-sm text-muted-light transition-colors hover:border-brand-500/40 hover:text-surface"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
        <h1 className="text-xl font-bold text-surface">Detalle del Deportista</h1>
      </div>

      <AthleteDetailView athlete={athlete} />
    </div>
  );
}
