import Link from "next/link";
import { notFound } from "next/navigation";
import { getAthlete } from "@/lib/api";
import { AthleteDetailView } from "./athlete-detail-view";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  try {
    const athlete = await getAthlete(params.id);
    return { title: `${athlete.firstName} ${athlete.lastName} — ElaScout` };
  } catch {
    return { title: "Deportista — ElaScout" };
  }
}

export default async function AthleteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let athlete;
  try {
    athlete = await getAthlete(params.id);
  } catch {
    notFound();
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
