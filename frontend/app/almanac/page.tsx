"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TierListBoard } from "@/components/TierListBoard";
import {
  ALMANAC_NODES, ALMANAC_EDGES,
  AlmanacNode, AlmanacType,
} from "@/lib/almanac";
import {
  loadAlmanacColors, mkStyle,
  ALMANAC_GROUPS, groupBBox,
  type AlmanacColorKey,
} from "@/lib/graphColors";
import { useTheme } from "@/context/ThemeContext";

type MainTab = "graph" | "tierlist";

const GW = 1640; // дорівнює --app-max
const GH = 1050;
const POS_KEY = "almanac-pos-v2";

// ─── Dynamic TYPE_STYLE from saved colors ──────────────────────────────────────
const TYPE_LABELS: Record<AlmanacType, string> = {
  character: "Персонаж", technique: "Техніка", event: "Подія", concept: "Концепт",
};
function buildTypeStyle(colors: Record<AlmanacColorKey, string>) {
  return Object.fromEntries(
    (Object.entries(colors) as [AlmanacColorKey, string][]).map(([k, hex]) => [
      k, { ...mkStyle(hex), label: TYPE_LABELS[k as AlmanacType] },
    ])
  ) as Record<AlmanacType, { color: string; border: string; glow: string; bg: string; label: string }>;
}

// ─── 3D tilt helpers ───────────────────────────────────────────────────────────
function apply3D(el: HTMLElement, e: React.MouseEvent) {
  const rect = el.getBoundingClientRect();
  const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
  const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
  el.style.transform = `perspective(420px) rotateX(${-dy * 9}deg) rotateY(${dx * 9}deg) scale(1.08)`;
  el.style.transition = "box-shadow 0.1s, background 0.1s, border-color 0.1s";
}
function reset3D(el: HTMLElement) {
  el.style.transform = "";
  el.style.transition = "all 0.18s ease";
}

function nc(n: AlmanacNode & { x: number; y: number }) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function total(r: NonNullable<AlmanacNode["character"]>["rating"]) {
  return Math.round((r.raw_power + r.technique + r.consistency + r.speed + r.longevity + r.titles + r.peak) / 70 * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  const color = value >= 9 ? accent : value >= 7 ? "#4ade80" : value >= 5 ? "#60a5fa" : "#71717a";
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: "#888", fontSize: "var(--fz-xs)" }}>{label}</span>
        <span style={{ color, fontSize: "var(--fz-xs)", fontWeight: 700 }}>{value}/10</span>
      </div>
      <div style={{ height: 3, background: "#1c1c1c", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${(value / 10) * 100}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function DiffBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 4 ? "#FF6B35" : value >= 3 ? "#fbbf24" : "#4ade80";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: "#888", fontSize: "var(--fz-xs)", width: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: "#1c1c1c", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ color, fontSize: "var(--fz-xs)", fontWeight: 700, width: 24, textAlign: "right" }}>{value}/{max}</span>
    </div>
  );
}

function StatRow({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>
      <span style={{ color: "#666", fontSize: "var(--fz-sm)" }}>{label}</span>
      <span style={{ color: "#e5e5e5", fontSize: "var(--fz-sm)", fontWeight: 600 }}>{value} {unit}</span>
    </div>
  );
}

type TS = Record<AlmanacType, { color: string; border: string; glow: string; bg: string; label: string }>;

