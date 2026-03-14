import { notFound } from "next/navigation";
import { getAthlete } from "@/lib/api";
import { EditAthleteClient } from "./edit-athlete-client";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const athlete = await getAthlete(params.id);
    return { title: `Editar ${athlete.firstName} ${athlete.lastName} — ElaScout` };
  } catch {
    return { title: "Editar Deportista — ElaScout" };
  }
}

export default async function EditAthletePage({ params }: { params: { id: string } }) {
  let athlete;
  try {
    athlete = await getAthlete(params.id);
  } catch {
    notFound();
  }

  return <EditAthleteClient athlete={athlete} />;
}
