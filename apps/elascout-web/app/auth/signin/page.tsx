"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14]">
      {/* ===== ATMOSPHERIC BACKGROUND ===== */}

      {/* Dynamic mesh gradient that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at ${mousePos.x}% ${mousePos.y}%, rgba(0, 229, 155, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(59, 130, 246, 0.06) 0%, transparent 40%)
          `
        }}
      />

      {/* Hexagonal grid pattern */}
      <div className="pointer-events-none absolute inset-0">
        <svg className="h-full w-full opacity-[0.02]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hexPattern" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path
                d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z"
                fill="none"
                stroke="#00E59B"
                strokeWidth="0.5"
              />
              <path
                d="M28 32 L56 48 L56 80 L28 96 L0 80 L0 48 Z"
                fill="none"
                stroke="#00E59B"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexPattern)" />
        </svg>
      </div>

      {/* Floating data visualization elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Animated radar rings - top left */}
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px]"
          style={{
            animation: 'radarPulse 4s ease-in-out infinite',
            animationDelay: '0s'
          }}
        >
          <svg viewBox="0 0 200 200" className="h-full w-full opacity-[0.04]">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#00E59B" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#00E59B" strokeWidth="0.2" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="#00E59B" strokeWidth="0.15" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="#00E59B" strokeWidth="0.1" />
            <line x1="100" y1="10" x2="100" y2="190" stroke="#00E59B" strokeWidth="0.1" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="#00E59B" strokeWidth="0.1" />
          </svg>
        </div>

        {/* Hexagon cluster - bottom right */}
        <div
          className="absolute -bottom-20 -right-20 h-[400px] w-[400px]"
          style={{
            animation: 'floatHex 8s ease-in-out infinite',
            animationDelay: '2s'
          }}
        >
          <svg viewBox="0 0 200 200" className="h-full w-full opacity-[0.03]">
            <polygon points="100,20 160,50 160,110 100,140 40,110 40,50" fill="none" stroke="#3B82F6" strokeWidth="0.3" />
            <polygon points="100,40 145,60 145,100 100,120 55,100 55,60" fill="none" stroke="#3B82F6" strokeWidth="0.2" />
            <polygon points="100,60 130,75 130,95 100,110 70,95 70,75" fill="none" stroke="#00E59B" strokeWidth="0.15" />
          </svg>
        </div>

        {/* Data points floating */}
        <div className="absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-brand-500/20" style={{ animation: 'dataPulse 3s ease-in-out infinite' }} />
        <div className="absolute left-[75%] top-[15%] h-1.5 w-1.5 rounded-full bg-accent-500/20" style={{ animation: 'dataPulse 2.5s ease-in-out infinite', animationDelay: '0.5s' }} />
        <div className="absolute left-[85%] top-[60%] h-2 w-2 rounded-full bg-brand-500/15" style={{ animation: 'dataPulse 3.5s ease-in-out infinite', animationDelay: '1s' }} />
        <div className="absolute left-[10%] bottom-[30%] h-1.5 w-1.5 rounded-full bg-accent-500/15" style={{ animation: 'dataPulse 4s ease-in-out infinite', animationDelay: '1.5s' }} />
      </div>

      {/* ===== LOGIN CARD ===== */}
      <div
        className={`relative z-10 mx-4 w-full max-w-[420px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Card glow */}
        <div
          className="absolute -inset-px rounded-2xl opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 229, 155, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%)'
          }}
        />

        {/* Main card */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0D1117]/90 backdrop-blur-2xl">
          {/* Top accent line */}
          <div
            className="absolute left-8 right-8 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 229, 155, 0.6) 50%, transparent 100%)'
            }}
          />

          {/* Inner ambient glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0, 229, 155, 0.1), transparent 70%)'
            }}
          />

          <div className="relative px-8 pb-10 pt-10 sm:px-10">
            {/* ===== LOGO SECTION ===== */}
            <div className="mb-12 text-center">
              {/* Animated radar logo */}
              <div className="relative mx-auto mb-6 h-20 w-20">
                {/* Outer rotating ring */}
                <svg
                  viewBox="0 0 80 80"
                  className="absolute inset-0 h-full w-full"
                  style={{ animation: 'logoRing 20s linear infinite' }}
                >
                  <circle
                    cx="40" cy="40" r="38"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                    opacity="0.4"
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E59B" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Main hexagon */}
                <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
                  {/* Hexagon outline */}
                  <polygon
                    points="40,8 68,22 68,58 40,72 12,58 12,22"
                    fill="none"
                    stroke="#00E59B"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ animation: 'hexGlow 3s ease-in-out infinite' }}
                  />

                  {/* Inner hexagon fill */}
                  <polygon
                    points="40,16 60,26 60,54 40,64 20,54 20,26"
                    fill="url(#innerGrad)"
                    opacity="0.15"
                  />

                  {/* Data nodes */}
                  <circle cx="40" cy="8" r="2" fill="#00E59B" style={{ animation: 'nodePulse 2s ease-in-out infinite' }} />
                  <circle cx="68" cy="22" r="2" fill="#00E59B" style={{ animation: 'nodePulse 2s ease-in-out infinite', animationDelay: '0.3s' }} />
                  <circle cx="68" cy="58" r="2" fill="#3B82F6" style={{ animation: 'nodePulse 2s ease-in-out infinite', animationDelay: '0.6s' }} />
                  <circle cx="40" cy="72" r="2" fill="#00E59B" style={{ animation: 'nodePulse 2s ease-in-out infinite', animationDelay: '0.9s' }} />
                  <circle cx="12" cy="58" r="2" fill="#3B82F6" style={{ animation: 'nodePulse 2s ease-in-out infinite', animationDelay: '1.2s' }} />
                  <circle cx="12" cy="22" r="2" fill="#00E59B" style={{ animation: 'nodePulse 2s ease-in-out infinite', animationDelay: '1.5s' }} />

                  {/* Center point */}
                  <circle cx="40" cy="40" r="4" fill="#00E59B" style={{ animation: 'centerPulse 2s ease-in-out infinite' }} />

                  {/* Connection lines */}
                  <line x1="40" y1="40" x2="40" y2="8" stroke="#00E59B" strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="40" x2="68" y2="22" stroke="#00E59B" strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="40" x2="68" y2="58" stroke="#3B82F6" strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="40" x2="40" y2="72" stroke="#00E59B" strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="40" x2="12" y2="58" stroke="#3B82F6" strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="40" x2="12" y2="22" stroke="#00E59B" strokeWidth="0.3" opacity="0.3" />

                  <defs>
                    <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E59B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Orbiting data point */}
                <div
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400"
                  style={{
                    boxShadow: '0 0 12px rgba(0, 229, 155, 0.6)',
                    animation: 'orbitDot 6s linear infinite'
                  }}
                />
              </div>

              {/* Wordmark */}
              <h1 className="mb-2 flex items-center justify-center gap-0.5">
                <span
                  className="text-[2.5rem] font-normal tracking-wide text-white"
                  style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif' }}
                >
                  Ela
                </span>
                <span
                  className="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-[2.5rem] font-normal tracking-wide text-transparent"
                  style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif' }}
                >
                  Scout
                </span>
              </h1>

              {/* Tagline */}
              <p
                className="text-[11px] uppercase tracking-[0.35em] text-white/35"
                style={{ fontFamily: 'var(--font-outfit), "Outfit", sans-serif' }}
              >
                Athlete Intelligence
              </p>
            </div>

            {/* ===== DIVIDER ===== */}
            <div className="relative mb-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex gap-1">
                <div className="h-1 w-1 rounded-full bg-brand-500/40" />
                <div className="h-1 w-1 rounded-full bg-accent-500/40" />
                <div className="h-1 w-1 rounded-full bg-brand-500/40" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* ===== GOOGLE SIGN IN ===== */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              className="group/btn relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 transition-all duration-300 hover:border-brand-500/30 hover:bg-white/[0.04]"
            >
              {/* Button hover effect */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 155, 0.08), transparent 70%)'
                }}
              />

              <div className="relative flex items-center justify-center gap-3">
                {/* Google icon */}
                <svg className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>

                <span
                  className="text-sm font-medium text-white/80 transition-colors duration-300 group-hover/btn:text-white"
                  style={{ fontFamily: 'var(--font-outfit), "Outfit", sans-serif' }}
                >
                  Continuar con Google
                </span>
              </div>
            </button>

            {/* ===== FOOTER ===== */}
            <p
              className="mt-8 text-center text-[10px] leading-relaxed text-white/25"
              style={{ fontFamily: 'var(--font-outfit), "Outfit", sans-serif' }}
            >
              Al continuar, aceptas los{" "}
              <a
                href="https://www.garaje88.dev/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500/60 transition-colors duration-200 hover:text-brand-400"
              >
                Términos de Servicio
              </a>
              {" "}y la{" "}
              <a
                href="https://www.garaje88.dev/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500/60 transition-colors duration-200 hover:text-brand-400"
              >
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ===== KEYFRAME ANIMATIONS ===== */}
      <style jsx>{`
        @keyframes radarPulse {
          0%, 100% { opacity: 0.02; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.05; transform: scale(1.05) rotate(5deg); }
        }

        @keyframes floatHex {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes dataPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }

        @keyframes logoRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes hexGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 229, 155, 0.3)); }
          50% { filter: drop-shadow(0 0 16px rgba(0, 229, 155, 0.5)); }
        }

        @keyframes nodePulse {
          0%, 100% { r: 2; opacity: 0.8; }
          50% { r: 3; opacity: 1; }
        }

        @keyframes centerPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(0, 229, 155, 0.5)); }
          50% { filter: drop-shadow(0 0 12px rgba(0, 229, 155, 0.8)); }
        }

        @keyframes orbitDot {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(28px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(28px) rotate(-360deg); }
        }
      `}</style>
    </main>
  );
}