"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) return null;

  const { name, email, image } = session.user;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/5"
      >
        {image ? (
          <Image
            src={image}
            alt={name ?? ""}
            width={30}
            height={30}
            className="rounded-full ring-2 ring-emerald-500/20"
          />
        ) : (
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            {name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
        )}
        <span className="hidden text-sm font-medium text-slate-200 md:block">
          {name}
        </span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#161B22] shadow-xl shadow-black/40">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{email}</p>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
