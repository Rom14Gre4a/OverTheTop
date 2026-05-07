import { api } from "./api";

export interface AppSettings {
  themeMode: string;
  accentColorsJson: string | null; // JSON: {"red":"#FF1744","lime":"#8bff00","yellow":"#eab308"}
  wallpaperUrl: string | null;
}

export async function fetchSettings(): Promise<AppSettings | null> {
  try {
    const res = await api.get<AppSettings>("/api/settings");
    return res.data;
  } catch { return null; }
}

export async function pushSettings(s: AppSettings): Promise<boolean> {
  try {
    await api.put("/api/settings", s);
    return true;
  } catch { return false; }
}
