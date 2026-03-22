"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebaseAuth } from "@/lib/firebase-auth-provider";
import type { Athlete, GameFormation } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const FORMATIONS = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2", "4-1-4-1"];

type EvalMode = "match" | "individual";

interface PlayerOnField {
  athleteId: string;
  name: string;
  initials: string;
  number: number;
  position: string;
  team: "home" | "away";
  isSubstitute: boolean;
  fieldX: number;
  fieldY: number;
}

interface TeamConfig {
  name: string;
  formation: string;
  color: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ─── Soccer Field SVG with Pointer-based drag (touch + mouse) ─────────────

function SoccerFieldSVG({
  players,
  mode,
  readOnly,
  onDropFromSidebar,
  onPlayerMove,
  onRemoveFromField,
  onEvalPlayer,
}: {
  players: PlayerOnField[];
  mode: EvalMode;
  readOnly?: boolean;
  onDropFromSidebar: (x: number, y: number, athleteId: string) => void;
  onPlayerMove: (athleteId: string, x: number, y: number) => void;
  onRemoveFromField: (athleteId: string) => void;
  onEvalPlayer: (athleteId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const didDrag = useRef(false);

  // Convert client coordinates to normalized 0–1
  const toNormalized = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }, []);

  // Pointer handlers for moving players already on field (works for touch + mouse)
  const handlePointerDown = useCallback((e: React.PointerEvent, playerId: string) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(playerId);
    didDrag.current = false;
    const pos = toNormalized(e.clientX, e.clientY);
    setDragPos(pos);
  }, [toNormalized, readOnly]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId) return;
    e.preventDefault();
    didDrag.current = true;
    const pos = toNormalized(e.clientX, e.clientY);
    setDragPos(pos);
  }, [draggingId, toNormalized]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !dragPos) return;
    e.preventDefault();
    if (didDrag.current) {
      onPlayerMove(draggingId, dragPos.x, dragPos.y);
    } else {
      // Tap without drag = toggle selection (for touch devices)
      setSelectedId((prev) => prev === draggingId ? null : draggingId);
    }
    setDraggingId(null);
    setDragPos(null);
  }, [draggingId, dragPos, onPlayerMove]);

  // HTML5 drag for sidebar → field drops (desktop only)
  function handleDragOver(e: React.DragEvent<SVGSVGElement>) {
    if (readOnly) return;
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent<SVGSVGElement>) {
    if (readOnly) return;
    e.preventDefault();
    const athleteId = e.dataTransfer.getData("athleteId");
    if (athleteId) {
      const pos = toNormalized(e.clientX, e.clientY);
      onDropFromSidebar(pos.x, pos.y, athleteId);
    }
  }

  const fieldPlayers = players.filter((p) => !p.isSubstitute && p.fieldX > 0 && p.fieldY > 0);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 700 1000"
        className="h-full w-full"
        style={{ background: "transparent", touchAction: "none" }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => setSelectedId(null)}
      >
        {/* Field background stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={i * 87.5} y="0" width="87.5" height="1000"
            fill={i % 2 === 0 ? "#1a6b1a" : "#1d7a1d"} />
        ))}
        {/* Border */}
        <rect x="30" y="30" width="640" height="940" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
        {/* Center line */}
        <line x1="30" y1="500" x2="670" y2="500" stroke="white" strokeWidth="2" opacity="0.8" />
        {/* Center circle */}
        <circle cx="350" cy="500" r="80" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <circle cx="350" cy="500" r="4" fill="white" opacity="0.8" />
        {/* Penalty areas */}
        <rect x="175" y="30" width="350" height="130" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <rect x="255" y="30" width="190" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <rect x="175" y="840" width="350" height="130" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <rect x="255" y="910" width="190" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        {/* Goal areas */}
        <rect x="290" y="30" width="120" height="30" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <rect x="290" y="940" width="120" height="30" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        {/* Penalty spots */}
        <circle cx="350" cy="130" r="4" fill="white" opacity="0.8" />
        <circle cx="350" cy="870" r="4" fill="white" opacity="0.8" />
        {/* Corner arcs */}
        {([[30, 30], [670, 30], [30, 970], [670, 970]] as [number, number][]).map(([cx, cy], i) => (
          <path key={i}
            d={`M ${cx === 30 ? cx + 15 : cx - 15} ${cy} A 15 15 0 0 ${cx === 30 ? 1 : 0} ${cx} ${cy === 30 ? cy + 15 : cy - 15}`}
            fill="none" stroke="white" strokeWidth="2" opacity="0.8"
          />
        ))}

        {/* Players on field */}
        {fieldPlayers.map((p) => {
          const isDragging = draggingId === p.athleteId;
          const isSelected = selectedId === p.athleteId;
          const px = isDragging && dragPos ? dragPos.x * 700 : p.fieldX * 700;
          const py = isDragging && dragPos ? dragPos.y * 1000 : p.fieldY * 1000;
          const color = mode === "individual" ? "#3B82F6" : p.team === "home" ? "#3B82F6" : "#EF4444";
          return (
            <g
              key={p.athleteId}
              transform={`translate(${px}, ${py})`}
              opacity={isDragging ? 0.7 : 1}
            >
              {/* Touch target — larger invisible circle for easier tapping */}
              <circle r="40" fill="transparent" style={{ cursor: readOnly ? "default" : "grab" }}
                onPointerDown={(e) => handlePointerDown(e, p.athleteId)}
              />
              {/* Shadow */}
              <ellipse cx="0" cy="35" rx="22" ry="6" fill="black" opacity="0.25" />
              {/* Selected highlight ring */}
              {isSelected && (
                <circle r="34" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              )}
              {/* Player circle */}
              <circle
                r="28"
                fill={color}
                stroke={isSelected ? "#00E59B" : "white"}
                strokeWidth={isSelected ? "3" : "2.5"}
                style={{ cursor: readOnly ? "default" : isDragging ? "grabbing" : "grab", pointerEvents: "none" }}
              />
              {/* Initials */}
              <text textAnchor="middle" dy="5" fontSize="14" fontWeight="bold" fill="white" style={{ pointerEvents: "none" }}>
                {p.initials}
              </text>
              {/* Name below */}
              <text textAnchor="middle" y="48" fontSize="11" fill="white" fontWeight="600"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)", pointerEvents: "none" }}>
                {p.name.split(" ")[0]}
              </text>

              {/* Action buttons — shown on selection (works on touch tap + mouse hover) */}
              {isSelected && (
                <>
                  {/* Remove from field (X) — top-right (only when editable) */}
                  {!readOnly && (
                    <g
                      transform="translate(32, -32)"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); onRemoveFromField(p.athleteId); setSelectedId(null); }}
                    >
                      <circle r="18" fill="#EF4444" stroke="white" strokeWidth="2" />
                      <line x1="-5" y1="-5" x2="5" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="5" y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}

                  {/* View/Evaluate — top-left (always visible) */}
                  <g
                    transform={readOnly ? "translate(0, -38)" : "translate(-32, -32)"}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); onEvalPlayer(p.athleteId); }}
                  >
                    <circle r="18" fill="#00E59B" stroke="white" strokeWidth="2" />
                    <g transform="translate(-6, -7) scale(0.55)">
                      <path d="M9 2a1 1 0 00-1 1H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2a1 1 0 00-1-1H9z" fill="none" stroke="#0B0E14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 5h6M9 9h6M9 13h4" stroke="#0B0E14" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Drop hint when no players on field */}
      {fieldPlayers.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-dark/60 px-6 py-4 backdrop-blur-sm">
            <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-sm font-medium text-muted">Toca un jugador del panel y luego el campo</p>
            <p className="text-xs text-muted/70">O arrastra desde el panel lateral</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player Row (touch-friendly: always visible actions) ──────────────────

function PlayerRow({
  player,
  color,
  onEval,
  onRemove,
  onToggleSub,
  onPlaceOnField,
  isSubstitute,
  isOnField,
  readOnly,
}: {
  player: PlayerOnField;
  color: string;
  onEval: () => void;
  onRemove: () => void;
  onToggleSub: () => void;
  onPlaceOnField?: () => void;
  isSubstitute: boolean;
  isOnField: boolean;
  readOnly?: boolean;
}) {
  return (
    <div
      className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-dark-50 hover:bg-dark-100/60"
    >
      <div
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {player.initials}
        {isOnField && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-dark-50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-surface">{player.name}</p>
        <p className="truncate text-[10px] text-muted">{player.position || "Sin posicion"}</p>
      </div>
      {/* Actions — always visible for touch, opacity on desktop hover */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Place on field button (touch alternative to drag) */}
        {!readOnly && !isSubstitute && !isOnField && onPlaceOnField && (
          <button
            onClick={onPlaceOnField}
            title="Colocar en campo"
            className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
        <button
          onClick={onEval}
          title={readOnly ? "Ver evaluacion" : "Evaluar"}
          className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
        >
          {readOnly ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <StarIcon />
          )}
        </button>
        {!readOnly && (
          <>
            <button
              onClick={onToggleSub}
              title={isSubstitute ? "Mover a titulares" : "Mover a suplentes"}
              className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-amber-400 active:bg-amber-400/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </button>
            <button
              onClick={onRemove}
              title="Eliminar"
              className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-red-400 active:bg-red-400/20"
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Athlete Search ───────────────────────────────────────────────────────

function AthleteSearch({
  token,
  team,
  placeholder,
  onAdd,
}: {
  token: string;
  team: "home" | "away";
  placeholder?: string;
  onAdd: (athlete: Athlete, team: "home" | "away") => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Athlete[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/athletes?search=${encodeURIComponent(q)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as { athletes: Athlete[] };
        setResults(data.athletes ?? []);
        setOpen(true);
      } catch { setResults([]); }
    }, 350);
  }, [q, token]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder={placeholder ?? "Agregar deportista..."}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-dark-50 bg-dark-100 pl-8 pr-3 py-2.5 text-sm text-surface placeholder:text-muted focus:border-brand-500 focus:outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 max-h-52 overflow-y-auto rounded-lg border border-dark-50 bg-dark-50 py-1 shadow-xl z-30">
          {results.map((a) => (
            <button
              key={a.id}
              onClick={() => { onAdd(a, team); setQ(""); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-dark-100 active:bg-dark-100"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[11px] font-semibold text-brand-500">
                {a.firstName[0]}{a.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-surface">{a.firstName} {a.lastName}</p>
                <p className="text-[10px] text-muted">{a.position ?? "Sin posicion"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timer ───────────────────────────────────────────────────────────────

function GameTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    function update() {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const remaining = 90 * 60 - elapsed;
  const urgent = remaining < 15 * 60;

  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-mono font-semibold tabular-nums sm:px-3 sm:py-1.5 sm:text-sm ${urgent ? "bg-amber-500/20 text-amber-400" : "bg-dark-100 text-surface"}`}>
      {urgent && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

// ─── Team Panel (responsive: collapsible on tablet) ──────────────────────

function TeamPanel({
  team,
  config,
  players,
  token,
  evaluationId,
  readOnly,
  onNameChange,
  onFormationChange,
  onAdd,
  onRemove,
  onToggleSub,
  onPlaceOnField,
}: {
  team: "home" | "away";
  config: TeamConfig;
  players: PlayerOnField[];
  token: string;
  evaluationId: string;
  readOnly?: boolean;
  onNameChange: (name: string) => void;
  onFormationChange: (formation: string) => void;
  onAdd: (athlete: Athlete, team: "home" | "away") => void;
  onRemove: (athleteId: string) => void;
  onToggleSub: (athleteId: string) => void;
  onPlaceOnField: (athleteId: string) => void;
}) {
  const router = useRouter();
  const titulares = players.filter((p) => !p.isSubstitute);
  const suplentes = players.filter((p) => p.isSubstitute);
  const dotColor = team === "home" ? "bg-blue-500" : "bg-red-500";

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-dark-50 bg-dark-50 p-3 md:w-56 md:shrink-0">
      {/* Team header */}
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full shrink-0 ${dotColor}`} />
        <input
          value={config.name}
          onChange={(e) => onNameChange(e.target.value)}
          readOnly={readOnly}
          className={`flex-1 min-w-0 bg-transparent text-sm font-semibold text-surface focus:outline-none ${readOnly ? "cursor-default" : ""}`}
          placeholder={team === "home" ? "Equipo Local" : "Equipo Visitante"}
        />
        <span className="shrink-0 text-[10px] font-medium text-muted">{titulares.length}/11</span>
      </div>

      <select
        value={config.formation}
        onChange={(e) => onFormationChange(e.target.value)}
        disabled={readOnly}
        className={`rounded-lg border border-dark-50 bg-dark-100 px-2 py-1.5 text-xs text-surface focus:outline-none ${readOnly ? "opacity-60 cursor-default" : ""}`}
      >
        {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
      </select>

      {/* Players list — scrollable */}
      <div className="max-h-[200px] overflow-y-auto space-y-3 md:flex-1 md:max-h-none md:min-h-0 pr-0.5">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Titulares ({titulares.length})
          </p>
          <div className="space-y-0.5">
            {titulares.map((p) => (
              <PlayerRow
                key={p.athleteId}
                player={p}
                color={config.color}
                isSubstitute={false}
                isOnField={p.fieldX > 0 && p.fieldY > 0}
                readOnly={readOnly}
                onPlaceOnField={() => onPlaceOnField(p.athleteId)}
                onEval={() => router.push(`/evaluations/${evaluationId}/athletes/${p.athleteId}`)}
                onRemove={() => onRemove(p.athleteId)}
                onToggleSub={() => onToggleSub(p.athleteId)}
              />
            ))}
            {titulares.length === 0 && (
              <p className="px-2 text-[10px] text-muted italic">Sin titulares</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Suplentes ({suplentes.length})
          </p>
          <div className="space-y-0.5">
            {suplentes.map((p) => (
              <PlayerRow
                key={p.athleteId}
                player={p}
                color={config.color}
                isSubstitute={true}
                isOnField={false}
                readOnly={readOnly}
                onEval={() => router.push(`/evaluations/${evaluationId}/athletes/${p.athleteId}`)}
                onRemove={() => onRemove(p.athleteId)}
                onToggleSub={() => onToggleSub(p.athleteId)}
              />
            ))}
            {suplentes.length === 0 && (
              <p className="px-2 text-[10px] text-muted italic">Sin suplentes</p>
            )}
          </div>
        </div>
      </div>

      {/* Search — hidden in readOnly */}
      {!readOnly && (
        <div className="pt-1 border-t border-dark-50">
          <AthleteSearch token={token} team={team} onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}

// ─── Individual Panel ─────────────────────────────────────────────────────

function IndividualPanel({
  players,
  token,
  evaluationId,
  readOnly,
  onAdd,
  onRemove,
  onPlaceOnField,
}: {
  players: PlayerOnField[];
  token: string;
  evaluationId: string;
  readOnly?: boolean;
  onAdd: (athlete: Athlete, team: "home" | "away") => void;
  onRemove: (athleteId: string) => void;
  onPlaceOnField: (athleteId: string) => void;
}) {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-dark-50 bg-dark-50 p-3 md:w-64 md:shrink-0">
      <div>
        <p className="text-sm font-semibold text-surface">Deportistas</p>
        <p className="text-[11px] text-muted">Toca + para colocar en el campo</p>
      </div>

      <div className="max-h-[200px] overflow-y-auto space-y-0.5 md:flex-1 md:max-h-none md:min-h-0">
        {players.map((p) => (
          <div
            key={p.athleteId}
            className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-dark-50 hover:bg-dark-100/60"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
              {p.initials}
              {p.fieldX > 0 && p.fieldY > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-dark-50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-surface">{p.name}</p>
              <p className="truncate text-[10px] text-muted">{p.position || "Sin posicion"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Place on field — touch friendly */}
              {!readOnly && !(p.fieldX > 0 && p.fieldY > 0) && (
                <button
                  onClick={() => onPlaceOnField(p.athleteId)}
                  title="Colocar en campo"
                  className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => router.push(`/evaluations/${evaluationId}/athletes/${p.athleteId}`)}
                title={readOnly ? "Ver evaluacion" : "Evaluar"}
                className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-brand-500 active:bg-brand-500/20"
              >
                {readOnly ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <StarIcon />
                )}
              </button>
              {!readOnly && (
                <button
                  onClick={() => onRemove(p.athleteId)}
                  title="Eliminar"
                  className="rounded p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-red-400 active:bg-red-400/20"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted italic">
            Agrega deportistas para evaluar
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="pt-1 border-t border-dark-50">
          <AthleteSearch
            token={token}
            team="home"
            placeholder="Buscar deportista..."
            onAdd={onAdd}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function GameFieldClient({ evaluationId }: { evaluationId: string }) {
  const router = useRouter();
  const { getFirebaseToken, loading: authLoading, firebaseUser } = useFirebaseAuth();

  const [evalTitle, setEvalTitle] = useState("Evaluacion");
  const [evalStatus, setEvalStatus] = useState<string>("active");
  const [startedAt, setStartedAt] = useState(new Date().toISOString());
  const [mode, setMode] = useState<EvalMode>("match");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);

  const [homeTeam, setHomeTeam] = useState<TeamConfig>({ name: "Local", formation: "4-4-2", color: "#3B82F6" });
  const [awayTeam, setAwayTeam] = useState<TeamConfig>({ name: "Visitante", formation: "4-3-3", color: "#EF4444" });
  const [players, setPlayers] = useState<PlayerOnField[]>([]);
  const playerCount = useRef(1);
  const isInitialized = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load evaluation + formation on mount
  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    getFirebaseToken().then(async (tok) => {
      setToken(tok);
      try {
        const res = await fetch(`${API_BASE}/evaluations/${evaluationId}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (!res.ok) return;
        const data = await res.json() as {
          evaluation: {
            title: string;
            status: string;
            startedAt: string;
            formation?: GameFormation;
          };
        };
        setEvalTitle(data.evaluation.title);
        setEvalStatus(data.evaluation.status);
        setStartedAt(data.evaluation.startedAt);

        const f = data.evaluation.formation;
        if (f) {
          if (f.homeTeam) setHomeTeam({ name: f.homeTeam.name, formation: f.homeTeam.formation, color: f.homeTeam.color || "#3B82F6" });
          if (f.awayTeam) setAwayTeam({ name: f.awayTeam.name, formation: f.awayTeam.formation, color: f.awayTeam.color || "#EF4444" });
          if (f.athletes && f.athletes.length > 0) {
            const restored: PlayerOnField[] = f.athletes.map((a, i) => ({
              athleteId: a.athleteId,
              name: a.name || `Jugador ${i + 1}`,
              initials: a.initials || (a.name ? a.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : `J${i + 1}`),
              number: i + 1,
              position: a.position || "",
              team: a.team ?? "home",
              isSubstitute: a.isSubstitute ?? false,
              fieldX: a.fieldPosition?.x ?? 0,
              fieldY: a.fieldPosition?.y ?? 0,
            }));
            setPlayers(restored);
            playerCount.current = restored.length + 1;
          }
        }
      } catch { /* ignore */ } finally {
        isInitialized.current = true;
      }
    });
  }, [authLoading, firebaseUser, evaluationId, getFirebaseToken]);

  const addPlayer = useCallback((athlete: Athlete, team: "home" | "away") => {
    setPlayers((prev) => {
      if (prev.find((p) => p.athleteId === athlete.id)) return prev;
      const n = playerCount.current++;
      const teamPlayers = prev.filter((p) => p.team === team && !p.isSubstitute);
      return [
        ...prev,
        {
          athleteId: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          initials: `${athlete.firstName[0]}${athlete.lastName[0]}`,
          number: n,
          position: athlete.position ?? "",
          team,
          isSubstitute: teamPlayers.length >= 11,
          fieldX: 0,
          fieldY: 0,
        },
      ];
    });
  }, []);

  // Place player on field at auto-calculated position (touch alternative to drag)
  const placeOnField = useCallback((athleteId: string) => {
    setPlayers((prev) => {
      const onField = prev.filter((p) => p.fieldX > 0 && p.fieldY > 0);
      // Place in a grid pattern, avoiding overlap
      const col = onField.length % 4;
      const row = Math.floor(onField.length / 4);
      const x = 0.2 + col * 0.2;
      const y = 0.2 + row * 0.15;
      return prev.map((p) =>
        p.athleteId === athleteId
          ? { ...p, fieldX: Math.min(x, 0.9), fieldY: Math.min(y, 0.85), isSubstitute: false }
          : p
      );
    });
  }, []);

  function dropOnField(x: number, y: number, athleteId: string) {
    setPlayers((prev) =>
      prev.map((p) => p.athleteId === athleteId ? { ...p, fieldX: x, fieldY: y, isSubstitute: false } : p)
    );
  }

  const movePlayerOnField = useCallback((athleteId: string, x: number, y: number) => {
    setPlayers((prev) =>
      prev.map((p) => p.athleteId === athleteId ? { ...p, fieldX: x, fieldY: y } : p)
    );
  }, []);

  function removePlayer(athleteId: string) {
    setPlayers((prev) => prev.filter((p) => p.athleteId !== athleteId));
  }

  function removeFromField(athleteId: string) {
    setPlayers((prev) =>
      prev.map((p) => p.athleteId === athleteId ? { ...p, fieldX: 0, fieldY: 0 } : p)
    );
  }

  function toggleSubstitute(athleteId: string) {
    setPlayers((prev) =>
      prev.map((p) => p.athleteId === athleteId
        ? { ...p, isSubstitute: !p.isSubstitute, fieldX: p.isSubstitute ? p.fieldX : 0, fieldY: p.isSubstitute ? p.fieldY : 0 }
        : p)
    );
  }

  const saveFormation = useCallback(async (
    currentPlayers: PlayerOnField[],
    currentHome: TeamConfig,
    currentAway: TeamConfig,
  ) => {
    if (!token) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const formation: GameFormation = {
        homeTeam: { name: currentHome.name, formation: currentHome.formation, color: currentHome.color },
        awayTeam: { name: currentAway.name, formation: currentAway.formation, color: currentAway.color },
        athletes: currentPlayers.map((p) => ({
          athleteId: p.athleteId,
          name: p.name,
          initials: p.initials,
          position: p.position,
          team: p.team,
          isSubstitute: p.isSubstitute,
          fieldPosition: { x: p.fieldX, y: p.fieldY },
        })),
      };
      await fetch(`${API_BASE}/evaluations/${evaluationId}/formation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formation),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }, [token, evaluationId]);

  const isReadOnly = evalStatus === "completed" || evalStatus === "expired";

  // Auto-save with 1.5s debounce after any change (disabled in readOnly)
  useEffect(() => {
    if (!isInitialized.current || !token || isReadOnly) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveFormation(players, homeTeam, awayTeam);
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [players, homeTeam, awayTeam, token, saveFormation, isReadOnly]);

  async function finishEvaluation() {
    if (!token) return;
    clearTimeout(autoSaveTimer.current);
    await saveFormation(players, homeTeam, awayTeam);
    await fetch(`${API_BASE}/evaluations/${evaluationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "completed" }),
    });
    router.push("/evaluations");
  }

  const homePlayers = players.filter((p) => p.team === "home");
  const awayPlayers = players.filter((p) => p.team === "away");

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-0">
      {/* Top bar — responsive */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-dark-50 pb-3 md:mb-4 md:gap-4 md:pb-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/evaluations" className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-dark-50 hover:text-surface">
            <BackIcon />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-surface sm:text-sm">{evalTitle}</p>
            {isReadOnly && (
              <p className="text-[10px] text-muted">Solo lectura ({evalStatus === "completed" ? "completada" : "expirada"})</p>
            )}
          </div>
          {!isReadOnly && <GameTimer startedAt={startedAt} />}
          {isReadOnly && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs ${evalStatus === "completed" ? "bg-dark-100 text-muted" : "bg-red-500/20 text-red-400"}`}>
              {evalStatus === "completed" ? "Completada" : "Expirada"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center rounded-lg border border-dark-50 bg-dark-100 p-0.5">
            <button
              onClick={() => setMode("match")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${mode === "match" ? "bg-dark-50 text-surface shadow-sm" : "text-muted hover:text-surface"}`}
            >
              Partido
            </button>
            <button
              onClick={() => setMode("individual")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${mode === "individual" ? "bg-dark-50 text-surface shadow-sm" : "text-muted hover:text-surface"}`}
            >
              Individual
            </button>
          </div>

          {/* Toggle panel visibility on tablet */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="rounded-lg border border-dark-50 bg-dark-100 p-1.5 text-muted transition-colors hover:text-surface md:hidden"
            title={panelOpen ? "Ocultar paneles" : "Mostrar paneles"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {!isReadOnly && (
            <>
              <div className="hidden items-center gap-1.5 text-xs sm:flex">
                {saving ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-brand-500" />
                    <span className="text-muted">Guardando...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-brand-500 font-medium">Guardado</span>
                  </>
                ) : (
                  <span className="text-muted/60 text-[11px]">Auto-guardado</span>
                )}
              </div>
              <button
                onClick={finishEvaluation}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-dark transition-opacity hover:opacity-90 sm:px-3 sm:py-2 sm:text-sm"
              >
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main layout — vertical on mobile/tablet, horizontal on desktop */}
      <div className="flex flex-1 flex-col gap-3 min-h-0 md:flex-row">
        {mode === "match" ? (
          <>
            {/* Panels — shown below field on mobile, side on desktop */}
            {panelOpen && (
              <div className="order-2 flex gap-3 overflow-x-auto pb-2 md:order-none md:flex-col md:overflow-x-visible md:pb-0">
                <TeamPanel
                  team="home"
                  config={homeTeam}
                  players={homePlayers}
                  token={token}
                  evaluationId={evaluationId}
                  readOnly={isReadOnly}
                  onNameChange={(name) => setHomeTeam((t) => ({ ...t, name }))}
                  onFormationChange={(formation) => setHomeTeam((t) => ({ ...t, formation }))}
                  onAdd={addPlayer}
                  onRemove={removePlayer}
                  onToggleSub={toggleSubstitute}
                  onPlaceOnField={placeOnField}
                />
              </div>
            )}

            {/* Field */}
            <div className="order-1 flex flex-1 flex-col rounded-xl overflow-hidden border border-dark-50 min-h-[300px] md:order-none md:min-h-0">
              <SoccerFieldSVG
                players={players}
                mode={mode}
                readOnly={isReadOnly}
                onDropFromSidebar={dropOnField}
                onPlayerMove={movePlayerOnField}
                onRemoveFromField={removeFromField}
                onEvalPlayer={(athleteId) => router.push(`/evaluations/${evaluationId}/athletes/${athleteId}`)}
              />
            </div>

            {/* Away team — separate panel on desktop, inline on mobile */}
            {panelOpen && (
              <div className="order-3 flex gap-3 overflow-x-auto pb-2 md:order-none md:flex-col md:overflow-x-visible md:pb-0">
                <TeamPanel
                  team="away"
                  config={awayTeam}
                  players={awayPlayers}
                  token={token}
                  evaluationId={evaluationId}
                  readOnly={isReadOnly}
                  onNameChange={(name) => setAwayTeam((t) => ({ ...t, name }))}
                  onFormationChange={(formation) => setAwayTeam((t) => ({ ...t, formation }))}
                  onAdd={addPlayer}
                  onRemove={removePlayer}
                  onToggleSub={toggleSubstitute}
                  onPlaceOnField={placeOnField}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Individual panel */}
            {panelOpen && (
              <div className="order-2 md:order-none">
                <IndividualPanel
                  players={players}
                  token={token}
                  evaluationId={evaluationId}
                  readOnly={isReadOnly}
                  onAdd={addPlayer}
                  onRemove={removePlayer}
                  onPlaceOnField={placeOnField}
                />
              </div>
            )}

            {/* Field */}
            <div className="order-1 flex flex-1 flex-col rounded-xl overflow-hidden border border-dark-50 min-h-[300px] md:order-none md:min-h-0">
              <SoccerFieldSVG
                players={players}
                mode={mode}
                readOnly={isReadOnly}
                onDropFromSidebar={dropOnField}
                onPlayerMove={movePlayerOnField}
                onRemoveFromField={removeFromField}
                onEvalPlayer={(athleteId) => router.push(`/evaluations/${evaluationId}/athletes/${athleteId}`)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
