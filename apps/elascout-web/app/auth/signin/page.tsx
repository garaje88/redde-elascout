"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image via CSS — compatible con Cloudflare Pages */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/images/background.png')" }}
      />

      {/* Vignette / gradient overlay on all edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.85) 100%)",
            "linear-gradient(to bottom, rgba(10,10,10,0.9) 0%, transparent 25%, transparent 75%, rgba(10,10,10,0.95) 100%)",
            "linear-gradient(to right, rgba(10,10,10,0.7) 0%, transparent 20%, transparent 80%, rgba(10,10,10,0.7) 100%)",
          ].join(", "),
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm space-y-8 rounded-2xl border border-white/10 bg-dark/70 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
        <div>
          <Image
            src="/assets/images/ElaScout-Logo-Dark.svg"
            alt="ElaScout"
            width={220}
            height={50}
            className="mx-auto"
            priority
            unoptimized
          />
          <h1 className="mt-4 text-2xl font-bold text-surface">
            Bienvenido a <span className="text-brand-500">ElaScout</span>
          </h1>
          <p className="mt-2 text-sm text-muted-light">
            Inicia sesión para continuar
          </p>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-dark-50 bg-dark-100/80 px-4 py-3.5 text-sm font-medium text-surface transition-all hover:border-brand-500/50 hover:bg-dark-50 hover:shadow-lg hover:shadow-brand-500/10"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar con Google
        </button>

        <p className="text-xs text-muted">
          Al continuar, aceptas los{" "}
          <a href="https://www.garaje88.dev/terms" target="_blank" className="text-brand-500 hover:underline">
            términos de servicio
          </a>{" "}
          y la{" "}
          <a href="https://www.garaje88.dev/privacy" target="_blank" className="text-brand-500 hover:underline">
            política de privacidad
          </a>.
        </p>
      </div>
    </main>
  );
}
