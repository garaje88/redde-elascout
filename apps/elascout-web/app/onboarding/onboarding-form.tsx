"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "individual";

export default function OnboardingForm() {
  const [mode, setMode] = useState<Mode | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (!mode) return;
    router.push("/athletes");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Individual — habilitado */}
        <button
          type="button"
          onClick={() => setMode("individual")}
          className={`rounded-xl border-2 p-6 text-center transition-all ${
            mode === "individual"
              ? "border-brand-500 bg-brand-500/10"
              : "border-dark-50 bg-dark-100 hover:border-dark-50/80"
          }`}
        >
          <div className="text-2xl">👤</div>
          <div className="mt-2 text-sm font-medium text-surface">
            Individual
          </div>
          <div className="mt-1 text-xs text-muted-light">
            Gestiona tus deportistas de forma personal
          </div>
        </button>

        {/* Organización — deshabilitado */}
        <div className="relative cursor-not-allowed opacity-40">
          <div className="pointer-events-none rounded-xl border-2 border-dark-50 bg-dark-100 p-6 text-center">
            <div className="text-2xl">🏢</div>
            <div className="mt-2 text-sm font-medium text-surface">
              Organización
            </div>
            <div className="mt-1 text-xs text-muted-light">
              Trabaja con un equipo dentro de un club
            </div>
          </div>
          <span className="absolute right-2 top-2 rounded-full bg-dark-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-light">
            Próximamente
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!mode}
        className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-dark shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        Continuar
      </button>
    </div>
  );
}
