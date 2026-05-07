"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { useTheme, FONT_PRESETS, FONT_PRESET_LABELS, type FontPreset, type FontSizes } from "@/context/ThemeContext";
import { THEMES, type ThemeMode } from "@/lib/theme";
import { fetchSettings, pushSettings } from "@/lib/settingsApi";
import {
  GRAPH_STATUS_META, ALMANAC_TYPE_META,
  type GraphStatus, type AlmanacColorKey,
  loadGraphColors, saveGraphColors,
  loadAlmanacColors, saveAlmanacColors,
} from "@/lib/graphColors";

// ─── Static tokens ─────────────────────────────────────────────────────────────
const B   = "#050505";
const PAN = "#0f1214";
const FR  = "#1e2226";
const MU  = "#52565a";
const TX  = "#e8eaec";

function sp(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: PAN,
    border: `1px solid ${FR}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.5)",
    clipPath: "polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)",
    ...extra,
  };
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router  = useRouter();
  const { theme, setTheme, accent, accentColors, setModeColor,
          fontPreset, fontSizes, setFontPreset, setFontSize, resetFontSizes } = useTheme();
  const [fontAdvanced, setFontAdvanced] = useState(false);

  const [ready,   setReady]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [wallpaper, setWallpaperState] = useState("");

  // Graph / Almanac colors
  const [graphColors,   setGraphColorsState]   = useState<Record<GraphStatus, string>>(loadGraphColors);
  const [almanacColors, setAlmanacColorsState] = useState<Record<AlmanacColorKey, string>>(loadAlmanacColors);

  const setGraphColor = (k: GraphStatus, hex: string) => {
    const next = { ...graphColors, [k]: hex };
    setGraphColorsState(next);
    saveGraphColors(next);
  };

  const resetGraphColors = () => {
    const next = Object.fromEntries(
      Object.entries(GRAPH_STATUS_META).map(([k, v]) => [k, v.defaultColor])
    ) as Record<GraphStatus, string>;
    setGraphColorsState(next);
    saveGraphColors(next);
  };

  const setAlmanacColor = (k: AlmanacColorKey, hex: string) => {
    const next = { ...almanacColors, [k]: hex };
    setAlmanacColorsState(next);
    saveAlmanacColors(next);
  };

  const resetAlmanacColors = () => {
    const next = Object.fromEntries(
      Object.entries(ALMANAC_TYPE_META).map(([k, v]) => [k, v.defaultColor])
    ) as Record<AlmanacColorKey, string>;
    setAlmanacColorsState(next);
    saveAlmanacColors(next);
  };

  const fileRef = useRef<HTMLInputElement>(null);

  // Auth guard + load wallpaper from localStorage
  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setWallpaperState(localStorage.getItem("ott-wallpaper") ?? "");
    setReady(true);
  }, [router]);

  // Sync settings from server on mount
  useEffect(() => {
    if (!ready) return;
    fetchSettings().then(s => {
      if (!s) return;
      if (s.wallpaperUrl) {
        setWallpaperState(s.wallpaperUrl);
        localStorage.setItem("ott-wallpaper", s.wallpaperUrl);
      }
      if (s.themeMode && ["red","lime","yellow"].includes(s.themeMode))
        setTheme(s.themeMode as ThemeMode);
      if (s.accentColorsJson) {
        try {
          const colors = JSON.parse(s.accentColorsJson) as Record<ThemeMode, string>;
          (Object.keys(colors) as ThemeMode[]).forEach(m => setModeColor(m, colors[m]));
        } catch {}
      }
    });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      setWallpaperState(b64);
      localStorage.setItem("ott-wallpaper", b64);
    };
    reader.readAsDataURL(file);
  };

  const clearWallpaper = () => {
    setWallpaperState("");
    localStorage.removeItem("ott-wallpaper");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await pushSettings({
      themeMode: theme,
      accentColorsJson: JSON.stringify(accentColors),
      wallpaperUrl: wallpaper || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: B }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 36px", maxWidth: "var(--app-max)" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
            КОНФІГУРАЦІЯ
          </div>
          <h1 style={{ color: TX, fontSize: "var(--fz-h1)", fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            Налаштування
          </h1>
        </div>

        {/* ── COLOR MODES ─────────────────────────────────────── */}
        <div style={{ ...sp(), marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${FR}` }}>
            <SectionHead>🎨 Кольорові режими тренування</SectionHead>
            <p style={{ color: MU, fontSize: "var(--fz-sm)", margin: 0, lineHeight: 1.5 }}>
              Кожен режим має свій акцентний колір. Клікни на кольоровий квадрат щоб змінити.
            </p>
          </div>

          <div style={{ padding: "6px 0" }}>
            {(Object.values(THEMES) as (typeof THEMES)[ThemeMode][]).map(t => {
              const isActive = theme === t.mode;
              const c = accentColors[t.mode];
              return (
                <div key={t.mode} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 20px",
                  background: isActive ? `${c}08` : "transparent",
                  borderLeft: `2px solid ${isActive ? c : "transparent"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onClick={() => setTheme(t.mode)}
                >
                  {/* Color picker */}
                  <label style={{ position: "relative", flexShrink: 0, cursor: "pointer" }} title="Змінити колір">
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: c,
                      border: `2px solid ${isActive ? c : FR}`,
                      boxShadow: isActive ? `0 0 16px ${c}55` : "none",
                      cursor: "pointer",
                      clipPath: "polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)",
                    }} />
                    <input
                      type="color"
                      value={c}
                      onChange={e => { e.stopPropagation(); setModeColor(t.mode, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                    />
                  </label>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: isActive ? TX : "#6a6e72", fontSize: "var(--fz-sm)", fontWeight: 700 }}>{t.label}</span>
                      {isActive && (
                        <span style={{
                          color: c, fontSize: "var(--fz-micro)", fontWeight: 700, letterSpacing: 1,
                          background: `${c}15`, padding: "2px 7px", borderRadius: 3,
                        }}>АКТИВНИЙ</span>
                      )}
                    </div>
                    <div style={{ color: MU, fontSize: "var(--fz-xs)", marginTop: 2 }}>{t.description}</div>
                  </div>

                  <div style={{
                    color: MU, fontSize: "var(--fz-xs)", fontFamily: "monospace", letterSpacing: 0.5,
                    background: "#0a0c0e", padding: "4px 10px", borderRadius: 5,
                    border: `1px solid ${FR}`,
                  }}>
                    {c.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── GRAPH COLORS ─────────────────────────────────── */}
        <div style={{ ...sp(), marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${FR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <SectionHead>🕸 Кольори графа</SectionHead>
              <p style={{ color: MU, fontSize: "var(--fz-sm)", margin: 0, lineHeight: 1.5 }}>
                Кольори статусів вузлів на сторінці графа платформи.
              </p>
            </div>
            <button onClick={resetGraphColors} style={{
              background: "transparent", border: `1px solid ${FR}`, borderRadius: 6,
              color: MU, fontSize: "var(--fz-xs)", cursor: "pointer", padding: "4px 10px",
              flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = TX)}
              onMouseLeave={e => (e.currentTarget.style.color = MU)}
            >↺ Скинути</button>
          </div>

          <div style={{ padding: "6px 0" }}>
            {(Object.entries(GRAPH_STATUS_META) as [GraphStatus, { label: string; defaultColor: string }][]).map(([key, meta]) => {
              const c = graphColors[key];
              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "12px 20px",
                  borderLeft: `2px solid ${c}66`,
                  transition: "all 0.15s",
                }}>
                  <label style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: c + "22",
                      border: `2px solid ${c}88`,
                      boxShadow: `0 0 12px ${c}33`,
                      cursor: "pointer",
                      clipPath: "polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)",
                    }}>
                      <div style={{ width: "100%", height: "100%", background: c, opacity: 0.7, borderRadius: 5 }} />
                    </div>
                    <input type="color" value={c} onChange={e => setGraphColor(key, e.target.value)}
                      style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                  </label>
                  <span style={{ color: TX, fontSize: "var(--fz-sm)", fontWeight: 600, flex: 1 }}>{meta.label}</span>
                  <span style={{
                    color: MU, fontSize: "var(--fz-xs)", fontFamily: "monospace",
                    background: "#0a0c0e", padding: "3px 9px", borderRadius: 5,
                    border: `1px solid ${FR}`,
                  }}>{c.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ALMANAC COLORS ────────────────────────────────── */}
        <div style={{ ...sp(), marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${FR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <SectionHead>📖 Кольори альманаху</SectionHead>
              <p style={{ color: MU, fontSize: "var(--fz-sm)", margin: 0, lineHeight: 1.5 }}>
                Кольори типів вузлів графа альманаху: персонажі, техніки, події, концепти.
              </p>
            </div>
            <button onClick={resetAlmanacColors} style={{
              background: "transparent", border: `1px solid ${FR}`, borderRadius: 6,
              color: MU, fontSize: "var(--fz-xs)", cursor: "pointer", padding: "4px 10px",
              flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = TX)}
              onMouseLeave={e => (e.currentTarget.style.color = MU)}
            >↺ Скинути</button>
          </div>

          <div style={{ padding: "6px 0" }}>
            {(Object.entries(ALMANAC_TYPE_META) as [AlmanacColorKey, { label: string; defaultColor: string }][]).map(([key, meta]) => {
              const c = almanacColors[key];
              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "12px 20px",
                  borderLeft: `2px solid ${c}66`,
                  transition: "all 0.15s",
                }}>
                  <label style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: c + "22",
                      border: `2px solid ${c}88`,
                      boxShadow: `0 0 12px ${c}33`,
                      cursor: "pointer",
                      clipPath: "polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)",
                    }}>
                      <div style={{ width: "100%", height: "100%", background: c, opacity: 0.7, borderRadius: 5 }} />
                    </div>
                    <input type="color" value={c} onChange={e => setAlmanacColor(key, e.target.value)}
                      style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                  </label>
                  <span style={{ color: TX, fontSize: "var(--fz-sm)", fontWeight: 600, flex: 1 }}>{meta.label}</span>
                  <span style={{
                    color: MU, fontSize: "var(--fz-xs)", fontFamily: "monospace",
                    background: "#0a0c0e", padding: "3px 9px", borderRadius: 5,
                    border: `1px solid ${FR}`,
                  }}>{c.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WALLPAPER ─────────────────────────────────────── */}
        <div style={{ ...sp(), marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${FR}` }}>
            <SectionHead>🖼 Фонове зображення дашборду</SectionHead>
            <p style={{ color: MU, fontSize: "var(--fz-sm)", margin: 0, lineHeight: 1.5 }}>
              Зображення відображається на головній сторінці. Зберігається локально у браузері.
            </p>
          </div>

          <div style={{ padding: "20px" }}>
            {/* Preview */}
            <div style={{
              width: "100%", height: 140, borderRadius: 8,
              border: `1px dashed ${FR}`,
              marginBottom: 14, overflow: "hidden", position: "relative",
              background: wallpaper ? "transparent" : "#0a0c0e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {wallpaper ? (
                <img src={wallpaper} alt="wallpaper preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <span style={{ color: "#2a2e32", fontSize: "var(--fz-sm)" }}>Зображення не вибрано</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ flex: 1, cursor: "pointer" }}>
                <div style={{
                  padding: "9px 0", textAlign: "center", borderRadius: 7,
                  background: `${accent}15`, border: `1px solid ${accent}44`,
                  color: accent, fontSize: "var(--fz-sm)", fontWeight: 700, letterSpacing: 0.5,
                  clipPath: "polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)",
                  cursor: "pointer",
                }}>
                  📁 Завантажити фото
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleWallpaperUpload} style={{ display: "none" }} />
              </label>
              {wallpaper && (
                <button onClick={clearWallpaper} style={{
                  padding: "9px 16px", borderRadius: 7,
                  background: "#1a0a0a", border: "1px solid #ef444430",
                  color: "#ef4444", fontSize: "var(--fz-sm)", fontWeight: 700,
                  cursor: "pointer",
                  clipPath: "polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2a0a0a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1a0a0a")}
                >✕ Скинути</button>
              )}
            </div>
          </div>
        </div>

        {/* ── FONT SIZE ─────────────────────────────────────── */}
        <div style={{ ...sp(), marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${FR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <SectionHead>🔡 Розмір тексту</SectionHead>
              <p style={{ color: MU, fontSize: "var(--fz-sm)", margin: 0, lineHeight: 1.5 }}>
                Масштаб шрифтів інтерфейсу. Змінює заголовки, текст, мітки та підписи.
              </p>
            </div>
            <button onClick={resetFontSizes} style={{
              background: "transparent", border: `1px solid ${FR}`, borderRadius: 6,
              color: MU, fontSize: "var(--fz-xs)", cursor: "pointer", padding: "4px 10px", flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = TX)}
              onMouseLeave={e => (e.currentTarget.style.color = MU)}
            >↺ Скинути</button>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {/* Presets */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(Object.keys(FONT_PRESETS) as FontPreset[]).map(p => {
                const isActive = fontPreset === p;
                return (
                  <button key={p} onClick={() => setFontPreset(p)} style={{
                    flex: 1, padding: "10px 6px", borderRadius: 8,
                    background: isActive ? `${accent}18` : "#0a0c0e",
                    border: `1.5px solid ${isActive ? accent + "80" : FR}`,
                    color: isActive ? accent : MU,
                    fontSize: "var(--fz-sm)", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    {FONT_PRESET_LABELS[p]}
                  </button>
                );
              })}
            </div>

            {/* Live preview */}
            <div style={{
              background: "#0a0c0e", border: `1px solid ${FR}`,
              borderRadius: 8, padding: "14px 16px", marginBottom: 14,
            }}>
              <div style={{ fontSize: fontSizes.heading, fontWeight: 800, color: TX, lineHeight: 1.2, marginBottom: 4 }}>
                Нове тренування
              </div>
              <div style={{ fontSize: fontSizes.title, fontWeight: 600, color: TX + "cc", marginBottom: 6 }}>
                Підготовка до змагань · Тиждень 3
              </div>
              <div style={{ fontSize: fontSizes.body, color: "#8a9ab0", marginBottom: 8 }}>
                Сьогодні: Пронація на блоці · Back Pressure · Cup
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Top Roll", "Strength", "18 підходів"].map(t => (
                  <span key={t} style={{
                    fontSize: fontSizes.label, fontWeight: 700,
                    background: accent + "18", border: `1px solid ${accent}40`,
                    color: accent, borderRadius: 4, padding: "2px 6px",
                  }}>{t}</span>
                ))}
                <span style={{ fontSize: fontSizes.micro, color: MU, alignSelf: "center", marginLeft: 4 }}>
                  06.05.2026 · 55 хв
                </span>
              </div>
            </div>

            {/* Advanced sliders toggle */}
            <button
              onClick={() => setFontAdvanced(v => !v)}
              style={{
                background: "none", border: "none", color: MU,
                fontSize: "var(--fz-xs)", cursor: "pointer", display: "flex",
                alignItems: "center", gap: 6, marginBottom: fontAdvanced ? 12 : 0,
              }}
            >
              {fontAdvanced ? "▲" : "▼"} Детальне налаштування
            </button>

            {fontAdvanced && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(
                  [
                    { key: "display", label: "Великі числа / іконки" },
                    { key: "heading", label: "Заголовок сторінки" },
                    { key: "title",   label: "Підзаголовок / картка" },
                    { key: "body",    label: "Основний текст" },
                    { key: "small",   label: "Допоміжний текст" },
                    { key: "label",   label: "Мітки та бейджі" },
                    { key: "micro",   label: "Дрібні підписи" },
                  ] as { key: keyof FontSizes; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "var(--fz-sm)", color: MU, minWidth: 170, fontWeight: 500 }}>
                      {label}
                    </span>
                    <input
                      type="range"
                      min={7} max={40} step={1}
                      value={fontSizes[key]}
                      onChange={e => setFontSize(key, Number(e.target.value))}
                      style={{ flex: 1, accentColor: accent }}
                    />
                    <span style={{
                      fontSize: "var(--fz-xs)", color: accent, fontWeight: 700,
                      fontFamily: "monospace", minWidth: 36, textAlign: "right",
                    }}>
                      {fontSizes[key]}px
                    </span>
                    <span style={{ fontSize: fontSizes[key], color: TX, minWidth: 60 }}>
                      Aa
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SAVE ─────────────────────────────────────────── */}
        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "13px 0",
          background: saved ? `${accent}22` : saving ? "#1a1e22" : `${accent}18`,
          border: `1.5px solid ${saved ? accent : accent + "44"}`,
          color: saved ? accent : saving ? MU : accent,
          fontSize: "var(--fz-sm)", fontWeight: 700, letterSpacing: 1,
          cursor: saving ? "not-allowed" : "pointer",
          clipPath: "polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)",
          transition: "all 0.2s",
        }}>
          {saved ? "✓ ЗБЕРЕЖЕНО" : saving ? "Збереження..." : "💾 ЗБЕРЕГТИ НА СЕРВЕРІ"}
        </button>

        <p style={{ color: "#2a2e32", fontSize: "var(--fz-xs)", textAlign: "center", marginTop: 10 }}>
          Колір режимів та фон також зберігаються локально в браузері автоматично
        </p>
      </main>
    </div>
  );
}
