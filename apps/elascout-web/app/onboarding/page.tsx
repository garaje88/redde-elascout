import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export const runtime = "edge";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface">
            Bienvenido a <span className="text-brand-500">ElaScout</span>
          </h1>
          <p className="mt-2 text-sm text-muted-light">
            {session.user.name}, elige cómo quieres usar la plataforma
          </p>
        </div>

        <OnboardingForm />
      </div>
    </main>
  );
}
