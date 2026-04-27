export type TournamentType =
  | "championship"
  | "cup"
  | "regional"
  | "international"
  | "open"
  | "memorial"
  | "friendly";

export type TournamentStatus = "upcoming" | "registered" | "attended" | "cancelled";
export type TournamentPriority = "A" | "B" | "C";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  location?: string;
  city: string;
  country: string;
  type: TournamentType;
  isOfficial: boolean;
  isTarget: boolean;
  priority?: TournamentPriority;
  status: TournamentStatus;
  myWeightCategory?: string;
  myGoal?: string;
  myResult?: string;
  myPlace?: number;
  registrationDeadline?: string;
  notes?: string;
  source: "official" | "custom";
  createdAt: string;
}

export const TYPE_LABELS: Record<TournamentType, string> = {
  championship: "Чемпіонат",
  cup: "Кубок",
  regional: "Регіональний",
  international: "Міжнародний",
  open: "Відкритий",
  memorial: "Пам'яті",
  friendly: "Товариський",
};

export const PRIORITY_LABELS: Record<TournamentPriority, string> = {
  A: "A — Головна мета",
  B: "B — Підготовчий старт",
  C: "C — Для досвіду",
};

export const WEIGHT_CATEGORIES = [
  "60", "65", "70", "75", "80", "85", "90", "100", "+100",
  "50ж", "55ж", "60ж", "65ж", "70ж", "+70ж",
];

// Ukrainian armwrestling official calendar 2026
const OFFICIAL_CALENDAR: Tournament[] = [
  {
    id: "ua-2026-kh-cup",
    name: "Кубок Харківської області",
    date: "2026-02-15",
    location: "ЦСКА",
    city: "Харків",
    country: "Україна",
    type: "regional",
    isOfficial: true,
    isTarget: false,
    status: "attended",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-poltava",
    name: "Відкритий Кубок Полтави",
    date: "2026-03-08",
    city: "Полтава",
    country: "Україна",
    type: "open",
    isOfficial: true,
    isTarget: false,
    status: "attended",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-champ-spring",
    name: "Чемпіонат України з армспорту",
    date: "2026-04-05",
    endDate: "2026-04-06",
    location: "Палац спорту «Локомотив»",
    city: "Харків",
    country: "Україна",
    type: "championship",
    isOfficial: true,
    isTarget: false,
    status: "attended",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-syla-natsiyi",
    name: "Відкритий турнір «Сила нації»",
    date: "2026-05-17",
    city: "Запоріжжя",
    country: "Україна",
    type: "open",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    registrationDeadline: "2026-05-03",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-bogatyr",
    name: "Міжнародний турнір «Богатир»",
    date: "2026-06-20",
    endDate: "2026-06-21",
    location: "СК «Металург»",
    city: "Запоріжжя",
    country: "Україна",
    type: "international",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    registrationDeadline: "2026-06-05",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-ukraine-cup",
    name: "Кубок України з армспорту",
    date: "2026-09-05",
    endDate: "2026-09-06",
    city: "Київ",
    country: "Україна",
    type: "cup",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-memorial",
    name: "Турнір пам'яті В. Пилипенка",
    date: "2026-10-03",
    city: "Дніпро",
    country: "Україна",
    type: "memorial",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-champ-autumn",
    name: "Чемпіонат України з армспорту",
    date: "2026-11-14",
    endDate: "2026-11-15",
    city: "Дніпро",
    country: "Україна",
    type: "championship",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ua-2026-odesa",
    name: "Кубок Одеської області",
    date: "2026-12-05",
    city: "Одеса",
    country: "Україна",
    type: "regional",
    isOfficial: true,
    isTarget: false,
    status: "upcoming",
    source: "official",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const STORAGE_KEY = "ott-tournaments-v1";

function sortByDate(arr: Tournament[]): Tournament[] {
  return [...arr].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function loadTournaments(): Tournament[] {
  if (typeof window === "undefined") return sortByDate(OFFICIAL_CALENDAR);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sortByDate([...OFFICIAL_CALENDAR]);
    const stored: Tournament[] = JSON.parse(raw);
    const storedIds = new Set(stored.map((t) => t.id));
    const newOfficial = OFFICIAL_CALENDAR.filter((t) => !storedIds.has(t.id));
    return sortByDate([...stored, ...newOfficial]);
  } catch {
    return sortByDate([...OFFICIAL_CALENDAR]);
  }
}

export function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

export function createTournament(
  data: Omit<Tournament, "id" | "createdAt" | "source" | "isOfficial">
): Tournament {
  return {
    ...data,
    id: `custom-${Date.now()}`,
    source: "custom",
    isOfficial: false,
    createdAt: new Date().toISOString(),
  };
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString("uk-UA", opts ?? {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function pluralDays(n: number): string {
  const a = Math.abs(n);
  if (a % 10 === 1 && a % 100 !== 11) return "день";
  if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) return "дні";
  return "днів";
}

export function pluralWeeks(n: number): string {
  const a = Math.abs(n);
  if (a % 10 === 1 && a % 100 !== 11) return "тиждень";
  if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) return "тижні";
  return "тижнів";
}

export function getPreparationPhase(days: number): { label: string; color: string } {
  if (days > 84) return { label: "Планування", color: "#6b7280" };
  if (days > 56) return { label: "Базова підготовка", color: "#3b82f6" };
  if (days > 28) return { label: "Спец. підготовка", color: "#84cc16" };
  return { label: "Пікова форма 🔥", color: "#f97316" };
}
