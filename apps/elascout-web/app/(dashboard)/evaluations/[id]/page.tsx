import type { Metadata } from "next";
import { GameFieldClient } from "./game-field-client";

export const runtime = "edge";
export const metadata: Metadata = { title: "Evaluación en Juego — ElaScout" };

export default function GameEvaluationPage({
  params,
}: {
  params: { id: string };
}) {
  return <GameFieldClient evaluationId={params.id} />;
}
