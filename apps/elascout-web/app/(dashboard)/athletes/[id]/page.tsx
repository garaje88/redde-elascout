import { AthleteDetailPage } from "./athlete-detail-page";

export const runtime = "edge";

export function generateMetadata() {
  return { title: "Deportista — ElaScout" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <AthleteDetailPage athleteId={params.id} />;
}
