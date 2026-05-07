"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal, ModalBody, Chip, IconButton, Button } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { trainingApi, type ExerciseDto, MUSCLE_LABELS } from "@/lib/training";

// ── Types ─────────────────────────────────────────────────────────────────────

type Focus =
  | "top_roll" | "hook" | "press" | "back_pressure" | "side_pressure"
  | "pronation" | "supination" | "cup" | "riser" | "grip"
  | "table_time" | "recovery" | "general";

const FOCUS_LABELS: Record<Focus, string> = {
  top_roll: "Top Roll", hook: "Hook", press: "Press",
  back_pressure: "Back Pressure", side_pressure: "Side Pressure",
  pronation: "Pronation", supination: "Supination",
  cup: "Cup", riser: "Riser", grip: "Grip",
  table_time: "Table Time", recovery: "Відновлення", general: "Загальне",
};

const FOCUS_LIST: Focus[] = [
  "top_roll", "hook", "press", "pronation", "supination",
  "cup", "riser", "back_pressure", "side_pressure",
  "grip", "table_time", "recovery", "general",
];

interface SessionSet {
  id: string;
  load?: number;
  reps?: number;
  holdSeconds?: number;
  rpe?: number;
  pain?: number;
  completed: boolean;
  isPr: boolean;
  note?: string;
}

