"use client";

import { UserMenu } from "./user-menu";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/5 bg-[#0D1117] px-4 lg:px-6">
      {/* Left: hamburger (mobile only) */}
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right: user menu */}
      <UserMenu />
    </header>
  );
}
