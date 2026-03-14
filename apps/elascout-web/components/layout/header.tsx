"use client";

import { UserMenu } from "./user-menu";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dark-50 bg-dark px-4 lg:px-6">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-muted hover:bg-dark-50 hover:text-surface lg:hidden"
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Spacer for desktop (sidebar takes the left space) */}
      <div className="hidden lg:block" />

      {/* Right: user menu */}
      <UserMenu />
    </header>
  );
}