interface SessionExercise {
  id: string;
  exerciseId?: string;
  name: string;
  category: Focus;
  equipment?: string;
  order: number;
  isKey: boolean;
  sets: SessionSet[];
  note?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptySet(): SessionSet {
  return { id: uid(), completed: false, isPr: false };
}

// ── Set Row ───────────────────────────────────────────────────────────────────

function SetRow({
  set, idx, accent,
  onChange, onRemove,
}: {
  set: SessionSet; idx: number; accent: string;
  onChange: (s: SessionSet) => void;
  onRemove: () => void;
}) {
  const numInput = (
    label: string,
    val: number | undefined,
    update: (v: number | undefined) => void,
    placeholder = "—",
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "var(--fz-micro)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.5, textAlign: "center" }}>
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="any"
        value={val ?? ""}
        placeholder={placeholder}
        onChange={e => update(e.target.value === "" ? undefined : Number(e.target.value))}
        style={{
          width: 52, padding: "5px 4px", borderRadius: 7,
          background: "#111316", border: "1px solid #1e2228",
          color: "#c8d0da", fontSize: "var(--fz-sm)", fontWeight: 600,
          outline: "none", textAlign: "center",
        }}
      />
    </div>
  );

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 6,
      padding: "8px 10px", borderRadius: 9,
      background: set.completed ? "#0e1a0e" : "#0c0e10",
      border: `1px solid ${set.completed ? "#1e3a1e" : "#1a1e22"}`,
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: "var(--fz-xs)", color: "#2a2e32", fontWeight: 700, minWidth: 14, paddingBottom: 6 }}>
        {idx + 1}
      </span>

      {numInput("кг", set.load,        v => onChange({ ...set, load: v }))}
      {numInput("повт", set.reps,      v => onChange({ ...set, reps: v }))}
      {numInput("сек", set.holdSeconds,v => onChange({ ...set, holdSeconds: v }))}
      {numInput("RPE", set.rpe,        v => onChange({ ...set, rpe: v }))}

      {/* Completed */}
      <button
        onClick={() => onChange({ ...set, completed: !set.completed })}
        title="Виконано"
        style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: set.completed ? `${accent}33` : "#111316",
          border: `1px solid ${set.completed ? accent : "#1e2228"}`,
          color: set.completed ? accent : "#2a2e32",
          fontSize: "var(--fz-body)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✓</button>

      {/* PR */}
      <button
        onClick={() => onChange({ ...set, isPr: !set.isPr })}
        title="Особистий рекорд"
        style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: set.isPr ? "#fbbf2433" : "#111316",
          border: `1px solid ${set.isPr ? "#fbbf24" : "#1e2228"}`,
          color: set.isPr ? "#fbbf24" : "#2a2e32",
          fontSize: "var(--fz-micro)", fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >PR</button>

      <button
        onClick={onRemove}
        style={{
          width: 24, height: 24, borderRadius: 5, flexShrink: 0,
          background: "none", border: "none", color: "#2a2e32",
          fontSize: "var(--fz-body)", cursor: "pointer", paddingBottom: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >×</button>
    </div>
  );
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({
  ex, accent, onChange, onRemove,
}: {
  ex: SessionExercise; accent: string;
  onChange: (e: SessionExercise) => void;
  onRemove: () => void;
}) {
  const prCount   = ex.sets.filter(s => s.isPr).length;
  const doneCount = ex.sets.filter(s => s.completed).length;

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(22,24,28,0.92), rgba(10,11,13,0.96))",
      border: `1px solid ${ex.isKey ? accent + "55" : "rgba(255,255,255,0.07)"}`,
      borderLeft: `3px solid ${ex.isKey ? accent : "#1e2228"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)",
      borderRadius: 14, overflow: "hidden", marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontSize: "var(--fz-body)", fontWeight: 700, color: "#e8edf2" }}>{ex.name}</span>
            {ex.isKey && (
              <span style={{
                fontSize: "var(--fz-micro)", fontWeight: 800, color: accent,
                background: accent + "18", border: `1px solid ${accent}40`,
                borderRadius: 4, padding: "1px 5px",
              }}>★ КЛЮЧОВА</span>
            )}
            {prCount > 0 && (
              <span style={{
                fontSize: "var(--fz-micro)", fontWeight: 800, color: "#fbbf24",
                background: "#fbbf2418", border: "1px solid #fbbf2440",
                borderRadius: 4, padding: "1px 5px",
              }}>⚡ {prCount} PR</span>
            )}
          </div>
          <span style={{ fontSize: "var(--fz-xs)", color: "#3a4048" }}>
            {FOCUS_LABELS[ex.category]}
            {ex.equipment ? ` · ${ex.equipment}` : ""}
            {" · "}{doneCount}/{ex.sets.length} підходів
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <IconButton
            variant={ex.isKey ? "accent" : "ghost"}
            size="sm"
            title="Ключова вправа"
            onClick={() => onChange({ ...ex, isKey: !ex.isKey })}
          >★</IconButton>
          <IconButton variant="danger" size="sm" onClick={onRemove}>✕</IconButton>
        </div>
      </div>

      {/* Sets */}
      <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {ex.sets.map((s, si) => (
          <SetRow
            key={s.id} set={s} idx={si} accent={accent}
            onChange={ns => onChange({ ...ex, sets: ex.sets.map((x, xi) => xi === si ? ns : x) })}
            onRemove={() => onChange({ ...ex, sets: ex.sets.filter((_, xi) => xi !== si) })}
          />
        ))}

        <button
          onClick={() => onChange({ ...ex, sets: [...ex.sets, emptySet()] })}
          style={{
            marginTop: 2, padding: "7px 12px", borderRadius: 8,
            background: "none", border: "1px dashed #1e2228",
            color: "#3a4048", fontSize: "var(--fz-xs)", fontWeight: 600, cursor: "pointer",
          }}
        >+ Додати підхід</button>
      </div>
    </div>
  );
}

// ── Exercise Picker ───────────────────────────────────────────────────────────

const QUICK_CATS: { label: string; focus: Focus }[] = [
  { label: "Top Roll",      focus: "top_roll" },
  { label: "Hook",          focus: "hook" },
  { label: "Press",         focus: "press" },
  { label: "Pronation",     focus: "pronation" },
  { label: "Supination",    focus: "supination" },
  { label: "Cup",           focus: "cup" },
  { label: "Riser",         focus: "riser" },
  { label: "Back Pressure", focus: "back_pressure" },
  { label: "Side Pressure", focus: "side_pressure" },
  { label: "Grip",          focus: "grip" },
  { label: "Відновлення",   focus: "recovery" },
];

function ExercisePicker({
  open, exercises, accent, onPick, onClose,
}: {
  open: boolean; exercises: ExerciseDto[]; accent: string;
  onPick: (data: { name: string; category: Focus; exerciseId?: string }) => void;
  onClose: () => void;
}) {
  const [search,           setSearch]           = useState("");
  const [catFilter,        setCatFilter]        = useState<Focus | null>(null);
  const [customName,       setCustomName]       = useState("");
  const [showFavOnly,      setShowFavOnly]      = useState(false);
  const [favorites,        setFavorites]        = useState<Set<string>>(
    () => new Set(exercises.filter(e => e.isFavorite).map(e => e.id))
  );

  const toggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try { await trainingApi.toggleFavorite(id); }
    catch {
      setFavorites(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  };

  const filtered = exercises.filter(e => {
    if (showFavOnly && !favorites.has(e.id)) return false;
    const q = search.toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || (e.nameEn ?? "").toLowerCase().includes(q);
  }).slice(0, 50);

  return (
    <Modal open={open} onClose={onClose} title="Додати вправу" size="lg">
      <ModalBody pad={false}>
        {/* Search */}
        <div style={{ padding: "10px 20px 6px" }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук вправи..."
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "#111316", border: "1px solid #1e2228",
              color: "#e8edf2", fontSize: "var(--fz-sm)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filters row */}
        <div style={{ padding: "0 20px 10px", display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Chip
            active={showFavOnly}
            color="#f43f5e"
            onClick={() => setShowFavOnly(v => !v)}
          >♥ Улюблені{favorites.size > 0 ? ` · ${favorites.size}` : ""}</Chip>
          {QUICK_CATS.map(({ label, focus }) => (
            <Chip
              key={focus}
              active={catFilter === focus}
              color={accent}
              onClick={() => setCatFilter(catFilter === focus ? null : focus)}
            >{label}</Chip>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ padding: "0 20px 12px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#2a2e32", fontSize: "var(--fz-sm)" }}>
              {showFavOnly ? "Немає улюблених вправ" : "Нічого не знайдено"}
            </div>
          )}

          {filtered.map(e => {
            const isFav = favorites.has(e.id);
            return (
              <div
                key={e.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  borderBottom: "1px solid #0e1014",
                }}
              >
                <button
                  onClick={() => onPick({ name: e.name, category: "general", exerciseId: e.id })}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 6px 9px 10px", borderRadius: 9,
                    background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "#0c0e10", border: "1px solid #1a1e22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "var(--fz-body)", flexShrink: 0,
                  }}>💪</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fz-sm)", color: "#c8d0da", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name}
                    </div>
                    {e.nameEn && <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048" }}>{e.nameEn}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {e.tierRank && (
                      <span style={{ fontSize: "var(--fz-xs)", fontWeight: 800, color: "#fbbf24" }}>{e.tierRank}</span>
                    )}
                    {e.muscleGroup != null && (
                      <span style={{ fontSize: "var(--fz-micro)", color: "#2a2e32" }}>{MUSCLE_LABELS[e.muscleGroup]}</span>
                    )}
                  </div>
                </button>
                <button
                  onClick={ev => toggleFav(ev, e.id)}
                  title={isFav ? "Прибрати з улюблених" : "Додати до улюблених"}
                  style={{
                    width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                    background: "none", border: "none",
                    color: isFav ? "#f43f5e" : "#2a2e32",
                    fontSize: "var(--fz-body)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={ev => { ev.currentTarget.style.color = isFav ? "#fb7185" : "#5a6270"; }}
                  onMouseLeave={ev => { ev.currentTarget.style.color = isFav ? "#f43f5e" : "#2a2e32"; }}
                >{isFav ? "♥" : "♡"}</button>
              </div>
            );
          })}

          {/* Custom exercise entry */}
          <div style={{
            marginTop: 10, padding: "12px 14px",
            background: "#0c0e10", border: "1px solid #1a1e22", borderRadius: 10,
          }}>
            <div style={{ fontSize: "var(--fz-xs)", color: "#2a2e32", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
              ВЛАСНА ВПРАВА
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Назва вправи..."
                onKeyDown={e => {
                  if (e.key === "Enter" && customName.trim()) {
                    onPick({ name: customName.trim(), category: catFilter ?? "general" });
                    setCustomName("");
                  }
                }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  background: "#111316", border: "1px solid #1e2228",
                  color: "#e8edf2", fontSize: "var(--fz-sm)", outline: "none",
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (customName.trim()) {
                    onPick({ name: customName.trim(), category: catFilter ?? "general" });
                    setCustomName("");
                  }
                }}
              >Додати</Button>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

// ── Summary Panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ exercises, startTime }: { exercises: SessionExercise[]; startTime: number | null }) {
  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets  = exercises.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0);
  const totalVol  = exercises.reduce((s, e) =>
    s + e.sets.reduce((ss, set) =>
      ss + (set.completed && set.load && set.reps ? set.load * set.reps : 0), 0), 0);
  const prs       = exercises.reduce((s, e) => s + e.sets.filter(x => x.isPr).length, 0);
  const rpeVals   = exercises.flatMap(e => e.sets.filter(s => s.rpe != null).map(s => s.rpe!));
  const avgRpe    = rpeVals.length
    ? (rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length).toFixed(1)
    : null;
  const elapsed   = startTime ? Math.floor((Date.now() - startTime) / 60000) : null;

  const stats = [
    { label: "Вправ",      value: exercises.length },
    { label: "Підходів",   value: `${doneSets}/${totalSets}` },
    { label: "Обсяг",      value: totalVol > 0 ? `${totalVol.toLocaleString()} кг` : "—" },
    { label: "PR",         value: prs > 0 ? `⚡ ${prs}` : "—" },
    { label: "Сер. RPE",   value: avgRpe ?? "—" },
    { label: "Тривалість", value: elapsed != null ? `${elapsed} хв` : "—" },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(14,16,20,0.92), rgba(10,11,13,0.96))",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ fontSize: "var(--fz-xs)", color: "#2a2e32", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
        Підсумок сесії
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 0" }}>
        {stats.map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: "var(--fz-micro)", color: "#2a2e32", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "var(--fz-body)", fontWeight: 700, color: "#c8d0da", marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Post-workout Modal ────────────────────────────────────────────────────────

function PostWorkoutModal({
  open, accent, onSave, onClose,
}: {
  open: boolean; accent: string;
  onSave: (data: { rpe?: number; feeling?: number; note?: string }) => void;
  onClose: () => void;
}) {
  const [rpe,     setRpe]     = useState<number | undefined>();
  const [feeling, setFeeling] = useState<number | undefined>();
  const [note,    setNote]    = useState("");

  const Scale = ({
    label, value, onChange,
  }: { label: string; value?: number; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: "var(--fz-sm)", color: "#8a9ab0", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "var(--fz-sm)", fontWeight: 700, color: value != null ? accent : "#3a4048" }}>
          {value != null ? `${value}/10` : "—"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1, height: 30, borderRadius: 5, border: "none",
              background: (value ?? 0) >= n ? accent + "33" : "#111316",
              outline: `1px solid ${(value ?? 0) >= n ? accent + "60" : "#1e2228"}`,
              color: (value ?? 0) >= n ? accent : "#3a4048",
              fontSize: "var(--fz-xs)", fontWeight: 700, cursor: "pointer",
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Самопочуття після тренування" size="sm">
      <ModalBody>
        <Scale label="Складність (RPE)"      value={rpe}     onChange={setRpe} />
        <Scale label="Загальне самопочуття"   value={feeling} onChange={setFeeling} />

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: "var(--fz-sm)", color: "#8a9ab0", fontWeight: 600, marginBottom: 7 }}>Нотатка</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Що пройшло добре / що покращити..."
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              background: "#111316", border: "1px solid #1e2228",
              color: "#c8d0da", fontSize: "var(--fz-sm)", resize: "none", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose}>Пропустити</Button>
          <Button style={{ flex: 2 }} onClick={() => onSave({ rpe, feeling, note: note || undefined })}>
            Завершити тренування
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

// ── Completed Screen ──────────────────────────────────────────────────────────

function CompletedScreen({
  exercises, accent, onNew, onJournal,
}: {
  exercises: SessionExercise[]; accent: string;
  onNew: () => void; onJournal: () => void;
}) {
  const doneSets = exercises.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0);
  const totalVol = exercises.reduce((s, e) =>
    s + e.sets.reduce((ss, set) =>
      ss + (set.completed && set.load && set.reps ? set.load * set.reps : 0), 0), 0);
  const prs = exercises.flatMap(e =>
    e.sets.filter(s => s.isPr).map(s => ({ exerciseName: e.name, set: s })));

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{
        maxWidth: 380, width: "100%", textAlign: "center",
        background: "linear-gradient(180deg, rgba(22,24,28,0.92), rgba(10,11,13,0.96))",
        border: `1px solid ${accent}40`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px ${accent}12`,
        borderRadius: 20, padding: "36px 28px",
      }}>
        <div style={{ fontSize: "var(--fz-display)", marginBottom: 8 }}>⚡</div>
        <h2 style={{ fontSize: "var(--fz-h2)", fontWeight: 800, color: "#e8edf2", marginBottom: 6 }}>
          Тренування завершено!
        </h2>
        <p style={{ fontSize: "var(--fz-sm)", color: "#3a4048", marginBottom: 24 }}>
          {exercises.length} вправ · {doneSets} підходів
          {totalVol > 0 ? ` · ${totalVol.toLocaleString()} кг` : ""}
        </p>

        {prs.length > 0 && (
          <div style={{
            background: "#fbbf2410", border: "1px solid #fbbf2435",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left",
          }}>
            <div style={{ fontSize: "var(--fz-xs)", color: "#fbbf24", fontWeight: 800, letterSpacing: 0.8, marginBottom: 8 }}>
              ⚡ НОВІ РЕКОРДИ · {prs.length}
            </div>
            {prs.map((pr, i) => (
              <div key={i} style={{ fontSize: "var(--fz-sm)", color: "#c8d0da", padding: "2px 0" }}>
                {pr.exerciseName}
                {pr.set.load  ? ` · ${pr.set.load} кг`  : ""}
                {pr.set.reps  ? ` × ${pr.set.reps}`      : ""}
                {pr.set.holdSeconds ? ` · ${pr.set.holdSeconds}с` : ""}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button style={{ width: "100%" }} onClick={onJournal}>До журналу тренувань</Button>
          <Button variant="secondary" style={{ width: "100%" }} onClick={onNew}>Нове тренування</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NewSessionPage() {
  const router        = useRouter();
  const { accent: AC } = useTheme();
  const [ready,       setReady]       = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseDto[]>([]);

  // Session state
  const [date,        setDate]        = useState(todayStr);
  const [focuses,     setFocuses]     = useState<Focus[]>(["top_roll"]);
  const [status,      setStatus]      = useState<"draft" | "active" | "completed">("draft");
  const [exercises,   setExercises]   = useState<SessionExercise[]>([]);
  const [startTime,   setStartTime]   = useState<number | null>(null);

  // UI state
  const [showPicker,      setShowPicker]      = useState(false);
  const [showPostWorkout, setShowPostWorkout] = useState(false);
  const [done,            setDone]            = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setReady(true);
    trainingApi.getExercises().then(setAllExercises).catch(() => {});
  }, [router]);

  const toggleFocus = (f: Focus) => {
    setFocuses(prev =>
      prev.includes(f)
        ? prev.length > 1 ? prev.filter(x => x !== f) : prev
        : [...prev, f]
    );
  };

  const addExercise = (data: { name: string; category: Focus; exerciseId?: string }) => {
    setExercises(prev => [...prev, {
      id: uid(), exerciseId: data.exerciseId,
      name: data.name, category: data.category,
      order: prev.length, isKey: false, sets: [emptySet()],
    }]);
    setShowPicker(false);
    if (status === "draft") {
      setStatus("active");
      setStartTime(Date.now());
    }
  };

  const updateExercise = (id: string, updated: SessionExercise) =>
    setExercises(prev => prev.map(e => e.id === id ? updated : e));

  const removeExercise = (id: string) =>
    setExercises(prev => prev.filter(e => e.id !== id));

  const handleComplete = (postData: { rpe?: number; feeling?: number; note?: string }) => {
    const session = {
      id: uid(), date, focuses, status: "completed",
      exercises, startTime, endTime: Date.now(),
      postWorkout: postData, createdAt: new Date().toISOString(),
    };
    try {
      const saved: unknown[] = JSON.parse(localStorage.getItem("training_sessions") ?? "[]");
      saved.push(session);
      localStorage.setItem("training_sessions", JSON.stringify(saved));
    } catch { /* ignore */ }
    setStatus("completed");
    setShowPostWorkout(false);
    setDone(true);
  };

  const resetSession = () => {
    setDone(false); setExercises([]); setStatus("draft");
    setStartTime(null); setDate(todayStr());
  };

  if (!ready) return null;

  const isToday = date === todayStr();

  const statusColors: Record<string, string> = {
    draft: "#3a4048", active: AC, completed: "#34d399",
  };
  const statusLabels: Record<string, string> = {
    draft: "Чернетка", active: "Триває", completed: "Завершено",
  };

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── Sticky header ─────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(8,9,11,0.96)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #1a1e22",
          padding: "12px 32px",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <Button variant="ghost" size="sm" onClick={() => router.push("/training")}>← Назад</Button>

          <span style={{ fontSize: "var(--fz-body)", fontWeight: 800, color: "#e8edf2", flex: 1 }}>
            Нове тренування
          </span>

          {/* Date */}
          <div style={{ position: "relative" }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                padding: "6px 10px", borderRadius: 8,
                background: "#111316", border: "1px solid #1e2228",
                color: "#c8d0da", fontSize: "var(--fz-sm)", fontWeight: 600,
                outline: "none", cursor: "pointer",
              }}
            />
            {!isToday && (
              <span style={{
                position: "absolute", top: "100%", left: 0, marginTop: 3,
                fontSize: "var(--fz-micro)", color: "#f97316", fontWeight: 700, whiteSpace: "nowrap",
              }}>Додано заднім числом</span>
            )}
          </div>

          {/* Status */}
          <span style={{
            padding: "4px 12px", borderRadius: 20, fontSize: "var(--fz-xs)", fontWeight: 700,
            background: statusColors[status] + "22",
            border: `1px solid ${statusColors[status]}55`,
            color: statusColors[status],
          }}>
            {statusLabels[status]}
          </span>

          {/* Save draft */}
          <Button
            variant="secondary" size="sm"
            onClick={() => {
              try {
                localStorage.setItem("training_draft", JSON.stringify({ date, focuses, exercises, status }));
              } catch { /* ignore */ }
            }}
          >Зберегти чернетку</Button>

          {/* Complete */}
          <Button
            size="sm"
            disabled={exercises.length === 0}
            onClick={() => setShowPostWorkout(true)}
          >Завершити</Button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        {done ? (
          <CompletedScreen
            exercises={exercises} accent={AC}
            onNew={resetSession}
            onJournal={() => router.push("/training")}
          />
        ) : (
          <div style={{ padding: "20px 32px 80px", maxWidth: 1100 }}>

            {/* Focus chips */}
            <div style={{
              background: "linear-gradient(180deg, rgba(20,22,26,0.9), rgba(12,13,16,0.95))",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: "var(--fz-xs)", color: "#2a2e32", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
                Фокус тренування
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FOCUS_LIST.map(f => (
                  <Chip
                    key={f}
                    active={focuses.includes(f)}
                    color={AC}
                    onClick={() => toggleFocus(f)}
                  >{FOCUS_LABELS[f]}</Chip>
                ))}
              </div>
            </div>

            {/* Exercise list */}
            {exercises.length === 0 ? (
              <div style={{
                padding: "48px 20px", textAlign: "center",
                background: "rgba(14,16,20,0.5)",
                border: "1.5px dashed #1e2228", borderRadius: 14, marginBottom: 12,
              }}>
                <div style={{ fontSize: "var(--fz-display)", marginBottom: 10 }}>💪</div>
                <div style={{ fontSize: "var(--fz-body)", color: "#3a4048", fontWeight: 600, marginBottom: 4 }}>
                  Додай першу вправу
                </div>
                <div style={{ fontSize: "var(--fz-xs)", color: "#1e2228" }}>
                  Вибери з бібліотеки або введи власну
                </div>
              </div>
            ) : (
              exercises.map(ex => (
                <ExerciseCard
                  key={ex.id} ex={ex} accent={AC}
                  onChange={updated => updateExercise(ex.id, updated)}
                  onRemove={() => removeExercise(ex.id)}
                />
              ))
            )}

            {/* Add exercise */}
            <button
              onClick={() => setShowPicker(true)}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 12, marginBottom: 20,
                background: "none",
                border: `1.5px dashed ${AC}50`,
                color: AC, fontSize: "var(--fz-sm)", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >+ Додати вправу</button>

            {/* Summary */}
            {exercises.length > 0 && (
              <SummaryPanel exercises={exercises} startTime={startTime} />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExercisePicker
        open={showPicker}
        exercises={allExercises} accent={AC}
        onPick={addExercise}
        onClose={() => setShowPicker(false)}
      />
      <PostWorkoutModal
        open={showPostWorkout}
        accent={AC}
        onSave={handleComplete}
        onClose={() => setShowPostWorkout(false)}
      />
    </div>
  );
}
