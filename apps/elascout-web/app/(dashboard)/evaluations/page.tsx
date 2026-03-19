import type { Metadata } from "next";
import { EvaluationsClient } from "./evaluations-client";

export const runtime = "edge";
export const metadata: Metadata = { title: "Evaluaciones — ElaScout" };

export default function EvaluationsPage() {
  return <EvaluationsClient />;
}
