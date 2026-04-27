export type ThemeMode = "orange" | "lime" | "yellow";

export interface ThemeConfig {
  mode: ThemeMode;
  label: string;
  trainingStyle: string;
  description: string;
  accent: string;
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  orange: {
    mode: "orange",
    label: "Сила",
    trainingStyle: "Силове тренування",
    description: "Максимальна потужність і агресія",
    accent: "#f97316",
  },
  lime: {
    mode: "lime",
    label: "Витривалість",
    trainingStyle: "Кондиційне тренування",
    description: "Швидкість, темп і витривалість",
    accent: "#84cc16",
  },
  yellow: {
    mode: "yellow",
    label: "Техніка",
    trainingStyle: "Технічне тренування",
    description: "Точність, контроль і шліфування",
    accent: "#eab308",
  },
};
