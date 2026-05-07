"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { THEMES, type ThemeMode } from "@/lib/theme";
import { Modal } from "@/components/ui/Modal";

export function ThemeSwitcher() {
  const { theme, setTheme, accent, accentColors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES[theme];
  const dot = accent;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Режим тренування"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 10px", borderRadius: 7, cursor: "pointer",
          background: "transparent",
          border: "1px solid #1a1a1a",
          color: "#444", fontSize: "var(--fz-xs)", fontWeight: 600,
          transition: "all 0.15s", flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = dot + "55";
          e.currentTarget.style.color = dot;
          e.currentTarget.style.background = dot + "0f";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "#1a1a1a";
          e.currentTarget.style.color = "#444";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, display: "block" }} />
        {current.label}
      </button>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Режим тренування">
        <p style={{ color: "#555", fontSize: "var(--fz-sm)", margin: "0 0 16px", lineHeight: 1.5 }}>
          Обери стиль поточного тренування — змінює колірну тему застосунку.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(THEMES).map(t => {
            const active = theme === t.mode;
            const c = accentColors[t.mode];
            return (
              <button
                key={t.mode}
                onClick={() => { setTheme(t.mode); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 10, textAlign: "left",
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? `${c}12` : "#141414",
                  border: `1px solid ${active ? c + "55" : "#1e1e1e"}`,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "#1a1a1a";
                    e.currentTarget.style.borderColor = "#2a2a2a";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "#141414";
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: c, flexShrink: 0, display: "block",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: active ? "#f0f0f0" : "#888", fontSize: "var(--fz-sm)", fontWeight: 700, marginBottom: 2 }}>
                    {t.label}
                  </div>
                  <div style={{ color: "#444", fontSize: "var(--fz-xs)" }}>{t.description}</div>
                </div>
                {active && (
                  <span style={{
                    color: c, fontSize: "var(--fz-xs)", fontWeight: 700,
                    letterSpacing: 0.3, flexShrink: 0,
                  }}>
                    Активний
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
