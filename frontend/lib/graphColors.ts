// ─── Shared color management for Graph and Almanac pages ─────────────────────
// Colors are persisted to localStorage so settings page changes take effect
// immediately when the user navigates to graph / almanac.

export type GraphStatus    = "ready" | "wip" | "planned" | "new";
export type AlmanacColorKey = "character" | "technique" | "event" | "concept";

const GRAPH_KEY = "ott-graph-colors-v1";
const ALMAN_KEY = "ott-alman-colors-v1";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const GRAPH_STATUS_META: Record<GraphStatus, { label: string; defaultColor: string }> = {
  ready:   { label: "Готово",      defaultColor: "#34d399" },
  wip:     { label: "В роботі",    defaultColor: "#fbbf24" },
  planned: { label: "Заплановано", defaultColor: "#52525b" },
  new:     { label: "Нова ідея",   defaultColor: "#a78bfa" },
};

export const ALMANAC_TYPE_META: Record<AlmanacColorKey, { label: string; defaultColor: string }> = {
  character: { label: "Персонаж", defaultColor: "#8bff00" },
  technique: { label: "Техніка",  defaultColor: "#FF6B35" },
  event:     { label: "Подія",    defaultColor: "#eab308" },
  concept:   { label: "Концепт",  defaultColor: "#e879f9" },
};

// ─── Defaults (pre-computed for re-use) ───────────────────────────────────────

export const DEFAULT_GRAPH_COLORS = Object.fromEntries(
  Object.entries(GRAPH_STATUS_META).map(([k, v]) => [k, v.defaultColor])
) as Record<GraphStatus, string>;

export const DEFAULT_ALMANAC_COLORS = Object.fromEntries(
  Object.entries(ALMANAC_TYPE_META).map(([k, v]) => [k, v.defaultColor])
) as Record<AlmanacColorKey, string>;

// ─── Load / save ──────────────────────────────────────────────────────────────

export function loadGraphColors(): Record<GraphStatus, string> {
  if (typeof window === "undefined") return { ...DEFAULT_GRAPH_COLORS };
  try {
    const s = localStorage.getItem(GRAPH_KEY);
    return s ? { ...DEFAULT_GRAPH_COLORS, ...JSON.parse(s) } : { ...DEFAULT_GRAPH_COLORS };
  } catch { return { ...DEFAULT_GRAPH_COLORS }; }
}

export function saveGraphColors(c: Record<GraphStatus, string>) {
  try { localStorage.setItem(GRAPH_KEY, JSON.stringify(c)); } catch {}
}

export function loadAlmanacColors(): Record<AlmanacColorKey, string> {
  if (typeof window === "undefined") return { ...DEFAULT_ALMANAC_COLORS };
  try {
    const s = localStorage.getItem(ALMAN_KEY);
    return s ? { ...DEFAULT_ALMANAC_COLORS, ...JSON.parse(s) } : { ...DEFAULT_ALMANAC_COLORS };
  } catch { return { ...DEFAULT_ALMANAC_COLORS }; }
}

export function saveAlmanacColors(c: Record<AlmanacColorKey, string>) {
  try { localStorage.setItem(ALMAN_KEY, JSON.stringify(c)); } catch {}
}

// ─── Derive visual tokens from a hex color ────────────────────────────────────

export function mkStyle(hex: string) {
  return {
    color:  hex,
    border: hex + "55",
    glow:   hex + "25",
    bg:     hex + "0c",
  };
}

// ─── Group cloud data ──────────────────────────────────────────────────────────

export interface NodeGroup {
  id:      string;
  label:   string;
  members: string[];  // node IDs that belong to this group
  color:   string;
}

export const GRAPH_GROUPS: NodeGroup[] = [
  {
    id: "training", label: "ТРЕНУВАННЯ",
    color: "#34d399",
    members: ["auth", "plan", "exercises", "log", "today"],
  },
  {
    id: "competition", label: "ЗМАГАННЯ / АНАЛІЗ",
    color: "#fbbf24",
    members: ["tournaments", "matches", "analytics", "progress", "almanac"],
  },
  {
    id: "wellness", label: "ВІДНОВЛЕННЯ",
    color: "#60a5fa",
    members: ["recovery", "weight", "records", "mobile"],
  },
];

export const ALMANAC_GROUPS: NodeGroup[] = [
  {
    id: "chars",    label: "РУКОБОРЦІ",
    color: "#8bff00",
    members: ["brzenk","larratt","prudnik","pushkar","zhokh","mazurenko","babayev","erdi","krasimir"],
  },
  {
    id: "techs",    label: "ТЕХНІКИ",
    color: "#FF6B35",
    members: ["toproll","hookstyle","press","kingsmove","korobochka"],
  },
  {
    id: "events",   label: "ПОДІЇ",
    color: "#eab308",
    members: ["ev1952","northam","waf","supermatches","ev_lincoln","ev_nemiroff","ev_youtube"],
  },
  {
    id: "concepts", label: "КОНЦЕПТИ",
    color: "#e879f9",
    members: ["hub","recovery","training_tips","nutrition","injury_prevention","fact_physics","fact_records"],
  },
];

// ─── Compute bounding box for a group of nodes ────────────────────────────────

export function groupBBox(
  members: string[],
  nmap: Record<string, { x: number; y: number; w: number; h: number }>,
  pad = 30,
): { x: number; y: number; w: number; h: number } | null {
  const nodes = members.map(id => nmap[id]).filter(Boolean);
  if (nodes.length === 0) return null;
  const x1 = Math.min(...nodes.map(n => n.x)) - pad;
  const y1 = Math.min(...nodes.map(n => n.y)) - pad;
  const x2 = Math.max(...nodes.map(n => n.x + n.w)) + pad;
  const y2 = Math.max(...nodes.map(n => n.y + n.h)) + pad;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
