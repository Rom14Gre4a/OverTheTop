"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  Tournament,
  TournamentType,
  TournamentPriority,
  TournamentStatus,
  TYPE_LABELS,
  PRIORITY_LABELS,
  WEIGHT_CATEGORIES,
  loadTournaments,
  saveTournaments,
  createTournament,
  getDaysUntil,
  formatDate,
  pluralDays,
  pluralWeeks,
  getPreparationPhase,
} from "@/lib/tournaments";
import { Card, Button, Badge, Modal, Input, Select } from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterType = "all" | "upcoming" | "targets" | "official" | "past";

interface FormSaveData {
  name: string;
  date: string;
  endDate?: string;
  city: string;
  country: string;
  location?: string;
  type: TournamentType;
  isTarget: boolean;
  priority?: TournamentPriority;
  myWeightCategory?: string;
  myGoal?: string;
  registrationDeadline?: string;
  notes?: string;
}

// ─── TournamentForm ───────────────────────────────────────────────────────────

function TournamentForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Tournament;
  onSave: (data: FormSaveData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    date: initial?.date ?? "",
    endDate: initial?.endDate ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "Україна",
    location: initial?.location ?? "",
    type: (initial?.type ?? "championship") as TournamentType,
    isTarget: initial?.isTarget ?? false,
    priority: (initial?.priority ?? "B") as TournamentPriority,
    myWeightCategory: initial?.myWeightCategory ?? "",
    myGoal: initial?.myGoal ?? "",
    registrationDeadline: initial?.registrationDeadline ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.city) return;
    onSave({
      name: form.name,
      date: form.date,
      endDate: form.endDate || undefined,
      city: form.city,
      country: form.country,
      location: form.location || undefined,
      type: form.type,
      isTarget: form.isTarget,
      priority: form.isTarget ? form.priority : undefined,
      myWeightCategory: form.isTarget && form.myWeightCategory ? form.myWeightCategory : undefined,
      myGoal: form.isTarget && form.myGoal ? form.myGoal : undefined,
      registrationDeadline: form.registrationDeadline || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Назва турніру"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        required
        placeholder="Чемпіонат України з армспорту"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Дата початку"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          required
        />
        <Input
          label="Дата кінця"
          type="date"
          value={form.endDate}
          onChange={(e) => set("endDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Місто"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          required
          placeholder="Харків"
        />
        <Input
          label="Локація / зал"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Палац спорту"
        />
      </div>

      <Select
        label="Тип турніру"
        value={form.type}
        onChange={(e) => set("type", e.target.value as TournamentType)}
      >
        {(Object.entries(TYPE_LABELS) as [TournamentType, string][]).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </Select>

      <Input
        label="Дедлайн реєстрації"
        type="date"
        value={form.registrationDeadline}
        onChange={(e) => set("registrationDeadline", e.target.value)}
      />

      {/* Target section */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)" }}>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isTarget}
            onChange={(e) => set("isTarget", e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="font-medium text-sm">Готуюся до цього турніру</span>
        </label>

        {form.isTarget && (
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            <Select
              label="Пріоритет"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as TournamentPriority)}
            >
              {(Object.entries(PRIORITY_LABELS) as [TournamentPriority, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            <Select
              label="Моя вагова категорія"
              value={form.myWeightCategory}
              onChange={(e) => set("myWeightCategory", e.target.value)}
            >
              <option value="">— обрати —</option>
              {WEIGHT_CATEGORIES.map((w) => (
                <option key={w} value={w}>{w} кг</option>
              ))}
            </Select>
            <Input
              label="Моя мета на турнір"
              value={form.myGoal}
              onChange={(e) => set("myGoal", e.target.value)}
              placeholder="Топ-3, Виграти категорію, Потрапити у фінал..."
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-muted text-xs font-medium uppercase tracking-wide">Нотатки</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Готель, транспорт, контакт організатора..."
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all border text-foreground placeholder:text-muted"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" glow className="flex-1">
          {initial ? "Зберегти зміни" : "Додати турнір"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Скасувати
        </Button>
      </div>
    </form>
  );
}

// ─── ResultForm ───────────────────────────────────────────────────────────────

function ResultForm({
  tournament,
  onSave,
  onClose,
}: {
  tournament: Tournament;
  onSave: (result: string, place?: number, notes?: string) => void;
  onClose: () => void;
}) {
  const [result, setResult] = useState(tournament.myResult ?? "");
  const [place, setPlace] = useState(tournament.myPlace?.toString() ?? "");
  const [notes, setNotes] = useState(tournament.notes ?? "");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{tournament.name} · {formatDate(tournament.date)}</p>
      <Input
        label="Результат виступу"
        value={result}
        onChange={(e) => setResult(e.target.value)}
        placeholder="Виграв категорію, зайняв 2 місце..."
      />
      <Input
        label="Зайняте місце"
        type="number"
        min="1"
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        placeholder="1"
      />
      <div className="flex flex-col gap-1">
        <label className="text-muted text-xs font-medium uppercase tracking-wide">Нотатки після турніру</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Що вдалось, що покращити, стратегія..."
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all border text-foreground placeholder:text-muted"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant="primary"
          glow
          className="flex-1"
          onClick={() => onSave(result, place ? Number(place) : undefined, notes || undefined)}
        >
          Зберегти результат
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Скасувати
        </Button>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Січ", "Лют", "Бер", "Квіт", "Трав", "Черв",
  "Лип", "Серп", "Вер", "Жовт", "Лист", "Груд",
];

function Timeline({
  tournaments,
  onSelect,
}: {
  tournaments: Tournament[];
  onSelect: (t: Tournament) => void;
}) {
  const MONTH_W = 100;
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const scrollRef = useRef<HTMLDivElement>(null);

  const byMonth = useMemo(() => {
    const map: Record<number, Tournament[]> = {};
    tournaments.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (!map[m]) map[m] = [];
        map[m].push(t);
      }
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
    );
    return map;
  }, [tournaments, year]);

  const maxPerMonth = Math.max(1, ...Object.values(byMonth).map((a) => a.length));
  const containerH = 44 + maxPerMonth * 30;
  const todayLeft = today.getMonth() * MONTH_W + (today.getDate() / 31) * MONTH_W;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = todayLeft - scrollRef.current.clientWidth / 2;
    }
  }, [todayLeft]);

  return (
    <div className="glass rounded-2xl p-5">
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="relative" style={{ width: MONTH_W * 12, height: containerH }}>

          {/* Month labels + dividers */}
          {Array.from({ length: 12 }, (_, m) => (
            <div key={m}>
              <div
                className="absolute top-0 text-xs text-muted text-center font-medium"
                style={{ left: m * MONTH_W, width: MONTH_W }}
              >
                {MONTH_NAMES[m]}
              </div>
              <div
                className="absolute"
                style={{
                  left: m * MONTH_W,
                  top: 20,
                  width: 1,
                  height: containerH - 20,
                  background: "var(--border)",
                }}
              />
            </div>
          ))}

          {/* Baseline */}
          <div
            className="absolute"
            style={{ left: 0, right: 0, top: 26, height: 1, background: "var(--border-strong)" }}
          />

          {/* Today marker */}
          <div
            className="absolute z-10"
            style={{ left: todayLeft, top: 16, bottom: 0, width: 2, background: "var(--accent)" }}
          >
            <div
              className="absolute -top-1 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{ background: "var(--accent)", color: "#000", left: "50%", transform: "translateX(-50%)" }}
            >
              сьогодні
            </div>
          </div>

          {/* Tournament markers */}
          {Array.from({ length: 12 }, (_, m) => {
            const ts = byMonth[m] ?? [];
            return ts.map((t, i) => {
              const d = new Date(t.date);
              const left = m * MONTH_W + (d.getDate() / 32) * MONTH_W;
              const top = 32 + i * 30;
              const isPast = getDaysUntil(t.date) < 0;
              const dotColor = t.isTarget
                ? "var(--accent)"
                : isPast
                ? "#4b5563"
                : "#3b82f6";

              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="absolute group"
                  style={{ left: left - 5, top }}
                  title={t.name}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full border-2 transition-transform duration-150 group-hover:scale-[1.8]"
                    style={{
                      borderColor: dotColor,
                      background: t.isTarget ? dotColor : isPast ? "#1f2937" : "#1d4ed8",
                    }}
                  />
                  <div
                    className="absolute left-4 top-0 z-20 glass rounded-lg px-2 py-1 text-[10px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                    style={{ minWidth: 80 }}
                  >
                    {formatDate(t.date, { day: "numeric", month: "short" })} · {t.name}
                  </div>
                </button>
              );
            });
          })}
        </div>
      </div>

      <div className="flex items-center gap-5 mt-3 text-xs text-muted pt-3 border-t border-[var(--border)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          Мої цілі
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-700" />
          Заплановані
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#4b5563" }} />
          Минулі
        </span>
        <span className="ml-auto">Клікни на позначку для деталей</span>
      </div>
    </div>
  );
}

// ─── CountdownBanner ─────────────────────────────────────────────────────────

function CountdownBanner({ tournament }: { tournament: Tournament }) {
  const days = getDaysUntil(tournament.date);
  const weeks = Math.floor(days / 7);
  const phase = getPreparationPhase(days);

  return (
    <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 90% 50%, var(--accent-glow) 0%, transparent 65%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted uppercase tracking-widest mb-1.5">
            🎯 Наступний цільовий турнір
          </div>
          <h2 className="text-xl font-bold truncate" style={{ color: "var(--accent)" }}>
            {tournament.name}
          </h2>
          <div className="text-sm text-muted mt-1">
            {formatDate(tournament.date, { day: "numeric", month: "long", year: "numeric" })}
            {tournament.endDate && tournament.endDate !== tournament.date && (
              <> — {formatDate(tournament.endDate, { day: "numeric", month: "long" })}</>
            )}
            {" · "}
            {tournament.location ? `${tournament.location}, ${tournament.city}` : tournament.city}
          </div>
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {tournament.priority && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{
                  background: tournament.priority === "A" ? "var(--accent)" : tournament.priority === "B" ? "#84cc16" : "#6b7280",
                  color: "#000",
                }}
              >
                Пріоритет {tournament.priority}
              </span>
            )}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: phase.color + "22", color: phase.color }}
            >
              {phase.label}
            </span>
            {tournament.myWeightCategory && (
              <span className="text-xs text-muted">
                Категорія: <span className="text-foreground font-medium">{tournament.myWeightCategory} кг</span>
              </span>
            )}
            {tournament.myGoal && (
              <span className="text-xs text-muted">
                Мета: <span className="text-foreground font-medium">{tournament.myGoal}</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-6xl font-black leading-none" style={{ color: "var(--accent)" }}>
            {days}
          </div>
          <div className="text-sm text-muted mt-1">{pluralDays(days)}</div>
          {weeks > 0 && (
            <div className="text-xs text-muted mt-0.5">
              {weeks} {pluralWeeks(weeks)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TournamentCard ───────────────────────────────────────────────────────────

function TournamentCard({
  tournament: t,
  onEdit,
  onToggleTarget,
  onAddResult,
  onToggleRegistered,
  onDelete,
}: {
  tournament: Tournament;
  onEdit: () => void;
  onToggleTarget: () => void;
  onAddResult: () => void;
  onToggleRegistered: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const days = getDaysUntil(t.date);
  const isPast = days < 0;
  const isToday = days === 0;
  const isSoon = days > 0 && days <= 14;
  const regDays = t.registrationDeadline ? getDaysUntil(t.registrationDeadline) : null;
  const regWarning = regDays !== null && regDays >= 0 && regDays <= 10;
  const phase = t.isTarget && !isPast && days > 0 ? getPreparationPhase(days) : null;

  const typeBadge = (): "accent" | "success" | "warning" | "neutral" => {
    if (t.type === "championship") return "accent";
    if (t.type === "international") return "warning";
    if (t.type === "cup") return "success";
    return "neutral";
  };

  return (
    <Card className={`flex flex-col gap-3 relative ${t.isTarget ? "glow-border" : ""}`}>
      {/* Priority strip */}
      {t.isTarget && t.priority && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{
            background: t.priority === "A" ? "var(--accent)" : t.priority === "B" ? "#84cc16" : "#6b7280",
          }}
        />
      )}

      {/* Badges row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={typeBadge()}>{TYPE_LABELS[t.type]}</Badge>
          {t.isOfficial && <Badge variant="neutral">Офіц.</Badge>}
          {t.status === "registered" && <Badge variant="success">Зареєстрований</Badge>}
          {t.status === "attended" && <Badge variant="neutral">Завершено</Badge>}
          {t.status === "cancelled" && <Badge variant="danger">Скасовано</Badge>}
        </div>
        {t.isTarget && t.priority && (
          <span
            className="text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0"
            style={{
              background: t.priority === "A" ? "var(--accent)" : t.priority === "B" ? "#84cc16" : "#6b7280",
              color: "#000",
            }}
          >
            {t.priority}
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        className="font-semibold text-base leading-snug"
        style={{ color: t.isTarget ? "var(--accent)" : "var(--foreground)" }}
      >
        {t.name}
      </h3>

      {/* Date & location */}
      <div className="text-sm text-muted space-y-0.5">
        <div>
          {formatDate(t.date, { day: "numeric", month: "long", year: "numeric" })}
          {t.endDate && t.endDate !== t.date && (
            <> — {formatDate(t.endDate, { day: "numeric", month: "long" })}</>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>📍</span>
          <span>{t.location ? `${t.location}, ${t.city}` : t.city}</span>
        </div>
      </div>

      {/* Countdown or result */}
      {!isPast ? (
        <div className="text-sm font-semibold">
          {isToday ? (
            <span style={{ color: "var(--accent)" }}>Сьогодні! 🏆</span>
          ) : isSoon ? (
            <span className="text-yellow-400">За {days} {pluralDays(days)} 🔥</span>
          ) : (
            <span className="text-muted font-normal">
              За <span className="text-foreground font-semibold">{days}</span> {pluralDays(days)}
            </span>
          )}
        </div>
      ) : t.myResult ? (
        <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "var(--surface)" }}>
          <span className="text-muted">Результат: </span>
          <span className="font-medium">{t.myResult}</span>
          {t.myPlace && (
            <span className="ml-2 font-black" style={{ color: "var(--accent)" }}>
              #{t.myPlace}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={onAddResult}
          className="text-sm text-muted hover:text-foreground text-left transition-colors"
        >
          + Записати результат
        </button>
      )}

      {/* Preparation phase */}
      {phase && (
        <div
          className="text-xs font-medium px-2.5 py-1 rounded-lg self-start"
          style={{ background: phase.color + "22", color: phase.color }}
        >
          {phase.label}
        </div>
      )}

      {/* Target personal info */}
      {t.isTarget && (t.myWeightCategory || t.myGoal) && (
        <div className="rounded-xl px-3 py-2 text-xs space-y-0.5" style={{ background: "var(--surface)" }}>
          {t.myWeightCategory && (
            <div className="text-muted">
              Вага:{" "}
              <span className="text-foreground font-medium">{t.myWeightCategory} кг</span>
            </div>
          )}
          {t.myGoal && (
            <div className="text-muted">
              Мета:{" "}
              <span className="text-foreground font-medium">{t.myGoal}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes preview */}
      {t.notes && (
        <p className="text-xs text-muted line-clamp-2 italic">{t.notes}</p>
      )}

      {/* Registration deadline warning */}
      {regWarning && (
        <div className="text-xs font-medium rounded-xl px-3 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          ⚠️ Реєстрація до {formatDate(t.registrationDeadline!, { day: "numeric", month: "long" })}
          {regDays === 0 ? " (сьогодні!)" : ` — ${regDays} ${pluralDays(regDays!)}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] mt-auto">
        <button
          onClick={onToggleTarget}
          className="flex-1 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
          style={
            t.isTarget
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface)", color: "var(--muted)" }
          }
        >
          {t.isTarget ? "🎯 Готуюся" : "Взяти як ціль"}
        </button>

        {!isPast && (
          <button
            onClick={onToggleRegistered}
            className="glass rounded-xl px-2.5 py-1.5 text-xs transition-colors"
            style={{
              color: t.status === "registered" ? "#22c55e" : "var(--muted)",
            }}
            title={t.status === "registered" ? "Скасувати реєстрацію" : "Відмітити як зареєстрований"}
          >
            ✓
          </button>
        )}

        {isPast && !t.myResult && (
          <button
            onClick={onAddResult}
            className="glass rounded-xl px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
            title="Записати результат"
          >
            📊
          </button>
        )}

        <button
          onClick={onEdit}
          className="glass rounded-xl px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
          title="Редагувати"
        >
          ✏️
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="glass rounded-xl px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            ⋮
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full right-0 mb-1 glass-strong rounded-xl p-1 z-30 min-w-[160px]">
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/5 text-foreground"
                >
                  ✏️ Редагувати
                </button>
                {isPast && (
                  <button
                    onClick={() => { setShowMenu(false); onAddResult(); }}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/5 text-foreground"
                  >
                    📊 Записати результат
                  </button>
                )}
                {t.source === "custom" && (
                  <button
                    onClick={() => { setShowMenu(false); onDelete(); }}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400"
                  >
                    🗑 Видалити
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TournamentsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [addResultFor, setAddResultFor] = useState<Tournament | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setTournaments(loadTournaments());
    setReady(true);
  }, [router]);

  const persist = (updated: Tournament[]) => {
    const sorted = [...updated].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setTournaments(sorted);
    saveTournaments(sorted);
  };

  const handleSave = (data: FormSaveData) => {
    if (editingTournament) {
      persist(tournaments.map((t) => (t.id === editingTournament.id ? { ...t, ...data } : t)));
    } else {
      persist([...tournaments, createTournament({ ...data, status: "upcoming" })]);
    }
    setShowForm(false);
    setEditingTournament(null);
  };

  const toggleTarget = (id: string) => {
    persist(
      tournaments.map((t) =>
        t.id === id
          ? { ...t, isTarget: !t.isTarget, priority: !t.isTarget ? (t.priority ?? "B") : t.priority }
          : t
      )
    );
  };

  const toggleRegistered = (id: string) => {
    persist(
      tournaments.map((t) =>
        t.id === id
          ? { ...t, status: (t.status === "registered" ? "upcoming" : "registered") as TournamentStatus }
          : t
      )
    );
  };

  const saveResult = (id: string, result: string, place?: number, notes?: string) => {
    persist(
      tournaments.map((t) =>
        t.id === id
          ? { ...t, myResult: result, myPlace: place, status: "attended" as TournamentStatus, notes: notes ?? t.notes }
          : t
      )
    );
    setAddResultFor(null);
  };

  const handleDelete = (id: string) => {
    persist(tournaments.filter((t) => t.id !== id));
    setDeleteConfirm(null);
  };

  const openEdit = (t: Tournament) => {
    setEditingTournament(t);
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (filter === "targets") return t.isTarget;
      if (filter === "official") return t.isOfficial;
      if (filter === "past") return getDaysUntil(t.date) < 0;
      if (filter === "upcoming") return getDaysUntil(t.date) >= 0;
      return true;
    });
  }, [tournaments, filter]);

  const stats = useMemo(() => ({
    total: tournaments.length,
    upcoming: tournaments.filter((t) => getDaysUntil(t.date) >= 0).length,
    targets: tournaments.filter((t) => t.isTarget).length,
    past: tournaments.filter((t) => getDaysUntil(t.date) < 0).length,
  }), [tournaments]);

  const nextTarget = useMemo(() =>
    tournaments
      .filter((t) => t.isTarget && getDaysUntil(t.date) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0],
    [tournaments]
  );

  if (!ready) return null;

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "Всі", count: stats.total },
    { key: "upcoming", label: "Майбутні", count: stats.upcoming },
    { key: "targets", label: "Мої цілі", count: stats.targets },
    { key: "official", label: "Офіційні" },
    { key: "past", label: "Минулі", count: stats.past },
  ];

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div className="flex-1 min-w-0">
      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">Турніри</h1>
            <p className="text-muted mt-1 text-sm">
              Плануй виступи · Ставь цілі · Відстежуй прогрес
            </p>
          </div>
          <Button
            variant="primary"
            glow
            onClick={() => { setEditingTournament(null); setShowForm(true); }}
          >
            + Додати турнір
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Всього турнірів", value: stats.total, icon: "📋" },
            { label: "Майбутніх", value: stats.upcoming, icon: "📅" },
            { label: "Моїх цілей", value: stats.targets, icon: "🎯" },
            { label: "Завершених", value: stats.past, icon: "✅" },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="text-center">
              <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>
                {value}
              </div>
              <div className="text-xs text-muted mt-1.5">
                {icon} {label}
              </div>
            </Card>
          ))}
        </div>

        {/* Countdown banner */}
        {nextTarget && <CountdownBanner tournament={nextTarget} />}

        {/* Timeline */}
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
            Календар {new Date().getFullYear()}
          </h2>
          <Timeline
            tournaments={tournaments}
            onSelect={(t) => openEdit(t)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                filter === key
                  ? { background: "var(--accent)", color: "#000" }
                  : { background: "var(--surface)", color: "var(--muted)" }
              }
            >
              {label}
              {count !== undefined && (
                <span
                  className="ml-2 text-xs font-bold"
                  style={{ opacity: filter === key ? 0.7 : 0.5 }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tournament grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-lg font-semibold text-foreground mb-1">Немає турнірів</p>
            <p className="text-sm">
              {filter === "targets"
                ? "Відмітьте турніри як цілі, натиснувши «Взяти як ціль»"
                : filter === "past"
                ? "Ще жоден турнір не завершився"
                : "Додайте перший турнір, натиснувши «+ Додати турнір»"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onEdit={() => openEdit(t)}
                onToggleTarget={() => toggleTarget(t.id)}
                onAddResult={() => setAddResultFor(t)}
                onToggleRegistered={() => toggleRegistered(t.id)}
                onDelete={() => setDeleteConfirm(t)}
              />
            ))}
          </div>
        )}

        {/* Legend / tips */}
        <div className="glass rounded-2xl p-5 text-xs text-muted space-y-2">
          <div className="font-semibold text-foreground text-sm mb-3">💡 Як користуватись</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <div><span style={{ color: "var(--accent)" }}>A-пріоритет</span> — головна ціль сезону, пік форми</div>
            <div><span className="text-green-400">B-пріоритет</span> — підготовчий старт перед головним</div>
            <div><span className="text-gray-400">C-пріоритет</span> — для досвіду та відчуття змагань</div>
            <div><span className="text-yellow-400">✓</span> — відмітити реєстрацію на турнір</div>
            <div><span>📊</span> — записати результат після виступу</div>
            <div><span>🔥 Пікова форма</span> — менше 4 тижнів до турніру</div>
          </div>
        </div>

      </div>

      {/* Create / Edit modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTournament(null); }}
        title={editingTournament ? "Редагувати турнір" : "Новий турнір"}
      >
        <TournamentForm
          initial={editingTournament ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTournament(null); }}
        />
      </Modal>

      {/* Result modal */}
      <Modal
        open={!!addResultFor}
        onClose={() => setAddResultFor(null)}
        title="Результат виступу"
      >
        {addResultFor && (
          <ResultForm
            tournament={addResultFor}
            onSave={(result, place, notes) => saveResult(addResultFor.id, result, place, notes)}
            onClose={() => setAddResultFor(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Видалити турнір?"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-muted text-sm">
              Видалити <span className="text-foreground font-medium">«{deleteConfirm.name}»</span>?{" "}
              Цю дію не можна скасувати.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteConfirm.id)}>
                Видалити
              </Button>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Скасувати
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