function DetailPanel({ node, onClose, allNodes, accent, typeStyle }: {
  node: AlmanacNode; onClose: () => void; allNodes: AlmanacNode[]; accent: string;
  typeStyle: TS;
}) {
  const s = typeStyle[node.type];
  const nodeById = Object.fromEntries(allNodes.map(n => [n.id, n]));

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
      width: 360, background: "#0c0c0c",
      borderLeft: `1px solid ${s.border}`,
      boxShadow: `-20px 0 60px rgba(0,0,0,0.7)`,
      overflowY: "auto", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "20px 20px 14px",
        borderBottom: "1px solid #191919",
        background: s.bg,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: "var(--fz-xs)", color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                {s.label}
              </span>
              {node.character && <span style={{ fontSize: "var(--fz-body)" }}>{node.character.flag}</span>}
            </div>
            <h2 style={{ color: "#fff", fontSize: "var(--fz-h2)", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{node.title}</h2>
            {node.subtitle && <p style={{ color: "#555", fontSize: "var(--fz-sm)", margin: "4px 0 0" }}>{node.subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#444",
            fontSize: "var(--fz-h2)", cursor: "pointer", padding: 4, flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >✕</button>
        </div>
        <p style={{ color: "#666", fontSize: "var(--fz-sm)", margin: "10px 0 0", lineHeight: 1.5 }}>{node.summary}</p>
      </div>

      <div style={{ padding: "16px 20px", flex: 1 }}>
        {node.character && (() => {
          const c = node.character!;
          const score = total(c.rating);
          const scoreColor = score >= 85 ? accent : score >= 70 ? "#4ade80" : "#60a5fa";
          return (
            <>
              <p style={{ color: "#999", fontSize: "var(--fz-sm)", lineHeight: 1.6, margin: "0 0 16px" }}>{c.bio}</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Антропометрія</div>
                <StatRow label="Зріст"          value={c.anthropometry.height}       unit="см" />
                <StatRow label="Вага"            value={c.anthropometry.weight}       unit="кг" />
                <StatRow label="Розмах рук"      value={c.anthropometry.reach}        unit="см" />
                <StatRow label="Довж. передпліч" value={c.anthropometry.forearm_len}  unit="см" />
                <StatRow label="Обхв. біцепса"   value={c.anthropometry.bicep_circ}   unit="см" />
                <StatRow label="Обхв. передпліч" value={c.anthropometry.forearm_circ} unit="см" />
                <StatRow label="Обхв. зап'ястя"  value={c.anthropometry.wrist_circ}   unit="см" />
                <StatRow label="Розмах кисті"    value={c.anthropometry.hand_span}    unit="см" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Силові показники (приблизно)</div>
                <StatRow label="Хват (динамометр)" value={c.strength.grip}  unit="кг" />
                <StatRow label="Тяга за столом"    value={c.strength.pull}  unit="кг" />
                <StatRow label="Жим лежачи"        value={c.strength.bench} unit="кг" />
                <StatRow label="Згинання руки"     value={c.strength.curl}  unit="кг" />
                {c.strength.note && <p style={{ color: "#444", fontSize: "var(--fz-xs)", fontStyle: "italic", margin: "6px 0 0" }}>* {c.strength.note}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Таблиця крутості</div>
                <RatingBar label="Сира сила"    value={c.rating.raw_power}   accent={accent} />
                <RatingBar label="Техніка"       value={c.rating.technique}   accent={accent} />
                <RatingBar label="Стабільність"  value={c.rating.consistency} accent={accent} />
                <RatingBar label="Швидкість"     value={c.rating.speed}       accent={accent} />
                <RatingBar label="Довголіття"    value={c.rating.longevity}   accent={accent} />
                <RatingBar label="Титули"        value={c.rating.titles}      accent={accent} />
                <RatingBar label="Пікова форма"  value={c.rating.peak}        accent={accent} />
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#111", border: `1px solid ${scoreColor}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#888", fontSize: "var(--fz-sm)" }}>Загальний бал</span>
                  <span style={{ color: scoreColor, fontSize: "var(--fz-h2)", fontWeight: 800 }}>{score}/100</span>
                </div>
              </div>
              <div>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Титули ({c.world_titles} чемп. світу)</div>
                {c.titles.map((t, i) => (
                  <div key={i} style={{ color: "#666", fontSize: "var(--fz-xs)", padding: "3px 0", display: "flex", gap: 6 }}>
                    <span style={{ color: accent }}>◆</span> {t}
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        {node.technique && (() => {
          const t = node.technique!;
          return (
            <>
              <p style={{ color: "#999", fontSize: "var(--fz-sm)", lineHeight: 1.6, margin: "0 0 16px" }}>{t.description}</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Складність та вимоги</div>
                <DiffBar label="Складність"        value={t.difficulty}    />
                <DiffBar label="Вимоги до сили"    value={t.power_req}     />
                <DiffBar label="Вимоги до техніки" value={t.technique_req} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>М&apos;язи</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {t.muscles.map(m => (
                    <span key={m} style={{ fontSize: "var(--fz-xs)", color: "#FF6B35", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", padding: "2px 8px", borderRadius: 6 }}>{m}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Ключові точки</div>
                {t.key_points.map((kp, i) => (
                  <div key={i} style={{ color: "#888", fontSize: "var(--fz-sm)", padding: "3px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "#FF6B35", flexShrink: 0 }}>{i + 1}.</span> {kp}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Використовують</div>
                {t.practitioners.map(id => {
                  const ch = nodeById[id];
                  return ch ? <div key={id} style={{ color: "#8bff00", fontSize: "var(--fz-sm)", padding: "3px 0" }}>{ch.character?.flag} {ch.title}</div> : null;
                })}
              </div>
            </>
          );
        })()}

        {node.event && (() => {
          const ev = node.event!;
          const catColor = ev.category === "supermatch" ? "#e879f9" : ev.category === "history" ? "#4ade80" : ev.category === "media" ? "#FF6B35" : "#60a5fa";
          const catLabel = { supermatch:"Суперматч", history:"Історія", media:"Медіа", competition:"Змагання" }[ev.category];
          return (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: "var(--fz-xs)", color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30`, padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>{catLabel}</span>
                <span style={{ fontSize: "var(--fz-xs)", color: "#666" }}>{ev.year} р.</span>
                {ev.location && <span style={{ fontSize: "var(--fz-xs)", color: "#555" }}>📍 {ev.location}</span>}
              </div>
              <p style={{ color: "#999", fontSize: "var(--fz-sm)", lineHeight: 1.6, margin: "0 0 14px" }}>{ev.description}</p>
              {ev.outcome && (
                <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Результат</div>
                  <p style={{ color: "#e5e5e5", fontSize: "var(--fz-sm)", margin: 0 }}>{ev.outcome}</p>
                </div>
              )}
              <div style={{ background: `${catColor}08`, border: `1px solid ${catColor}20`, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Значення</div>
                <p style={{ color: "#bbb", fontSize: "var(--fz-sm)", margin: 0 }}>{ev.significance}</p>
              </div>
              {ev.participants && ev.participants.length > 0 && (
                <div>
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Учасники</div>
                  {ev.participants.map(id => {
                    const ch = nodeById[id];
                    return ch ? <div key={id} style={{ color: "#8bff00", fontSize: "var(--fz-sm)", padding: "3px 0" }}>{ch.character?.flag} {ch.title}</div> : null;
                  })}
                </div>
              )}
            </>
          );
        })()}

        {node.concept && (
          <>
            <p style={{ color: "#999", fontSize: "var(--fz-sm)", lineHeight: 1.6, margin: "0 0 14px" }}>{node.concept.description}</p>
            {node.concept.traits.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Характеристики</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {node.concept.traits.map(t => (
                    <span key={t} style={{ fontSize: "var(--fz-xs)", color: "#e879f9", background: "rgba(232,121,249,0.08)", border: "1px solid rgba(232,121,249,0.2)", padding: "2px 8px", borderRadius: 6 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            {node.concept.members.length > 0 && (
              <div>
                <div style={{ color: "#555", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Представники</div>
                {node.concept.members.map(id => {
                  const m = nodeById[id];
                  return m ? <div key={id} style={{ color: "#e879f9", fontSize: "var(--fz-sm)", padding: "3px 0" }}>{m.character?.flag} {m.title}</div> : null;
                })}
              </div>
            )}
          </>
        )}

        {node.tags.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #191919" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {node.tags.map(t => (
                <span key={t} style={{ fontSize: "var(--fz-xs)", color: "#444", background: "#111", border: "1px solid #222", padding: "2px 7px", borderRadius: 4 }}>#{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Type filters ─────────────────────────────────────────────────────────────

const TYPE_FILTERS: { id: AlmanacType | "all"; label: string }[] = [
  { id: "all",       label: "Всі" },
  { id: "character", label: "👤 Персонажі" },
  { id: "technique", label: "🔄 Техніки" },
  { id: "event",     label: "📅 Події" },
  { id: "concept",   label: "💡 Концепти" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

type PosMap = Record<string, { x: number; y: number }>;

function loadPositions(): PosMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(POS_KEY) ?? "{}"); } catch { return {}; }
}

function savePositions(pos: PosMap) {
  try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
}

export default function AlmanacPage() {
  const { accent } = useTheme();
  const [mainTab,    setMainTab]    = useState<MainTab>("graph");
  const [selected,   setSelected]   = useState<AlmanacNode | null>(null);
  const [hovered,    setHovered]    = useState<string | null>(null);
  const [filter,     setFilter]     = useState<AlmanacType | "all">("all");
  const [showGroups, setShowGroups] = useState(true);

  // Dynamic colors from settings
  const [almanacColors] = useState(loadAlmanacColors);
  const typeStyle = useMemo(() => buildTypeStyle(almanacColors), [almanacColors]);

  // Drag state
  const [posOverrides, setPosOverrides] = useState<PosMap>(loadPositions);
  const dragRef = useRef<{
    id: string; startMX: number; startMY: number;
    origX: number; origY: number; moved: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Merge static positions with overrides
  const displayNodes = useMemo(() =>
    ALMANAC_NODES.map(n => {
      const ov = posOverrides[n.id];
      return ov ? { ...n, x: ov.x, y: ov.y } : n;
    }),
    [posOverrides]
  );

  const nmap = useMemo(() =>
    Object.fromEntries(displayNodes.map(n => [n.id, n])),
    [displayNodes]
  );

  const visibleIds = useMemo(() => new Set(
    filter === "all"
      ? ALMANAC_NODES.map(n => n.id)
      : ALMANAC_NODES.filter(n => n.type === filter || n.id === "hub").map(n => n.id)
  ), [filter]);

  const connSet = hovered
    ? new Set(ALMANAC_EDGES.filter(e => e.from === hovered || e.to === hovered).flatMap(e => [e.from, e.to]))
    : null;

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const node = displayNodes.find(n => n.id === nodeId)!;
    dragRef.current = {
      id: nodeId, moved: false,
      startMX: e.clientX, startMY: e.clientY,
      origX: node.x, origY: node.y,
    };
    setDraggingId(nodeId);
  }, [displayNodes]);

  const onContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const dx = e.clientX - d.startMX;
    const dy = e.clientY - d.startMY;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true;
    setPosOverrides(prev => ({
      ...prev,
      [d.id]: { x: Math.max(0, d.origX + dx), y: Math.max(0, d.origY + dy) },
    }));
  }, []);

  const onContainerMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    if (dragRef.current.moved) {
      setPosOverrides(prev => { savePositions(prev); return prev; });
    }
    dragRef.current = null;
    setDraggingId(null);
  }, []);

  const onNodeClick = useCallback((n: AlmanacNode) => {
    if (dragRef.current?.moved) return;
    setSelected(prev => prev?.id === n.id ? null : n);
  }, []);

  const resetPositions = useCallback(() => {
    setPosOverrides({});
    savePositions({});
  }, []);

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />

      <main
        className="flex-1 overflow-auto"
        style={{ background: "#080808", position: "relative" }}
        onMouseMove={onContainerMouseMove}
        onMouseUp={onContainerMouseUp}
        onMouseLeave={onContainerMouseUp}
      >
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "linear-gradient(to bottom, rgba(8,8,8,0.97) 80%, transparent)",
          padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <h1 style={{ color: "#fff", fontSize: "var(--fz-body)", fontWeight: 700, margin: 0 }}>📖 Альманах</h1>
          <div style={{ width: 1, height: 20, background: "#222" }} />

          <div style={{ display: "flex", gap: 4 }}>
            {([
              { id: "graph",    label: "🕸 Граф" },
              { id: "tierlist", label: "🏅 Тір-лісти" },
            ] as { id: MainTab; label: string }[]).map(tab => {
              const active = mainTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setMainTab(tab.id); setSelected(null); }}
                  style={{
                    padding: "5px 14px", borderRadius: 8, fontSize: "var(--fz-sm)", cursor: "pointer",
                    border: `1px solid ${active ? accent + "55" : "#222"}`,
                    background: active ? accent + "12" : "transparent",
                    color: active ? accent : "#555",
                    fontWeight: active ? 600 : 400, transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {mainTab === "graph" && (
            <>
              <div style={{ width: 1, height: 20, background: "#222" }} />
              <div style={{ display: "flex", gap: 6 }}>
                {TYPE_FILTERS.map(f => {
                  const active = filter === f.id;
                  const typeColor = f.id === "all" ? "#888" : typeStyle[f.id as AlmanacType].color;
                  return (
                    <button key={f.id} onClick={() => setFilter(f.id as AlmanacType | "all")}
                      style={{
                        padding: "4px 12px", borderRadius: 8,
                        border: `1px solid ${active ? typeColor + "55" : "#222"}`,
                        background: active ? typeColor + "10" : "transparent",
                        color: active ? typeColor : "#555",
                        fontSize: "var(--fz-sm)", cursor: "pointer", fontWeight: active ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
                {/* Legend */}
                {(Object.entries(typeStyle) as [AlmanacType, (typeof typeStyle)[AlmanacType]][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: v.color, boxShadow: `0 0 5px ${v.color}80` }} />
                    <span style={{ color: "#555", fontSize: "var(--fz-xs)" }}>{v.label}</span>
                  </div>
                ))}
                <div style={{ width: 1, height: 16, background: "#222" }} />
                {/* Groups toggle */}
                <button
                  onClick={() => setShowGroups(v => !v)}
                  style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: "var(--fz-xs)", cursor: "pointer",
                    border: `1px solid ${showGroups ? "#ffffff30" : "#333"}`,
                    background: showGroups ? "rgba(255,255,255,0.06)" : "transparent",
                    color: showGroups ? "#aaa" : "#444",
                    transition: "all 0.15s",
                  }}
                >⬡ Групи</button>
                {/* Reset button */}
                <button
                  onClick={resetPositions}
                  style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: "var(--fz-xs)", cursor: "pointer",
                    border: "1px solid #333", background: "transparent", color: "#555",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#555"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#333"; }}
                  title="Скинути позиції вузлів"
                >
                  ↺ Скинути розташування
                </button>
              </div>
            </>
          )}
        </div>

        {mainTab === "tierlist" && (
          <div style={{ paddingTop: 16 }}>
            <TierListBoard />
          </div>
        )}

        {mainTab === "graph" && (
          <div style={{
            position: "relative",
            width: GW, height: GH,
            margin: "0 auto",
            cursor: draggingId ? "grabbing" : "default",
            userSelect: draggingId ? "none" : "auto",
          }}>

            {/* SVG edges + groups */}
            <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }} width={GW} height={GH}>
              <defs>
                <filter id="ag" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ── Group cloud borders ── */}
              {showGroups && ALMANAC_GROUPS.map(group => {
                const visMembers = group.members.filter(id => visibleIds.has(id));
                const bbox = groupBBox(visMembers, nmap, 26);
                if (!bbox) return null;
                return (
                  <g key={group.id}>
                    <rect x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h}
                      rx={24} ry={24} fill={group.color + "07"} />
                    <rect x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h}
                      rx={24} ry={24} fill="none"
                      stroke={group.color} strokeWidth={1}
                      strokeOpacity={0.25} strokeDasharray="9 7" />
                    <text x={bbox.x + 16} y={bbox.y + 15}
                      fill={group.color} fillOpacity={0.42}
                      fontSize={9} fontWeight={700}
                      fontFamily="system-ui,-apple-system,sans-serif"
                      letterSpacing={1.8}
                    >
                      {group.label}
                    </text>
                  </g>
                );
              })}

              {ALMANAC_EDGES.map((e, i) => {
                const fn = nmap[e.from]; const tn = nmap[e.to];
                if (!fn || !tn) return null;
                if (!visibleIds.has(fn.id) || !visibleIds.has(tn.id)) return null;
                const f = nc(fn); const t = nc(tn);
                const active = !!(hovered && (e.from === hovered || e.to === hovered));
                const mx = (f.x + t.x) / 2 + (t.y - f.y) * 0.06;
                const my = (f.y + t.y) / 2 + (f.x - t.x) * 0.06;
                const srcType = fn.id === "hub" ? "concept" : fn.type;
                const edgeColor = active
                  ? typeStyle[srcType as AlmanacType].color
                  : e.dash ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.13)";

                return (
                  <path key={i}
                    d={`M ${f.x} ${f.y} Q ${mx} ${my} ${t.x} ${t.y}`}
                    fill="none" stroke={edgeColor}
                    strokeWidth={active ? 1.8 : 1}
                    strokeDasharray={e.dash ? "5 8" : undefined}
                    filter={active ? "url(#ag)" : undefined}
                    style={{ transition: "stroke 0.15s" }}
                  />
                );
              })}

              {displayNodes.filter(n => visibleIds.has(n.id)).map(n => {
                const c = nc(n);
                const s = typeStyle[n.id === "hub" ? "concept" : n.type as AlmanacType];
                const isH = hovered === n.id;
                return (
                  <circle key={n.id + "-d"} cx={c.x} cy={c.y} r={isH ? 5 : 2.5}
                    fill={s.color} opacity={isH ? 1 : 0.35}
                    style={{ transition: "all 0.15s", pointerEvents: "none" }}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {displayNodes.map(n => {
              if (!visibleIds.has(n.id)) return null;
              const typeKey = n.id === "hub" ? "concept" : n.type;
              const s = typeStyle[typeKey as AlmanacType];
              const isH = hovered === n.id;
              const isSel = selected?.id === n.id;
              const isC = connSet ? connSet.has(n.id) : false;
              const dim = !!(hovered && !isH && !isC);
              const isHub = n.id === "hub";
              const isDragging = draggingId === n.id;

              return (
                <div
                  key={n.id}
                  onMouseEnter={() => !draggingId && setHovered(n.id)}
                  onMouseMove={e => { if (!draggingId && !isSel) apply3D(e.currentTarget, e); }}
                  onMouseLeave={e => {
                    reset3D(e.currentTarget);
                    !draggingId && setHovered(null);
                  }}
                  onMouseDown={e => onNodeMouseDown(e, n.id)}
                  onClick={() => onNodeClick(n)}
                  style={{
                    position: "absolute",
                    left: n.x, top: n.y, width: n.w, height: n.h,
                    borderRadius: isHub ? 18 : 12,
                    border: isSel
                      ? `1px solid ${s.color}`
                      : isDragging ? `1px solid ${s.color}99` : `1px solid ${s.border}`,
                    background: isSel
                      ? s.bg.replace("0c", "18")
                      : isDragging ? s.bg.replace("0c", "20")
                      : isH ? s.bg.replace("0c", "14") : s.bg,
                    boxShadow: isSel
                      ? `0 0 30px ${s.glow}, 0 0 0 1px ${s.border}`
                      : isDragging ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${s.glow}`
                      : isH ? `0 0 20px ${s.glow}` : `0 0 8px ${s.glow}`,
                    cursor: isDragging ? "grabbing" : "grab",
                    opacity: dim ? 0.13 : 1,
                    transform: isDragging ? "scale(1.08)" : "",
                    transition: isDragging ? "box-shadow 0.1s, transform 0.1s" : "all 0.18s ease",
                    padding: "9px 12px",
                    display: "flex",
                    flexDirection: isHub ? "row" : "column",
                    alignItems: isHub ? "center" : "flex-start",
                    gap: isHub ? 10 : 3,
                    zIndex: isDragging ? 50 : isSel ? 30 : isH ? 20 : 1,
                    userSelect: "none",
                  }}
                >
                  {isHub ? (
                    <>
                      <span style={{ fontSize: "var(--fz-h1)" }}>📖</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: "var(--fz-body)" }}>{n.title}</div>
                        <div style={{ color: s.color, fontSize: "var(--fz-xs)", fontWeight: 600 }}>{n.subtitle}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ color: dim ? "#333" : "#e5e5e5", fontWeight: 600, fontSize: "var(--fz-xs)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                        {n.character?.flag && <span style={{ marginRight: 4 }}>{n.character.flag}</span>}
                        {n.title}
                      </div>
                      <div style={{ color: isH ? "#777" : s.color, fontSize: "var(--fz-xs)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                        {isH ? n.summary.slice(0, 55) + (n.summary.length > 55 ? "…" : "") : n.subtitle || typeStyle[n.type].label}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <DetailPanel
          node={selected}
          onClose={() => setSelected(null)}
          allNodes={ALMANAC_NODES}
          accent={accent}
          typeStyle={typeStyle}
        />
      )}
    </div>
  );
}
