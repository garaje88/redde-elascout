import type { Metadata } from "next";
import { AthleteEvalDetailClient } from "./athlete-eval-detail-client";

export const runtime = "edge";
export const metadata: Metadata = { title: "Evaluación del Deportista — ElaScout" };

export default function AthleteEvalPage({
  params,
}: {
  params: { id: string; athleteId: string };
}) {
  return (
    <AthleteEvalDetailClient
      evaluationId={params.id}
      athleteId={params.athleteId}
    />
  );
}
