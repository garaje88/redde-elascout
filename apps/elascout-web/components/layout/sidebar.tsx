"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (active: boolean) => (
      <svg className={`h-[18px] w-[18px] ${active ? "text-emerald-400" : "text-slate-400"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: "Deportistas",
    href: "/athletes",
    icon: (active: boolean) => (
      <svg className={`h-[18px] w-[18px] ${active ? "text-emerald-400" : "text-slate-400"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Evaluaciones",
    href: "/evaluations",
    icon: (active: boolean) => (
      <svg className={`h-[18px] w-[18px] ${active ? "text-emerald-400" : "text-slate-400"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Organizaciones",
    href: "#",
    icon: (active: boolean) => (
      <svg className={`h-[18px] w-[18px] ${active ? "text-emerald-400" : "text-slate-400"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div
      className={`flex h-full flex-col transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
      style={{ backgroundColor: "#0B0F14" }}
    >
      {/* Logo area */}
      <div className={`flex items-center justify-between px-4 py-5 ${collapsed ? "flex-col gap-3 px-2" : ""}`}>
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <Image
            src="/assets/images/ElaScout-Icon.svg"
            alt="ElaScout"
            width={28}
            height={28}
            className="shrink-0 rounded-md"
          />
          {!collapsed && (
            <span className="text-base font-bold text-white tracking-tight">
              Ela Scout
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 lg:block"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <svg className={`h-[18px] w-[18px] transition-transform ${collapsed ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m16 15-3-3 3-3" />
          </svg>
        </button>
      </div>

      {/* Nav section */}
      <nav className={`mt-2 flex-1 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "font-semibold text-white"
                  : "font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
              } ${collapsed ? "justify-center px-2" : ""}`}
              style={active ? { backgroundColor: "#0F3D2E" } : undefined}
              title={collapsed ? item.label : undefined}
            >
              {item.icon(active)}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section — version badge */}
      <div className={`border-t border-white/5 p-4 ${collapsed ? "px-2" : ""}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-md px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-500">ElaScout v1.0</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 shadow-2xl shadow-black/50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
