"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/context/ThemeContext";
import {
  trainingApi, type MacroperiodDto, type MesocycleDto, type DayTemplateDto,
  GOAL_LABELS, MODE_LABELS, STYLE_LABELS, MUSCLE_LABELS, DAYS,
  ExerciseStyle, TrainingMode,
} from "@/lib/training";

const STYLE_COLORS: Record<number, string> = {
  0: "#84cc16", 1: "#60a5fa", 2: "#f97316", 3: "#a78bfa",
};
const MODE_COLORS: Record<number, string> = {
  [TrainingMode.Strength]:   "#ef4444",
  [TrainingMode.Volume]:     "#60a5fa",
  [TrainingMode.Endurance]:  "#34d399",
  [TrainingMode.Power]:      "#f97316",
  [TrainingMode.Technique]:  "#a78bfa",
  [TrainingMode.Competition]:"#fbbf24",
  [TrainingMode.Deload]:     "#6b7280",
};

function localDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmt(d: Date) {
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Mesocycle timeline bar ───────────────────────────────────────────────────

function Timeline({ period }: { period: MacroperiodDto }) {
  const total = period.weeksCount;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex", height: 28, borderRadius: 6, overflow: "hidden",
        border: "1px solid #1a1e22",
      }}>
        {period.mesocycles.map((ms, i) => {
          const pct = (ms.durationWeeks / total) * 100;
          const color = MODE_COLORS[ms.mode] ?? "#84cc16";
          return (
            <div key={i} title={`${ms.name} · ${ms.durationWeeks}т`} style={{
              width: `${pct}%`, background: color + "22",
              borderRight: i < period.mesocycles.length - 1 ? `1px solid ${color}40` : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: color,
              }} />
              <span style={{
                fontSize: "var(--fz-micro)", fontWeight: 700, color: color + "cc",
                letterSpacing: 0.3, whiteSpace: "nowrap", paddingLeft: 6,
              }}>
                {ms.name}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", marginTop: 4 }}>
        {period.mesocycles.map((ms, i) => {
          const pct = (ms.durationWeeks / total) * 100;
          return (
            <div key={i} style={{ width: `${pct}%`, textAlign: "center" }}>
              <span style={{ fontSize: "var(--fz-micro)", color: "#3a4048" }}>{ms.durationWeeks}т</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day template card ────────────────────────────────────────────────────────

function DayCard({ day, meso }: { day: DayTemplateDto; meso: MesocycleDto }) {
  const color = MODE_COLORS[meso.mode] ?? "#84cc16";
  const dayName = DAYS[(day.dayOfWeek - 1 + 7) % 7];
  return (
    <div style={{
      background: "#0c0e10", border: `1px solid #1a1e22`,
      borderRadius: 8, padding: "10px 12px",
      borderTop: `2px solid ${color}60`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6,
          background: color + "22", border: `1px solid ${color}50`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--fz-micro)", fontWeight: 800, color, flexShrink: 0,
        }}>{dayName}</span>
        <span style={{ fontSize: "var(--fz-xs)", fontWeight: 600, color: "#c8d0da" }}>
          {day.name || `День ${day.dayOfWeek}`}
        </span>
      </div>

      {day.blocks.length === 0 ? (
        <span style={{ fontSize: "var(--fz-xs)", color: "#2a2e32" }}>Вправи не додані</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {day.blocks.map((b, bi) => (
            <div key={bi} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 6px", borderRadius: 5,
              background: "#111316", border: "1px solid #1a1e22",
            }}>
              <span style={{
                fontSize: "var(--fz-micro)", color: "#3a4048", fontWeight: 700,
                minWidth: 14, textAlign: "right",
              }}>{bi + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fz-xs)", color: "#c8d0da", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.exercise?.name ?? "—"}
                </div>
                {b.exercise?.nameEn && (
                  <div style={{ fontSize: "var(--fz-micro)", color: "#3a4048" }}>{b.exercise.nameEn}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <span style={{
                  fontSize: "var(--fz-xs)", fontWeight: 700, color: "#8a9ab0",
                  background: "#161c22", borderRadius: 4, padding: "1px 5px",
                }}>{b.sets}×{b.reps}</span>
                {b.intensityPercent != null && (
                  <span style={{ fontSize: "var(--fz-micro)", color: color, fontWeight: 700 }}>
                    {b.intensityPercent}%
                  </span>
                )}
                {b.exercise?.muscleGroup != null && (
                  <span style={{
                    fontSize: "var(--fz-micro)", color: "#3a4048",
                    background: "#111316", borderRadius: 3, padding: "1px 4px",
                    border: "1px solid #1a1e22",
                  }}>{MUSCLE_LABELS[b.exercise.muscleGroup]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mesocycle section ────────────────────────────────────────────────────────

function MesoSection({ ms, pStart }: { ms: MesocycleDto; pStart: Date }) {
  const [open, setOpen] = useState(true);
  const color = MODE_COLORS[ms.mode] ?? "#84cc16";
  const msStart = new Date(pStart);
  msStart.setDate(msStart.getDate() + (ms.startWeek - 1) * 7);
  const msEnd = new Date(msStart);
  msEnd.setDate(msEnd.getDate() + ms.durationWeeks * 7 - 1);

  return (
    <div style={{
      border: `1px solid #1a1e22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, overflow: "hidden",
      marginBottom: 12,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", background: "#0c0e10",
          border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: color, flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, color: "#c8d0da", fontSize: "var(--fz-body)", flex: 1 }}>
          {ms.name}
        </span>
        <span style={{
          fontSize: "var(--fz-xs)", fontWeight: 700, color, background: color + "18",
          border: `1px solid ${color}40`, borderRadius: 5, padding: "2px 8px",
        }}>{MODE_LABELS[ms.mode]}</span>
        <span style={{ fontSize: "var(--fz-xs)", color: "#3a4048" }}>
          {ms.durationWeeks} тиж · {fmt(msStart)} — {fmt(msEnd)}
        </span>
        <span style={{ fontSize: "var(--fz-sm)", color: "#3a4048", marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", background: "#0a0c0e" }}>
          {ms.description && (
            <p style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginBottom: 12, paddingTop: 8 }}>
              {ms.description}
            </p>
          )}
          {ms.dayTemplates.length === 0 ? (
            <span style={{ fontSize: "var(--fz-xs)", color: "#2a2e32" }}>Тренувальних днів не додано</span>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8, paddingTop: 8,
            }}>
              {ms.dayTemplates
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((dt, di) => (
                  <DayCard key={di} day={dt} meso={ms} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrainingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { accent: AC } = useTheme();
  const [ready, setReady]   = useState(false);
  const [period, setPeriod] = useState<MacroperiodDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setReady(true);
    trainingApi.getMacroperiod(id)
      .then(setPeriod)
      .catch(() => router.push("/training"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Видалити макроперіод? Це незворотно.")) return;
    setDeleting(true);
    await trainingApi.deleteMacroperiod(id);
    router.push("/training");
  };

  if (!ready) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen relative z-10">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-muted text-sm">Завантаження...</div>
        </main>
      </div>
    );
  }

  if (!period) return null;

  const styleColor = STYLE_COLORS[period.focusStyle] ?? "#84cc16";
  const pStart = localDate(period.startDate);
  const pEnd = new Date(pStart);
  pEnd.setDate(pEnd.getDate() + period.weeksCount * 7);
  const totalBlocks = period.mesocycles.reduce(
    (s, ms) => s + ms.dayTemplates.reduce((ss, dt) => ss + dt.blocks.length, 0), 0
  );
  const trainDays = period.mesocycles.reduce(
    (s, ms) => s + ms.dayTemplates.length * ms.durationWeeks, 0
  );

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <main className="flex-1 p-8" style={{ maxWidth: 1100 }}>

        {/* Back */}
        <button
          onClick={() => router.push("/training")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#3a4048", fontSize: "var(--fz-sm)", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
            marginBottom: 20, letterSpacing: 0.3,
          }}
        >
          ← Всі плани
        </button>

        {/* Header */}
        <div style={{
          background: "#0c0e10", border: "1px solid #1a1e22",
          borderLeft: `4px solid ${styleColor}`,
          borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: "var(--fz-micro)", fontWeight: 800, letterSpacing: 1,
                  color: styleColor + "99", background: styleColor + "18",
                  border: `1px solid ${styleColor}40`,
                  borderRadius: 4, padding: "2px 6px",
                }}>МАКРОПЕРІОД</span>
                <Badge variant="neutral">{STYLE_LABELS[period.focusStyle]}</Badge>
                <Badge variant="neutral">{GOAL_LABELS[period.goal]}</Badge>
              </div>
              <h1 style={{ fontSize: "var(--fz-h1)", fontWeight: 800, color: "#e8edf2", marginBottom: 4 }}>
                {period.name}
              </h1>
              {period.description && (
                <p style={{ fontSize: "var(--fz-sm)", color: "#5a6270", marginTop: 4 }}>{period.description}</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: "var(--fz-sm)", fontWeight: 600,
                  background: "#1a0e0e", border: "1px solid #3a1a1a",
                  color: "#ef4444", cursor: "pointer",
                }}
              >
                {deleting ? "..." : "Видалити"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 24, marginTop: 16,
            paddingTop: 16, borderTop: "1px solid #1a1e22",
            flexWrap: "wrap",
          }}>
            {[
              { label: "Початок", value: fmt(pStart) },
              { label: "Кінець", value: fmt(pEnd) },
              { label: "Тривалість", value: `${period.weeksCount} тижнів` },
              { label: "Мезоциклів", value: period.mesocycles.length },
              { label: "Трен. днів/тиж", value: trainDays > 0 ? `~${(period.mesocycles.reduce((s,ms)=>s+ms.dayTemplates.length,0)/Math.max(period.mesocycles.length,1)).toFixed(1)}` : "—" },
              { label: "Вправ усього", value: totalBlocks || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "var(--fz-body)", fontWeight: 700, color: "#c8d0da", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {period.mesocycles.length > 0 && (
          <div style={{
            background: "#0c0e10", border: "1px solid #1a1e22",
            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
          }}>
            <div style={{
              fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.8,
              textTransform: "uppercase", marginBottom: 12,
            }}>Структура плану</div>
            <Timeline period={period} />
          </div>
        )}

        {/* Mesocycles */}
        <div style={{
          fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.8,
          textTransform: "uppercase", marginBottom: 12,
        }}>Мезоцикли</div>

        {period.mesocycles.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted text-sm">Мезоциклів немає</p>
          </Card>
        ) : (
          period.mesocycles
            .slice()
            .sort((a, b) => a.startWeek - b.startWeek)
            .map((ms, i) => (
              <MesoSection key={i} ms={ms} pStart={pStart} />
            ))
        )}
      </main>
    </div>
  );
}
