import { ReportsClient } from "./reports-client";

export const runtime = "edge";

export const metadata = {
  title: "Reportes — ElaScout",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
