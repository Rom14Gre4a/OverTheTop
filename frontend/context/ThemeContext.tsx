"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "orange",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("orange");

  useEffect(() => {
    const saved = localStorage.getItem("ott-theme") as ThemeMode | null;
    if (saved && ["orange", "lime", "yellow"].includes(saved)) {
      setThemeState(saved);
      applyTheme(saved);
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("ott-theme", mode);
    applyTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  if (mode !== "orange") root.setAttribute("data-theme", mode);
}

export const useTheme = () => useContext(ThemeContext);
