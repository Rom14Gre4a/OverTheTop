"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  PeriodGoal, TrainingMode, ExerciseStyle,
  GOAL_LABELS, MODE_LABELS, MODE_DESC, STYLE_LABELS, MUSCLE_LABELS, DAYS,
  autoSuggestMesocycles, trainingApi,
  type ExerciseDto, type MesocycleDto, type DayTemplateDto, type TrainingBlockDto,
} from "@/lib/training";

const STEPS = ["Макроперіод", "Мезоцикли", "Тренувальні дні", "Вправи"];

const TIER_TEXT: Record<string, string> = {
  S: "#ef4444", A: "#f97316", B: "#84cc16", C: "#60a5fa", D: "#a78bfa", F: "#666",
};

type DraftMeso  = Omit<MesocycleDto, "id">;
type DraftDay   = Omit<DayTemplateDto, "id">;
type DraftBlock = Omit<TrainingBlockDto, "id" | "exercise">;

export default function NewTrainingPlanPage() {
  const router = useRouter();
  const [step, setStep]      = useState(0);
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState("");

  // Step 1
  const [name, setName]           = useState("");
  const [goal, setGoal]           = useState<PeriodGoal>(PeriodGoal.Competition);
  const [focusStyle, setFocusStyle] = useState<ExerciseStyle>(ExerciseStyle.General);
  const [weeks, setWeeks]         = useState(12);
  const [startDate, setStartDate] = useState(today());
  const [desc, setDesc]           = useState("");

  // Step 2
  const [mesocycles, setMesocycles] = useState<DraftMeso[]>([]);

  // Step 3
  const [activeMeso, setActiveMeso] = useState(0);

  // Step 4
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [exFilter, setExFilter]   = useState<ExerciseStyle | "all">("all");
  const [pickState, setPickState] = useState<{ mesoIdx: number; dayIdx: number } | null>(null);
  const [blockModal, setBlockModal] = useState<{
    mesoIdx: number; dayIdx: number; blockIdx: number; data: DraftBlock;
  } | null>(null);

  useEffect(() => { if (!getToken()) router.push("/login"); }, [router]);
  const [exLoading, setExLoading] = useState(true);
  useEffect(() => {
    trainingApi.getExercises()
      .then(setExercises)
      .catch(() => {})
      .finally(() => setExLoading(false));
  }, []);

  // ── helpers ────────────────────────────────────────────
  const totalWeeksUsed = mesocycles.reduce((s, m) => s + m.durationWeeks, 0);
  const weeksLeft = weeks - totalWeeksUsed;

  const addMeso = () => {
    if (weeksLeft <= 0) return;
    setMesocycles(prev => [...prev, {
      name: `Фаза ${prev.length + 1}`,
      mode: TrainingMode.Volume,
      startWeek: totalWeeksUsed + 1,
      durationWeeks: Math.min(4, weeksLeft),
      description: "",
      dayTemplates: [],
    }]);
  };

  const updateMeso = (i: number, patch: Partial<DraftMeso>) =>
    setMesocycles(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const removeMeso = (i: number) =>
    setMesocycles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      let w = 1;
      return next.map(m => { const r = { ...m, startWeek: w }; w += m.durationWeeks; return r; });
    });

  const autoSuggest = () => {
    const suggested = autoSuggestMesocycles(goal, weeks).map(ms => ({
      ...ms, dayTemplates: [] as DraftDay[],
    }));
    setMesocycles(suggested);
  };

  const toggleDay = (mesoIdx: number, dow: number) => {
    const days = mesocycles[mesoIdx].dayTemplates;
    const exists = days.find(d => d.dayOfWeek === dow);
    updateMeso(mesoIdx, {
      dayTemplates: exists
        ? days.filter(d => d.dayOfWeek !== dow)
        : [...days, { dayOfWeek: dow, name: DAYS[dow - 1], blocks: [] }]
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    });
  };

  const addBlock = (mesoIdx: number, dayIdx: number, ex: ExerciseDto) => {
    const days = [...mesocycles[mesoIdx].dayTemplates];
    const blocks = [...days[dayIdx].blocks];
    const newBlock: DraftBlock = {
      exerciseId: ex.id, order: blocks.length + 1,
      sets: 4, reps: "8-12", restSeconds: 90,
    };
    blocks.push(newBlock);
    days[dayIdx] = { ...days[dayIdx], blocks };
    updateMeso(mesoIdx, { dayTemplates: days });
    setPickState(null);
  };

  const removeBlock = (mesoIdx: number, dayIdx: number, blockIdx: number) => {
    const days = [...mesocycles[mesoIdx].dayTemplates];
    const blocks = days[dayIdx].blocks.filter((_, i) => i !== blockIdx);
    days[dayIdx] = { ...days[dayIdx], blocks };
    updateMeso(mesoIdx, { dayTemplates: days });
  };

  const saveBlock = (patch: DraftBlock) => {
    if (!blockModal) return;
    const { mesoIdx, dayIdx, blockIdx } = blockModal;
    const days = [...mesocycles[mesoIdx].dayTemplates];
    const blocks = days[dayIdx].blocks.map((b, i) => i === blockIdx ? patch : b);
    days[dayIdx] = { ...days[dayIdx], blocks };
    updateMeso(mesoIdx, { dayTemplates: days });
    setBlockModal(null);
  };

  // ── submit ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await trainingApi.createMacroperiod({
        name, goal, focusStyle, startDate, weeksCount: weeks, description: desc,
        mesocycles: mesocycles.map(ms => ({
          ...ms,
          dayTemplates: ms.dayTemplates.map(dt => ({
            ...dt,
            blocks: dt.blocks.map(b => ({
              exerciseId: b.exerciseId, order: b.order, sets: b.sets,
              reps: b.reps, intensityPercent: b.intensityPercent,
              restSeconds: b.restSeconds, notes: b.notes,
            })),
          })),
        })),
      });
      router.push("/training");
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { errors?: Record<string, string[]>; title?: string; detail?: string } }; message?: string };
      const data = axErr?.response?.data;
      if (data?.errors) {
        const fieldNames: Record<string, string> = {
          name: "Назва", goal: "Мета", focusStyle: "Стиль", startDate: "Дата початку",
          weeksCount: "Тривалість", "$.goal": "Мета", "$.focusStyle": "Стиль"
        };
        const msgs = Object.entries(data.errors)
          .filter(([k]) => k !== "dto")
          .flatMap(([k, v]) => v.map(m => `${fieldNames[k] ?? k}: ${m}`))
          .join("\n");
        setError(msgs || data.title || "Помилка валідації. Перевір поля.");
      } else if (data?.title) {
        setError(data.title);
      } else if (axErr?.message?.toLowerCase().includes("network")) {
        setError("Сервер недоступний. Перевір підключення.");
      } else {
        setError("Помилка збереження. Спробуй ще.");
      }
    }
    finally { setSaving(false); }
  };

  const nextStep = () => {
    if (step === 0 && !name.trim()) { setError("Введи назву плану"); return; }
    if (step === 1 && mesocycles.length === 0) { setError("Додай хоча б один мезоцикл"); return; }
    setError(""); setStep(s => s + 1);
  };

  const filteredEx = exFilter === "all" ? exercises : exercises.filter(e => e.style === exFilter);
  const meso = mesocycles[activeMeso];

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <main className="flex-1 p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push("/training")} className="text-muted text-sm hover:text-foreground mb-3 flex items-center gap-1">
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-foreground">Конструктор плану</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition
                ${i === step ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold border border-[var(--accent)]/30"
                  : i < step ? "text-[var(--accent)]" : "text-muted"}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < step ? "bg-[var(--accent)] text-black" : i === step ? "border-2 border-[var(--accent)]" : "border border-[var(--border)]"}`}>
                  {i < step ? "✓" : i + 1}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[var(--border)] mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── STEP 0: Макроперіод ── */}
        {step === 0 && (
          <div className="space-y-5">
            <Card strong>
              <h2 className="font-semibold text-foreground mb-4">Загальна інформація</h2>
              <div className="space-y-4">
                <Input label="Назва плану" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Підготовка до чемпіонату 2026" />
                <Input label="Опис (необов'язково)" value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Коротко про цілі та підхід..." />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted text-xs font-medium uppercase tracking-wide block mb-1">Дата початку</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="text-muted text-xs font-medium uppercase tracking-wide block mb-1">Тривалість: {weeks} тижнів</label>
                    <input type="range" min={4} max={52} value={weeks} onChange={e => setWeeks(+e.target.value)}
                      className="w-full accent-[var(--accent)] mt-3" />
                    <div className="flex justify-between text-xs text-muted mt-1"><span>4</span><span>52</span></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card strong>
              <h2 className="font-semibold text-foreground mb-4">Мета і стиль</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-muted text-xs font-medium uppercase tracking-wide block mb-2">Мета періоду</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([PeriodGoal.Competition, PeriodGoal.Offseason, PeriodGoal.Strength,
                       PeriodGoal.Volume, PeriodGoal.Technique, PeriodGoal.Rehabilitation]).map(g => (
                      <OptionButton key={g} active={goal === g} onClick={() => setGoal(g)}>
                        {GOAL_LABELS[g]}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-muted text-xs font-medium uppercase tracking-wide block mb-2">Фокус стилю</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([ExerciseStyle.TopRoll, ExerciseStyle.Hook, ExerciseStyle.Press, ExerciseStyle.General]).map(s => (
                      <OptionButton key={s} active={focusStyle === s} onClick={() => setFocusStyle(s)}>
                        {STYLE_LABELS[s]}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── STEP 1: Мезоцикли ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Timeline */}
            <Card strong>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Розподіл тижнів</h2>
                <span className="text-xs text-muted">{totalWeeksUsed}/{weeks} тижнів розподілено</span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden gap-px">
                {mesocycles.map((ms, i) => {
                  const pct = (ms.durationWeeks / weeks) * 100;
                  const colors = ["bg-[var(--accent)]","bg-blue-500","bg-purple-500","bg-green-500","bg-pink-500"];
                  return (
                    <div key={i} className={`${colors[i % colors.length]} flex items-center justify-center text-xs font-bold text-black opacity-80`}
                      style={{ width: `${pct}%` }} title={ms.name}>
                      {ms.durationWeeks}т
                    </div>
                  );
                })}
                {weeksLeft > 0 && (
                  <div className="flex-1 bg-[var(--surface)] flex items-center justify-center text-xs text-muted">
                    {weeksLeft}т вільно
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={autoSuggest}>✨ Авто-розподіл</Button>
              <Button variant="secondary" onClick={addMeso} disabled={weeksLeft <= 0}>+ Додати фазу</Button>
            </div>

            <div className="space-y-3">
              {mesocycles.map((ms, i) => (
                <MesocycleEditor key={i} meso={ms} index={i}
                  maxWeeks={ms.durationWeeks + weeksLeft}
                  onChange={patch => updateMeso(i, patch)}
                  onRemove={() => removeMeso(i)} />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Тренувальні дні ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Meso tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mesocycles.map((ms, i) => (
                <button key={i} onClick={() => setActiveMeso(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition
                    ${activeMeso === i ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                      : "glass border-[var(--border)] text-muted hover:text-foreground"}`}>
                  {ms.name}
                  <span className="ml-2 text-xs opacity-60">{ms.durationWeeks}т</span>
                </button>
              ))}
            </div>

            {meso && (
              <Card strong>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="accent">{MODE_LABELS[meso.mode]}</Badge>
                  <span className="text-muted text-xs">{MODE_DESC[meso.mode]}</span>
                </div>
                <label className="text-muted text-xs font-medium uppercase tracking-wide block mb-3">
                  Тренувальні дні тижня
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((d, i) => {
                    const dow = i + 1;
                    const active = meso.dayTemplates.some(t => t.dayOfWeek === dow);
                    return (
                      <button key={dow} onClick={() => toggleDay(activeMeso, dow)}
                        className={`py-3 rounded-xl text-sm font-medium border transition flex flex-col items-center gap-1
                          ${active ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)] glow-sm"
                            : "glass border-[var(--border)] text-muted hover:border-[var(--border-strong)]"}`}>
                        <span>{d}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
                      </button>
                    );
                  })}
                </div>

                {meso.dayTemplates.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {meso.dayTemplates.map((dt, di) => (
                      <div key={di} className="flex items-center gap-3 p-2 glass rounded-xl border-[var(--border)]">
                        <span className="text-[var(--accent)] font-bold text-sm w-6 text-center">
                          {DAYS[dt.dayOfWeek - 1]}
                        </span>
                        <input
                          value={dt.name}
                          onChange={e => {
                            const days = [...meso.dayTemplates];
                            days[di] = { ...days[di], name: e.target.value };
                            updateMeso(activeMeso, { dayTemplates: days });
                          }}
                          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                          placeholder="Назва тренування..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ── STEP 3: Вправи ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mesocycles.map((ms, i) => (
                <button key={i} onClick={() => setActiveMeso(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition
                    ${activeMeso === i ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                      : "glass border-[var(--border)] text-muted hover:text-foreground"}`}>
                  {ms.name}
                </button>
              ))}
            </div>

            {meso && (
              <div className="space-y-4">
                {meso.dayTemplates.length === 0 ? (
                  <Card className="text-center py-8 text-muted text-sm">
                    У цій фазі немає тренувальних днів. Поверніться на крок 3.
                  </Card>
                ) : meso.dayTemplates.map((dt, dayIdx) => (
                  <Card key={dayIdx} strong>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--accent)] font-bold">{DAYS[dt.dayOfWeek - 1]}</span>
                        <h3 className="font-semibold text-foreground">{dt.name}</h3>
                      </div>
                      <Button variant="secondary" size="sm"
                        onClick={() => setPickState({ mesoIdx: activeMeso, dayIdx })}>
                        + Вправа
                      </Button>
                    </div>

                    {dt.blocks.length === 0 ? (
                      <p className="text-muted text-sm text-center py-4">Вправ ще немає</p>
                    ) : (
                      <div className="space-y-2">
                        {dt.blocks.map((b, bi) => {
                          const ex = exercises.find(e => e.id === b.exerciseId);
                          return (
                            <div key={bi} className="flex items-center gap-3 p-3 glass rounded-xl border-[var(--border)]">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{ex?.name ?? "?"}</p>
                                  {ex?.tierRank && (
                                    <span style={{ color: TIER_TEXT[ex.tierRank], fontSize: "var(--fz-micro)", fontWeight: 700,
                                      border: `1px solid ${TIER_TEXT[ex.tierRank]}55`,
                                      background: `${TIER_TEXT[ex.tierRank]}18`,
                                      borderRadius: 3, padding: "1px 5px", lineHeight: 1.6 }}>
                                      {ex.tierRank}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted mt-0.5">
                                  {b.sets}×{b.reps}
                                  {b.intensityPercent ? ` · ${b.intensityPercent}%` : ""}
                                  {b.restSeconds ? ` · ${b.restSeconds}с` : ""}
                                </p>
                              </div>
                              <Badge variant="neutral">{ex ? STYLE_LABELS[ex.style] : ""}</Badge>
                              <button
                                onClick={() => setBlockModal({
                                  mesoIdx: activeMeso, dayIdx, blockIdx: bi,
                                  data: { ...b },
                                })}
                                className="text-muted hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-hover)]">
                                ✎
                              </button>
                              <button onClick={() => removeBlock(activeMeso, dayIdx, bi)}
                                className="text-muted hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10">
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => step === 0 ? router.push("/training") : setStep(s => s - 1)}>
            ← {step === 0 ? "Скасувати" : "Назад"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} glow>Далі →</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} glow>
              {saving ? "Зберігаємо..." : "💾 Зберегти план"}
            </Button>
          )}
        </div>
      </main>

      {/* Exercise picker modal */}
      <Modal open={!!pickState} onClose={() => setPickState(null)} title="Обери вправу">
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["all", ExerciseStyle.TopRoll, ExerciseStyle.Hook, ExerciseStyle.Press, ExerciseStyle.General] as const).map(f => (
            <button key={f} onClick={() => setExFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition font-medium
                ${exFilter === f ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                  : "glass border-[var(--border)] text-muted hover:border-[var(--border-strong)]"}`}>
              {f === "all" ? "Всі" : STYLE_LABELS[f]}
            </button>
          ))}
        </div>
        {exLoading && (
          <p className="text-muted text-sm text-center py-6">Завантаження вправ...</p>
        )}
        {!exLoading && filteredEx.length === 0 && (
          <p className="text-muted text-sm text-center py-6">Вправи не знайдено</p>
        )}
        <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredEx.map(ex => {
            const styleIcon: Record<number, string> = { 0: "🔄", 1: "✊", 2: "👊", 3: "💪" };
            const tc = ex.tierRank ? {
              text: TIER_TEXT[ex.tierRank],
              bg: TIER_TEXT[ex.tierRank] + "18",
              border: TIER_TEXT[ex.tierRank] + "55",
            } : null;
            return (
              <button key={ex.id}
                onClick={() => pickState && addBlock(pickState.mesoIdx, pickState.dayIdx, ex)}
                style={{
                  background: tc ? tc.bg : "var(--surface)",
                  border: `1px solid ${tc ? tc.border : "var(--border)"}`,
                }}
                className="text-left p-3 rounded-xl transition hover:brightness-110 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-base">{styleIcon[ex.style] ?? "💪"}</span>
                  {ex.tierRank && (
                    <span style={{ color: tc?.text, borderColor: tc?.border, background: tc?.bg }}
                      className="text-[10px] font-bold border rounded px-1.5 py-0.5 leading-none">
                      {ex.tierRank}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{ex.name}</p>
                <p className="text-[10px] text-muted leading-snug line-clamp-2">{ex.description}</p>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Block editor modal */}
      {blockModal && (
        <BlockEditorModal
          data={blockModal.data}
          exerciseName={exercises.find(e => e.id === blockModal.data.exerciseId)?.name ?? ""}
          onSave={saveBlock}
          onClose={() => setBlockModal(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────

function OptionButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2.5 rounded-xl text-sm border transition text-left
        ${active ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
          : "glass border-[var(--border)] text-muted hover:border-[var(--border-strong)] hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function MesocycleEditor({ meso, index, maxWeeks, onChange, onRemove }: {
  meso: DraftMeso; index: number; maxWeeks: number;
  onChange: (p: Partial<DraftMeso>) => void; onRemove: () => void;
}) {
  const modeColors = [
    "border-blue-500/40 bg-blue-500/5",
    "border-purple-500/40 bg-purple-500/5",
    "border-green-500/40 bg-green-500/5",
    "border-pink-500/40 bg-pink-500/5",
    "border-yellow-500/40 bg-yellow-500/5",
  ];
  return (
    <div className={`p-4 rounded-2xl border ${modeColors[index % modeColors.length]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <input value={meso.name} onChange={e => onChange({ name: e.target.value })}
              className="flex-1 bg-transparent text-foreground font-semibold text-sm outline-none border-b border-[var(--border)] pb-1 focus:border-[var(--accent)]"
              placeholder="Назва фази" />
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs">тижнів:</span>
              <input type="number" min={1} max={maxWeeks} value={meso.durationWeeks}
                onChange={e => onChange({ durationWeeks: Math.max(1, Math.min(maxWeeks, +e.target.value)) })}
                className="w-14 bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-lg px-2 py-1 text-sm text-center outline-none focus:border-[var(--accent)]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {([TrainingMode.Volume, TrainingMode.Strength, TrainingMode.Endurance,
               TrainingMode.Power, TrainingMode.Technique, TrainingMode.Competition, TrainingMode.Deload] as const).map(m => (
              <button key={m} onClick={() => onChange({ mode: m })}
                className={`px-2 py-1.5 rounded-lg text-xs border transition text-center
                  ${meso.mode === m ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                    : "glass border-[var(--border)] text-muted hover:border-[var(--border-strong)]"}`}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">{MODE_DESC[meso.mode]}</p>
        </div>

        <button onClick={onRemove} className="text-muted hover:text-red-400 transition p-1 rounded-lg hover:bg-red-500/10">✕</button>
      </div>
    </div>
  );
}

function BlockEditorModal({ data, exerciseName, onSave, onClose }: {
  data: DraftBlock; exerciseName: string;
  onSave: (b: DraftBlock) => void; onClose: () => void;
}) {
  const [d, setD] = useState(data);
  return (
    <Modal open title={exerciseName} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-muted text-xs uppercase tracking-wide block mb-1">Підходи</label>
            <input type="number" min={1} max={20} value={d.sets}
              onChange={e => setD(p => ({ ...p, sets: +e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wide block mb-1">Повторення</label>
            <input value={d.reps} placeholder="8-12 або max"
              onChange={e => setD(p => ({ ...p, reps: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wide block mb-1">Інтенсивність %</label>
            <input type="number" min={0} max={100} value={d.intensityPercent ?? ""}
              onChange={e => setD(p => ({ ...p, intensityPercent: e.target.value ? +e.target.value : undefined }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wide block mb-1">Відпочинок (сек)</label>
            <input type="number" min={0} value={d.restSeconds ?? ""}
              onChange={e => setD(p => ({ ...p, restSeconds: e.target.value ? +e.target.value : undefined }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
        </div>
        <div>
          <label className="text-muted text-xs uppercase tracking-wide block mb-1">Нотатки</label>
          <textarea value={d.notes ?? ""} rows={2}
            onChange={e => setD(p => ({ ...p, notes: e.target.value }))}
            className="w-full bg-[var(--surface)] border border-[var(--border)] text-foreground rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none" />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Скасувати</Button>
          <Button className="flex-1" onClick={() => onSave(d)} glow>Зберегти</Button>
        </div>
      </div>
    </Modal>
  );
}

function today() {
  return new Date().toISOString().split("T")[0];
}
