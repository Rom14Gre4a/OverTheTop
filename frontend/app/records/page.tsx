"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  trainingApi,
  type PersonalRecordDto,
  type CreatePersonalRecordDto,
  type ExerciseDto,
  ExerciseStyle,
  STYLE_LABELS,
  MUSCLE_LABELS,
} from "@/lib/training";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AC = "var(--color-accent)";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ExGroup {
  exerciseId: string;
  exerciseName: string;
  style: ExerciseStyle;
  records: PersonalRecordDto[];
  best: PersonalRecordDto;
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function ExerciseCard({ g, onClick }: { g: ExGroup; onClick: () => void }) {
  const styleColor: Record<ExerciseStyle, string> = {
    [ExerciseStyle.TopRoll]: "#34d399",
    [ExerciseStyle.Hook]:    "#60a5fa",
    [ExerciseStyle.Press]:   "#f472b6",
    [ExerciseStyle.General]: "#a78bfa",
  };
  const col = styleColor[g.style];

  return (
    <div
      onClick={onClick}
      style={{
        background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 14,
        padding: "16px 18px", cursor: "pointer", transition: "all 0.15s",
        display: "flex", flexDirection: "column", gap: 10,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = col + "44";
        e.currentTarget.style.boxShadow = `0 0 20px ${col}15`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#1a1a1a";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: "#e0e0e0", fontWeight: 700, fontSize: "var(--fz-sm)", lineHeight: 1.3, flex: 1 }}>
          {g.exerciseName}
        </span>
        <span style={{
          fontSize: "var(--fz-xs)", padding: "2px 8px", borderRadius: 6, flexShrink: 0,
          background: col + "18", color: col, border: `1px solid ${col}33`,
        }}>
          {STYLE_LABELS[g.style]}
        </span>
      </div>

      {/* Best record */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: col, fontWeight: 800, fontSize: "var(--fz-h2)", lineHeight: 1 }}>
          {g.best.weightKg}
        </span>
        <span style={{ color: "#555", fontSize: "var(--fz-xs)" }}>кг</span>
        <span style={{ color: "#444", fontSize: "var(--fz-sm)", marginLeft: 4 }}>×</span>
        <span style={{ color: "#bbb", fontWeight: 700, fontSize: "var(--fz-body)" }}>
          {g.best.reps}
        </span>
        <span style={{ color: "#555", fontSize: "var(--fz-xs)" }}>повт</span>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#444", fontSize: "var(--fz-xs)" }}>
          🏆 {fmtDate(g.best.date)}
        </span>
        <span style={{ color: "#333", fontSize: "var(--fz-xs)" }}>
          {g.records.length} {g.records.length === 1 ? "запис" : g.records.length < 5 ? "записи" : "записів"} →
        </span>
      </div>
    </div>
  );
}

// ─── HistoryModal ─────────────────────────────────────────────────────────────

function HistoryModal({
  g, onClose, onDelete,
}: {
  g: ExGroup;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...g.records].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 18,
        width: "100%", maxWidth: 480, maxHeight: "80vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#e0e0e0", fontWeight: 700, fontSize: "var(--fz-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {g.exerciseName}
            </div>
            <div style={{ color: "#555", fontSize: "var(--fz-xs)", marginTop: 2 }}>
              {STYLE_LABELS[g.style]} · {g.records.length} {g.records.length === 1 ? "запис" : "записів"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#444",
            fontSize: "var(--fz-h2)", cursor: "pointer", lineHeight: 1, padding: 4, flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >✕</button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {sorted.map((r, i) => (
            <div key={r.id} style={{
              padding: "12px 20px", borderBottom: "1px solid #111",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              {i === 0 && (
                <span style={{ fontSize: "var(--fz-body)", flexShrink: 0 }}>🏆</span>
              )}
              {i > 0 && (
                <span style={{ color: "#333", fontSize: "var(--fz-sm)", width: 20, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ color: i === 0 ? AC : "#bbb", fontWeight: 700, fontSize: "var(--fz-body)" }}>
                    {r.weightKg} кг
                  </span>
                  <span style={{ color: "#444", fontSize: "var(--fz-xs)" }}>×</span>
                  <span style={{ color: "#aaa", fontSize: "var(--fz-sm)" }}>{r.reps} повт</span>
                </div>
                {r.notes && (
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", marginTop: 2 }}>{r.notes}</div>
                )}
              </div>
              <span style={{ color: "#444", fontSize: "var(--fz-xs)", flexShrink: 0 }}>{fmtDate(r.date)}</span>
              <button
                onClick={() => onDelete(r.id)}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "#161616", border: "1px solid #252525",
                  color: "#444", fontSize: "var(--fz-sm)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444440"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#252525"; }}
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AddModal ─────────────────────────────────────────────────────────────────

function AddModal({
  exercises, onClose, onSave,
}: {
  exercises: ExerciseDto[];
  onClose: () => void;
  onSave: (dto: CreatePersonalRecordDto) => Promise<void>;
}) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [weightKg, setWeightKg]     = useState("");
  const [reps, setReps]             = useState("");
  const [date, setDate]             = useState(todayIso());
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const INP: React.CSSProperties = {
    width: "100%", background: "#111", border: "1px solid #1e1e1e",
    borderRadius: 8, padding: "8px 12px", color: "#ccc",
    fontSize: "var(--fz-sm)", boxSizing: "border-box", outline: "none",
  };

  const canSave = exerciseId && weightKg && reps && date;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        exerciseId,
        weightKg: parseFloat(weightKg),
        reps: parseInt(reps),
        date,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 18,
        width: "100%", maxWidth: 440, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <span style={{ color: "#e0e0e0", fontWeight: 700, fontSize: "var(--fz-body)", flex: 1 }}>
            🏆 Новий рекорд
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#444",
            fontSize: "var(--fz-h2)", cursor: "pointer", lineHeight: 1, padding: 4,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Exercise picker */}
          <div>
            <label style={{ color: "#666", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Вправа
            </label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Пошук вправи..."
              style={{ ...INP, marginBottom: 6 }}
            />
            <div style={{
              maxHeight: 160, overflowY: "auto",
              background: "#111", border: "1px solid #1a1a1a", borderRadius: 8,
            }}>
              {filtered.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => { setExerciseId(ex.id); setSearch(""); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer",
                    background: exerciseId === ex.id ? "rgba(139,92,246,0.12)" : "transparent",
                    color: exerciseId === ex.id ? "#a78bfa" : "#bbb",
                    fontSize: "var(--fz-sm)", borderBottom: "1px solid #161616",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (exerciseId !== ex.id) e.currentTarget.style.background = "#1a1a1a"; }}
                  onMouseLeave={e => { if (exerciseId !== ex.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {ex.name}
                  <span style={{ color: "#444", fontSize: "var(--fz-xs)", marginLeft: 8 }}>{STYLE_LABELS[ex.style]}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "12px", color: "#444", fontSize: "var(--fz-sm)", textAlign: "center" }}>
                  Нічого не знайдено
                </div>
              )}
            </div>
          </div>

          {/* Weight + reps */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#666", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Вага (кг)
              </label>
              <input
                type="number" step="0.5" min="0"
                value={weightKg} onChange={e => setWeightKg(e.target.value)}
                placeholder="50"
                style={{ ...INP, width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#666", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Повторення
              </label>
              <input
                type="number" min="1"
                value={reps} onChange={e => setReps(e.target.value)}
                placeholder="5"
                style={{ ...INP, width: "100%" }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ color: "#666", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Дата
            </label>
            <input
              type="date"
              value={date} onChange={e => setDate(e.target.value)}
              style={{ ...INP }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ color: "#666", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Нотатки (опційно)
            </label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Умови, коментар..."
              style={{ ...INP, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
              background: canSave ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#1a1a1a",
              color: canSave ? "#fff" : "#333",
              fontWeight: 700, fontSize: "var(--fz-sm)",
              cursor: canSave ? "pointer" : "not-allowed",
              boxShadow: canSave ? "0 0 20px rgba(124,58,237,0.3)" : "none",
            }}
          >
            {saving ? "Збереження..." : "Зберегти рекорд"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const [records, setRecords]       = useState<PersonalRecordDto[]>([]);
  const [exercises, setExercises]   = useState<ExerciseDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [styleFilter, setStyleFilter] = useState<ExerciseStyle | null>(null);
  const [historyGroup, setHistoryGroup] = useState<ExGroup | null>(null);
  const [addOpen, setAddOpen]       = useState(false);

  useEffect(() => {
    Promise.all([trainingApi.getRecords(), trainingApi.getExercises()])
      .then(([recs, exs]) => { setRecords(recs); setExercises(exs); })
      .finally(() => setLoading(false));
  }, []);

  // Group records by exercise
  const groups = useMemo<ExGroup[]>(() => {
    const map = new Map<string, ExGroup>();
    for (const r of records) {
      if (!map.has(r.exerciseId)) {
        map.set(r.exerciseId, {
          exerciseId: r.exerciseId,
          exerciseName: r.exerciseName,
          style: r.style,
          records: [],
          best: r,
        });
      }
      const g = map.get(r.exerciseId)!;
      g.records.push(r);
      if (r.weightKg > g.best.weightKg || (r.weightKg === g.best.weightKg && r.reps > g.best.reps)) {
        g.best = r;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.best.date.localeCompare(a.best.date));
  }, [records]);

  const filtered = styleFilter !== null
    ? groups.filter(g => g.style === styleFilter)
    : groups;

  // Summary stats
  const totalPRs   = records.length;
  const lastPR     = records.reduce<PersonalRecordDto | null>((acc, r) => {
    if (!acc || r.date > acc.date) return r;
    return acc;
  }, null);
  const bestImprov = useMemo(() => {
    let best: { name: string; pct: number } | null = null;
    for (const g of groups) {
      if (g.records.length < 2) continue;
      const sorted = [...g.records].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0].weightKg;
      const last  = sorted[sorted.length - 1].weightKg;
      if (first > 0) {
        const pct = Math.round(((last - first) / first) * 100);
        if (pct > 0 && (!best || pct > best.pct)) {
          best = { name: g.exerciseName, pct };
        }
      }
    }
    return best;
  }, [groups]);

  const handleDelete = async (id: string) => {
    await trainingApi.deleteRecord(id);
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    if (historyGroup) {
      const updated = { ...historyGroup, records: historyGroup.records.filter(r => r.id !== id) };
      if (updated.records.length === 0) setHistoryGroup(null);
      else {
        updated.best = updated.records.reduce((a, b) =>
          b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a
        );
        setHistoryGroup(updated);
      }
    }
  };

  const handleAdd = async (dto: CreatePersonalRecordDto) => {
    const created = await trainingApi.createRecord(dto);
    setRecords(prev => [created, ...prev]);
  };

  const STYLE_FILTERS: { value: ExerciseStyle | null; label: string }[] = [
    { value: null,                  label: "Всі" },
    { value: ExerciseStyle.TopRoll, label: "Top Roll" },
    { value: ExerciseStyle.Hook,    label: "Hook" },
    { value: ExerciseStyle.Press,   label: "Press" },
    { value: ExerciseStyle.General, label: "Загальний" },
  ];

  return (
    <>
      {historyGroup && (
        <HistoryModal
          g={historyGroup}
          onClose={() => setHistoryGroup(null)}
          onDelete={handleDelete}
        />
      )}
      {addOpen && (
        <AddModal
          exercises={exercises}
          onClose={() => setAddOpen(false)}
          onSave={handleAdd}
        />
      )}

      <div className="flex min-h-screen relative z-10">
        <Sidebar />

        <main style={{ flex: 1, background: "#080808", minHeight: "100vh", overflowY: "auto" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "var(--fz-h1)", margin: 0 }}>
                  🥇 Рекорди
                </h1>
                <p style={{ color: "#444", fontSize: "var(--fz-sm)", margin: "4px 0 0" }}>
                  Особисті рекорди по вправах
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "#fff", fontWeight: 700, fontSize: "var(--fz-sm)",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(124,58,237,0.35)",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.35)")}
              >
                + Новий рекорд
              </button>
            </div>

            {/* Summary cards */}
            {!loading && records.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                    Всього записів
                  </div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: "var(--fz-h2)" }}>{totalPRs}</div>
                  <div style={{ color: "#444", fontSize: "var(--fz-xs)", marginTop: 4 }}>по {groups.length} вправах</div>
                </div>

                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                    Останній рекорд
                  </div>
                  {lastPR ? (
                    <>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "var(--fz-sm)", lineHeight: 1.3 }}>
                        {lastPR.exerciseName}
                      </div>
                      <div style={{ color: AC, fontWeight: 700, fontSize: "var(--fz-body)", marginTop: 4 }}>
                        {lastPR.weightKg} кг × {lastPR.reps} повт
                      </div>
                      <div style={{ color: "#444", fontSize: "var(--fz-xs)", marginTop: 2 }}>{fmtDate(lastPR.date)}</div>
                    </>
                  ) : (
                    <div style={{ color: "#444", fontSize: "var(--fz-sm)" }}>—</div>
                  )}
                </div>

                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ color: "#555", fontSize: "var(--fz-xs)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                    Найбільший прогрес
                  </div>
                  {bestImprov ? (
                    <>
                      <div style={{ color: "#34d399", fontWeight: 800, fontSize: "var(--fz-h2)" }}>+{bestImprov.pct}%</div>
                      <div style={{ color: "#555", fontSize: "var(--fz-xs)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {bestImprov.name}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#444", fontSize: "var(--fz-sm)" }}>Потрібно 2+ записи</div>
                  )}
                </div>
              </div>
            )}

            {/* Filter chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {STYLE_FILTERS.map(f => {
                const active = styleFilter === f.value;
                return (
                  <button
                    key={String(f.value)}
                    onClick={() => setStyleFilter(f.value)}
                    style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: "var(--fz-sm)",
                      cursor: "pointer", transition: "all 0.15s", fontWeight: active ? 600 : 400,
                      border: `1px solid ${active ? "rgba(139,92,246,0.5)" : "#1e1e1e"}`,
                      background: active ? "rgba(139,92,246,0.15)" : "transparent",
                      color: active ? "#a78bfa" : "#555",
                    }}
                  >{f.label}</button>
                );
              })}
              {filtered.length > 0 && (
                <span style={{ marginLeft: "auto", color: "#333", fontSize: "var(--fz-xs)", alignSelf: "center" }}>
                  {filtered.length} вправ
                </span>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#333", fontSize: "var(--fz-sm)" }}>
                Завантаження...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "80px 0",
                border: "1px dashed #1a1a1a", borderRadius: 16,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🥇</div>
                <div style={{ color: "#444", fontSize: "var(--fz-body)", fontWeight: 600, marginBottom: 8 }}>
                  {styleFilter !== null ? "Немає рекордів для цього стилю" : "Поки що немає рекордів"}
                </div>
                <div style={{ color: "#333", fontSize: "var(--fz-sm)", marginBottom: 24 }}>
                  Натисни «+ Новий рекорд» щоб додати перший
                </div>
                <button
                  onClick={() => setAddOpen(true)}
                  style={{
                    padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(139,92,246,0.3)",
                    background: "rgba(139,92,246,0.1)", color: "#a78bfa",
                    fontWeight: 600, fontSize: "var(--fz-sm)", cursor: "pointer",
                  }}
                >+ Додати рекорд</button>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}>
                {filtered.map(g => (
                  <ExerciseCard key={g.exerciseId} g={g} onClick={() => setHistoryGroup(g)} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
