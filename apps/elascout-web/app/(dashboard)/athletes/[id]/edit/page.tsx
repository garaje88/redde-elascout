import { EditAthletePage } from "./edit-athlete-page";

export const runtime = "edge";

export function generateMetadata() {
  return { title: "Editar Deportista — ElaScout" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <EditAthletePage athleteId={params.id} />;
}
