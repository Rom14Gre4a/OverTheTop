import { api } from "./api";

export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female";
  weight?: number;
  weightCategory?: string;
  preferredHand?: "Left" | "Right" | "Both";
  preferredStyle?: "TopRoll" | "Hook" | "Press" | "Tricep" | "Universal";
  country?: string;
  club?: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female";
  weight?: number;
  weightCategory?: string;
  preferredHand?: "Left" | "Right" | "Both";
  preferredStyle?: "TopRoll" | "Hook" | "Press" | "Tricep" | "Universal";
  country?: string;
  club?: string;
}

export async function getProfile(): Promise<AthleteProfile> {
  const res = await api.get<AthleteProfile>("/api/profile");
  return res.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AthleteProfile> {
  const res = await api.put<AthleteProfile>("/api/profile", payload);
  return res.data;
}

export const GENDER_LABELS: Record<string, string> = {
  Male: "Чоловіча",
  Female: "Жіноча",
};

export const HAND_LABELS: Record<string, string> = {
  Left: "Ліва",
  Right: "Права",
  Both: "Обидві",
};

export const STYLE_LABELS: Record<string, string> = {
  TopRoll: "Топ-рол",
  Hook:    "Хук",
  Press:   "Прес",
  Tricep:  "Трицепс",
  Universal: "Універсальний",
};

export const WEIGHT_CATEGORY_LABELS: Record<string, string> = {
  Under60kg:  "до 60 кг",
  Under65kg:  "до 65 кг",
  Under70kg:  "до 70 кг",
  Under75kg:  "до 75 кг",
  Under80kg:  "до 80 кг",
  Under85kg:  "до 85 кг",
  Under90kg:  "до 90 кг",
  Under100kg: "до 100 кг",
  Over100kg:  "+100 кг",
};
