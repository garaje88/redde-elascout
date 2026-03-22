import { DashboardClient } from "./dashboard-client";

export const runtime = "edge";

export const metadata = {
  title: "Dashboard — ElaScout",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
