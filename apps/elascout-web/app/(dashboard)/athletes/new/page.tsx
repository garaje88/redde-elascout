import Link from "next/link";
import { NewAthleteClient } from "./new-athlete-client";

export const metadata = {
  title: "Nuevo deportista — ElaScout",
};

export default function NewAthletePage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/athletes" className="hover:text-surface transition-colors">
          Deportistas
        </Link>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-muted-light">Nuevo deportista</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface">Nuevo deportista</h1>
        <p className="mt-1 text-sm text-muted-light">
          Completa la información para registrar un nuevo deportista.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-dark-50 bg-dark-50 p-6 sm:p-8">
        <NewAthleteClient />
      </div>
    </div>
  );
}
