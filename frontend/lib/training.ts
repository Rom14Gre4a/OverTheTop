import { api } from "./api";

export enum PeriodGoal {
  Competition = 0, Offseason = 1, Strength = 2,
  Volume = 3, Technique = 4, Rehabilitation = 5,
}
export enum TrainingMode {
  Strength = 0, Volume = 1, Endurance = 2,
  Power = 3, Technique = 4, Competition = 5, Deload = 6,
}
export enum ExerciseStyle { TopRoll = 0, Hook = 1, Press = 2, General = 3 }
export enum MuscleGroup {
  Wrist = 0, Forearm = 1, Bicep = 2, Tricep = 3,
  Shoulder = 4, Back = 5, General = 6,
}

export const GOAL_LABELS: Record<PeriodGoal, string> = {
  [PeriodGoal.Competition]:   "Підготовка до змагань",
  [PeriodGoal.Offseason]:     "Міжсезоння",
  [PeriodGoal.Strength]:      "Чиста сила",
  [PeriodGoal.Volume]:        "Об'єм",
  [PeriodGoal.Technique]:     "Техніка",
  [PeriodGoal.Rehabilitation]:"Відновлення",
};
export const MODE_LABELS: Record<TrainingMode, string> = {
  [TrainingMode.Strength]:   "Силова",
  [TrainingMode.Volume]:     "Об'ємна",
  [TrainingMode.Endurance]:  "Витривалість",
  [TrainingMode.Power]:      "Вибухова",
  [TrainingMode.Technique]:  "Технічна",
  [TrainingMode.Competition]:"Змагальна",
  [TrainingMode.Deload]:     "Розвантаження",
};
export const MODE_DESC: Record<TrainingMode, string> = {
  [TrainingMode.Strength]:   "1–5 повт · великі ваги · довгий відпочинок",
  [TrainingMode.Volume]:     "8–15 повт · помірні ваги · м'язовий об'єм",
  [TrainingMode.Endurance]:  "15+ повт · короткий відпочинок · витривалість",
  [TrainingMode.Power]:      "швидкість + сила · вибухові повторення",
  [TrainingMode.Technique]:  "легко · повільно · шліфування техніки",
  [TrainingMode.Competition]:"пікова фаза · передзмагальне налаштування",
  [TrainingMode.Deload]:     "знижене навантаження · відновлення суглобів",
};
export const STYLE_LABELS: Record<ExerciseStyle, string> = {
  [ExerciseStyle.TopRoll]: "Top Roll",
  [ExerciseStyle.Hook]:    "Hook",
  [ExerciseStyle.Press]:   "Press",
  [ExerciseStyle.General]: "Загальний",
};
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  [MuscleGroup.Wrist]:    "Зап'ясток",
  [MuscleGroup.Forearm]:  "Передпліччя",
  [MuscleGroup.Bicep]:    "Біцепс",
  [MuscleGroup.Tricep]:   "Трицепс",
  [MuscleGroup.Shoulder]: "Плече",
  [MuscleGroup.Back]:     "Спина",
  [MuscleGroup.General]:  "Загальне",
};
export const DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];

export interface ExerciseDto {
  id: string; name: string; nameEn: string;
  description: string; tips?: string;
  style: ExerciseStyle; muscleGroup: MuscleGroup;
  tierRank?: string; isFavorite?: boolean;
}
export interface TrainingBlockDto {
  id?: string; exerciseId: string; order: number;
  sets: number; reps: string;
  intensityPercent?: number; restSeconds?: number; notes?: string;
  exercise?: ExerciseDto;
}
export interface DayTemplateDto {
  id?: string; dayOfWeek: number; name: string;
  blocks: TrainingBlockDto[];
}
export interface MesocycleDto {
  id?: string; name: string; mode: TrainingMode;
  startWeek: number; durationWeeks: number;
  description?: string; dayTemplates: DayTemplateDto[];
}
export interface MacroperiodDto {
  id: string; name: string; goal: PeriodGoal; focusStyle: ExerciseStyle;
  startDate: string; weeksCount: number; description?: string;
  createdAt: string; mesocycles: MesocycleDto[];
}

export const trainingApi = {
  getExercises: (style?: ExerciseStyle) =>
    api.get<ExerciseDto[]>("/api/exercises", { params: style !== undefined ? { style } : {} })
       .then(r => r.data),
  toggleFavorite: (id: string) =>
    api.post<{ isFavorite: boolean }>(`/api/exercises/${id}/favorite`).then(r => r.data),
  getMacroperiods: () =>
    api.get<MacroperiodDto[]>("/api/macroperiod").then(r => r.data),
  getMacroperiod: (id: string) =>
    api.get<MacroperiodDto>(`/api/macroperiod/${id}`).then(r => r.data),
  createMacroperiod: (data: unknown) =>
    api.post<MacroperiodDto>("/api/macroperiod", data).then(r => r.data),
  deleteMacroperiod: (id: string) =>
    api.delete(`/api/macroperiod/${id}`),
};

export function autoSuggestMesocycles(goal: PeriodGoal, weeks: number): Omit<MesocycleDto, "dayTemplates">[] {
  if (goal === PeriodGoal.Competition) {
    const v = Math.round(weeks * 0.35), s = Math.round(weeks * 0.3),
          p = Math.round(weeks * 0.25), d = weeks - v - s - p;
    return [
      { name: "Об'ємна фаза", mode: TrainingMode.Volume, startWeek: 1, durationWeeks: v },
      { name: "Силова фаза",  mode: TrainingMode.Strength, startWeek: v + 1, durationWeeks: s },
      { name: "Пікова фаза",  mode: TrainingMode.Power, startWeek: v + s + 1, durationWeeks: p },
      { name: "Розвантаження", mode: TrainingMode.Deload, startWeek: v + s + p + 1, durationWeeks: d || 1 },
    ].filter(m => m.durationWeeks > 0);
  }
  if (goal === PeriodGoal.Strength) {
    const half = Math.floor(weeks / 2);
    return [
      { name: "Базова сила", mode: TrainingMode.Volume, startWeek: 1, durationWeeks: half },
      { name: "Максимальна сила", mode: TrainingMode.Strength, startWeek: half + 1, durationWeeks: weeks - half },
    ];
  }
  return [{ name: "Основна фаза", mode: TrainingMode.Volume, startWeek: 1, durationWeeks: weeks }];
}
