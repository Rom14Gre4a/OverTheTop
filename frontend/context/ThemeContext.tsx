"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/theme";

// ── Accent colors ─────────────────────────────────────────────────────────────

export const DEFAULT_ACCENT_COLORS: Record<ThemeMode, string> = {
  red:    "#FF1744",
  lime:   "#8bff00",
  yellow: "#eab308",
};

const VALID_MODES: ThemeMode[] = ["red", "lime", "yellow"];

// ── Font scale ────────────────────────────────────────────────────────────────

export type FontPreset = "compact" | "normal" | "large" | "xl";

export interface FontSizes {
  display: number;  // --fz-display  hero numbers, icons
  heading: number;  // --fz-h1       page headings
  title:   number;  // --fz-h2       section / card titles
  body:    number;  // --fz-body     body text
  small:   number;  // --fz-sm       secondary text
  label:   number;  // --fz-xs       labels, badges
  micro:   number;  // --fz-micro    tiny captions
}

export const FONT_PRESET_LABELS: Record<FontPreset, string> = {
  compact: "Компакт",
  normal:  "Нормально",
  large:   "Великий",
  xl:      "Дуже великий",
};

export const FONT_PRESETS: Record<FontPreset, FontSizes> = {
  compact: { display: 32, heading: 22, title: 16, body: 13, small: 11, label: 10, micro:  9 },
  normal:  { display: 36, heading: 26, title: 19, body: 15, small: 13, label: 11, micro: 10 },
  large:   { display: 40, heading: 28, title: 21, body: 16, small: 14, label: 12, micro: 11 },
  xl:      { display: 48, heading: 34, title: 25, body: 19, small: 16, label: 14, micro: 12 },
};

function applyFontSizes(sizes: FontSizes) {
  const r = document.documentElement;
  r.style.setProperty("--fz-display", sizes.display + "px");
  r.style.setProperty("--fz-h1",      sizes.heading + "px");
  r.style.setProperty("--fz-h2",      sizes.title   + "px");
  r.style.setProperty("--fz-body",    sizes.body    + "px");
  r.style.setProperty("--fz-sm",      sizes.small   + "px");
  r.style.setProperty("--fz-xs",      sizes.label   + "px");
  r.style.setProperty("--fz-micro",   sizes.micro   + "px");
}

function loadFontSizes(): { preset: FontPreset; sizes: FontSizes } {
  try {
    const raw    = localStorage.getItem("ott-font-preset");
    const preset = (raw && raw in FONT_PRESETS ? raw : "large") as FontPreset;
    const base   = FONT_PRESETS[preset];
    const custom: Partial<FontSizes> = JSON.parse(localStorage.getItem("ott-font-custom") ?? "{}");
    return { preset, sizes: { ...base, ...custom } };
  } catch {
    return { preset: "large", sizes: FONT_PRESETS.large };
  }
}

// ── Context interface ─────────────────────────────────────────────────────────

interface ThemeContextValue {
  // Color
  theme:       ThemeMode;
  setTheme:    (mode: ThemeMode) => void;
  accent:      string;
  accentColors: Record<ThemeMode, string>;
  setModeColor: (mode: ThemeMode, color: string) => void;
  // Font
  fontPreset:    FontPreset;
  fontSizes:     FontSizes;
  setFontPreset: (preset: FontPreset) => void;
  setFontSize:   (key: keyof FontSizes, value: number) => void;
  resetFontSizes: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "lime", setTheme: () => {}, accent: DEFAULT_ACCENT_COLORS.lime,
  accentColors: DEFAULT_ACCENT_COLORS, setModeColor: () => {},
  fontPreset: "large", fontSizes: FONT_PRESETS.large,
  setFontPreset: () => {}, setFontSize: () => {}, resetFontSizes: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,        setThemeState]  = useState<ThemeMode>("lime");
  const [accentColors, setAccentColors] = useState<Record<ThemeMode, string>>(DEFAULT_ACCENT_COLORS);
  const [fontPreset,   setFontPresetState] = useState<FontPreset>("large");
  const [fontSizes,    setFontSizesState]  = useState<FontSizes>(FONT_PRESETS.large);

  useEffect(() => {
    // Color
    const savedMode = localStorage.getItem("ott-theme") as ThemeMode | null;
    const savedColors: Record<ThemeMode, string> = (() => {
      try {
        const s = localStorage.getItem("ott-theme-colors");
        return s ? { ...DEFAULT_ACCENT_COLORS, ...JSON.parse(s) } : DEFAULT_ACCENT_COLORS;
      } catch { return DEFAULT_ACCENT_COLORS; }
    })();
    const initialMode = savedMode && VALID_MODES.includes(savedMode) ? savedMode : "lime";
    setThemeState(initialMode);
    setAccentColors(savedColors);
    applyTheme(initialMode, savedColors);

    // Font
    const { preset, sizes } = loadFontSizes();
    setFontPresetState(preset);
    setFontSizesState(sizes);
    applyFontSizes(sizes);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("ott-theme", mode);
    applyTheme(mode, accentColors);
  };

  const setModeColor = (mode: ThemeMode, color: string) => {
    const next = { ...accentColors, [mode]: color };
    setAccentColors(next);
    try { localStorage.setItem("ott-theme-colors", JSON.stringify(next)); } catch {}
    if (mode === theme) applyTheme(theme, next);
  };

  const setFontPreset = (preset: FontPreset) => {
    const sizes = FONT_PRESETS[preset];
    setFontPresetState(preset);
    setFontSizesState(sizes);
    localStorage.setItem("ott-font-preset", preset);
    localStorage.removeItem("ott-font-custom");
    applyFontSizes(sizes);
  };

  const setFontSize = (key: keyof FontSizes, value: number) => {
    const next = { ...fontSizes, [key]: value };
    setFontSizesState(next);
    // Compute which preset this matches, or mark as custom
    const matchedPreset = (Object.keys(FONT_PRESETS) as FontPreset[]).find(p =>
      (Object.keys(FONT_PRESETS[p]) as (keyof FontSizes)[]).every(k => FONT_PRESETS[p][k] === next[k])
    );
    if (matchedPreset) {
      setFontPresetState(matchedPreset);
      localStorage.setItem("ott-font-preset", matchedPreset);
      localStorage.removeItem("ott-font-custom");
    } else {
      localStorage.setItem("ott-font-custom", JSON.stringify(next));
    }
    applyFontSizes(next);
  };

  const resetFontSizes = () => setFontPreset("large");

  const accent = accentColors[theme] ?? DEFAULT_ACCENT_COLORS[theme];

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, accent, accentColors, setModeColor,
      fontPreset, fontSizes, setFontPreset, setFontSize, resetFontSizes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function applyTheme(mode: ThemeMode, colors: Record<ThemeMode, string>) {
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  if (mode !== "lime") root.setAttribute("data-theme", mode);
  const c = colors[mode];
  if (!c || !/^#[0-9a-fA-F]{6}$/.test(c)) return;
  const [r, g, b] = hexToRgb(c);
  root.style.setProperty("--accent",         c);
  root.style.setProperty("--accent-light",   c);
  root.style.setProperty("--accent-dim",     `rgba(${r},${g},${b},0.12)`);
  root.style.setProperty("--accent-glow",    `rgba(${r},${g},${b},0.30)`);
  root.style.setProperty("--accent-glow-sm", `rgba(${r},${g},${b},0.15)`);
}

export const useTheme = () => useContext(ThemeContext);
