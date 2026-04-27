"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { THEMES, type ThemeMode } from "@/lib/theme";
import { Modal } from "@/components/ui/Modal";

const DOT_COLORS: Record<ThemeMode, string> = {
  orange: "#f97316",
  lime:   "#84cc16",
  yellow: "#eab308",
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES[theme];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border-[var(--border)] hover:border-[var(--accent)] transition text-xs text-muted hover:text-foreground"
        title="Режим тренування"
      >
        <span className="w-2 h-2 rounded-full glow-sm" style={{ background: DOT_COLORS[theme] }} />
        {current.label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Режим тренування">
        <p className="text-muted text-sm mb-4">
          Обери стиль поточного тренування — змінює колірну тему застосунку.
        </p>
        <div className="space-y-2">
          {(Object.values(THEMES)).map(t => (
            <button
              key={t.mode}
              onClick={() => { setTheme(t.mode); setOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                ${theme === t.mode
                  ? "bg-[var(--accent-dim)] border-[var(--accent)] glow-border"
                  : "glass border-[var(--border)] hover:border-[var(--border-strong)]"}`}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 glow-sm"
                style={{ background: DOT_COLORS[t.mode], boxShadow: `0 0 10px ${DOT_COLORS[t.mode]}88` }}
              />
              <div>
                <p className="font-semibold text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted">{t.description}</p>
              </div>
              {theme === t.mode && (
                <span className="ml-auto text-[var(--accent)] text-xs font-medium">Активний</span>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
