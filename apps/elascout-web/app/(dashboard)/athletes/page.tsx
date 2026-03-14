import Link from "next/link";
import { AthletesSearch } from "./athletes-search";

export const metadata = { title: "Deportistas — ElaScout" };

export default function AthletesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface">Deportistas</h1>
          <p className="mt-1 text-sm text-muted-light">
            Consulta y filtra todos los deportistas registrados en el sistema.
          </p>
        </div>
        <Link
          href="/athletes/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-dark shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo deportista
        </Link>
      </div>
      <AthletesSearch />
    </div>
  );
}
