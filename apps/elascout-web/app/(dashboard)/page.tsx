import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const stats = [
    { label: "Deportistas", value: "0", href: "/athletes" },
    { label: "Evaluaciones", value: "0", href: "#" },
    { label: "Este mes", value: "0", href: "#" },
    { label: "Pendientes", value: "0", href: "#" },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-light">
          Bienvenido, {session.user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-dark-50 bg-dark-100 p-6 transition-all hover:border-brand-500/30 hover:bg-dark-50"
          >
            <p className="text-sm font-medium text-muted-light">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-surface group-hover:text-brand-500 transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
