export type ThemeMode = "red" | "lime" | "yellow";

export interface ThemeConfig {
  mode: ThemeMode;
  label: string;
  trainingStyle: string;
  description: string;
  accent: string; // default accent (can be overridden per-user in settings)
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  red: {
    mode: "red",
    label: "Сила",
    trainingStyle: "Силове тренування",
    description: "Максимальна потужність і агресія",
    accent: "#FF1744",
  },
  lime: {
    mode: "lime",
    label: "Витривалість",
    trainingStyle: "Кондиційне тренування",
    description: "Швидкість, темп і витривалість",
    accent: "#8bff00",
  },
  yellow: {
    mode: "yellow",
    label: "Техніка",
    trainingStyle: "Технічне тренування",
    description: "Точність, контроль і шліфування",
    accent: "#eab308",
  },
};
