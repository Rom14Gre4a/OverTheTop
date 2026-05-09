"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalBody } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import {
  trainingApi, type MacroperiodDto,
  GOAL_LABELS, STYLE_LABELS,
} from "@/lib/training";
import { TRAINING_ARTICLES, type TrainingArticle } from "@/lib/trainingArticles";
import { Chip } from "@/components/ui";

// ─── Constants ───────────────────────────────────────────────────────────────

const STYLE_COLORS: Record<number, string> = {
  0: "#84cc16",
  1: "#60a5fa",
  2: "#f97316",
  3: "#a78bfa",
};
const MONTH_UA = ["Січ","Лют","Бер","Кві","Тра","Чер","Лип","Сер","Вер","Жов","Лис","Гру"];

function localDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── Day popup ────────────────────────────────────────────────────────────────

interface DaySession { id: string; date: string; exercises: unknown[]; status: string }

function DayModal({
  dateKey, onClose, accent,
}: { dateKey: string | null; onClose: () => void; accent: string }) {
  const router = useRouter();
  const [session, setSession] = useState<DaySession | null>(null);

  useEffect(() => {
    if (!dateKey) return;
    try {
      const all: DaySession[] = JSON.parse(localStorage.getItem("training_sessions") ?? "[]");
      setSession(all.find(s => s.date === dateKey) ?? null);
    } catch { setSession(null); }
  }, [dateKey]);

  const d = dateKey ? new Date(dateKey + "T00:00:00") : null;
  const label = d ? d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", weekday: "long" }) : "";

  return (
    <Modal open={!!dateKey} onClose={onClose} size="sm">
      <ModalBody>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
            {label}
          </div>
          {session ? (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: "#0c0e10", border: "1px solid #1a1e22",
              marginBottom: 14,
            }}>
              <div style={{ fontSize: "var(--fz-sm)", color: "#c8d0da", fontWeight: 700, marginBottom: 4 }}>
                Тренування записано
              </div>
              <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048" }}>
                {(session.exercises as unknown[]).length} вправ · {session.status === "completed" ? "завершено" : "чернетка"}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "var(--fz-sm)", color: "#3a4048", marginBottom: 16 }}>
              Тренувань на цей день немає
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose}>Закрити</Button>
          <Button
            style={{ flex: 2 }}
            onClick={() => { onClose(); router.push(`/training/session/new?date=${dateKey}`); }}
          >
            {session ? "Переглянути / редагувати" : "+ Додати тренування"}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function TrainingCalendar({
  periods, accent, onDayClick,
}: {
  periods: MacroperiodDto[];
  accent: string;
  onDayClick: (dateKey: string) => void;
}) {
  const GAP = 2;
  const LEFT = 28, TOP = 36;
  const year = new Date().getFullYear();

  const jan1 = new Date(year, 0, 1);
  const jan1dow = jan1.getDay();
  const gridStart = new Date(year, 0, 1 - (jan1dow === 0 ? 6 : jan1dow - 1));

  const dec31 = new Date(year, 11, 31);
  const dec31dow = dec31.getDay();
  const gridEnd = new Date(year, 11, 31 + (dec31dow === 0 ? 0 : 7 - dec31dow));

  const msOf = (d: Date) => d.getTime();
  const totalWeeks = Math.round((msOf(gridEnd) - msOf(gridStart)) / 86400000 / 7) + 1;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [cellSz, setCellSz] = useState(13);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const avail = el.offsetWidth - LEFT - 4;
      setCellSz(Math.max(8, Math.floor((avail - (totalWeeks - 1) * GAP) / totalWeeks)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalWeeks]);
  const U = cellSz + GAP;

  // Read localStorage sessions for dot indicators
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const all: DaySession[] = JSON.parse(localStorage.getItem("training_sessions") ?? "[]");
      setSessionDates(new Set(all.map(s => s.date)));
    } catch { /* ignore */ }
  }, []);

  type CellInfo = { training: boolean; count: number; color: string };
  const cellMap = new Map<string, CellInfo>();

  periods.forEach(p => {
    const pStart = localDate(p.startDate);
    const pEnd = new Date(pStart);
    pEnd.setDate(pEnd.getDate() + p.weeksCount * 7 - 1);
    const color = STYLE_COLORS[p.focusStyle] ?? "#84cc16";

    const trainMap = new Map<string, number>();
    p.mesocycles.forEach(ms => {
      const msStart = new Date(pStart);
      msStart.setDate(msStart.getDate() + (ms.startWeek - 1) * 7);
      for (let w = 0; w < ms.durationWeeks; w++) {
        ms.dayTemplates.forEach(dt => {
          const base = new Date(msStart);
          base.setDate(base.getDate() + w * 7);
          const bdow = base.getDay();
          const monday = new Date(base);
          monday.setDate(monday.getDate() - (bdow === 0 ? 6 : bdow - 1));
          const target = new Date(monday);
          target.setDate(target.getDate() + dt.dayOfWeek - 1);
          trainMap.set(fmtDate(target), dt.blocks.length);
        });
      }
    });

    const cur = new Date(pStart);
    while (cur <= pEnd) {
      const k = fmtDate(cur);
      cellMap.set(k, { training: trainMap.has(k), count: trainMap.get(k) ?? 0, color });
      cur.setDate(cur.getDate() + 1);
    }
  });

  const periodBoxes = periods.map((p, pi) => {
    const pStart = localDate(p.startDate);
    const pEnd = new Date(pStart);
    pEnd.setDate(pEnd.getDate() + p.weeksCount * 7 - 1);
    const colStart = Math.max(0, Math.floor((msOf(pStart) - msOf(gridStart)) / 86400000 / 7));
    const colEnd   = Math.min(totalWeeks - 1, Math.floor((msOf(pEnd) - msOf(gridStart)) / 86400000 / 7));
    if (colStart > totalWeeks - 1 || colEnd < 0) return null;
    return { colStart, colEnd, color: STYLE_COLORS[p.focusStyle] ?? "#84cc16", name: p.name, pi };
  }).filter(Boolean) as { colStart: number; colEnd: number; color: string; name: string; pi: number }[];

  const mesoLines: { col: number; color: string }[] = [];
  periods.forEach(p => {
    const pStart = localDate(p.startDate);
    p.mesocycles.forEach((ms, mi) => {
      if (mi === 0) return;
      const msStart = new Date(pStart);
      msStart.setDate(msStart.getDate() + (ms.startWeek - 1) * 7);
      const col = Math.floor((msOf(msStart) - msOf(gridStart)) / 86400000 / 7);
      if (col > 0 && col < totalWeeks) mesoLines.push({ col, color: STYLE_COLORS[p.focusStyle] ?? "#84cc16" });
    });
  });

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < totalWeeks; w++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + w * 7);
    if (d.getMonth() !== lastMonth && d.getFullYear() === year) {
      monthLabels.push({ label: MONTH_UA[d.getMonth()], col: w });
      lastMonth = d.getMonth();
    }
  }

  const todayKey = fmtDate(new Date());
  const gridW = totalWeeks * U - GAP;
  const gridH = 7 * U - GAP;

  const cells: React.ReactNode[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(date.getDate() + w * 7 + d);
      const k = fmtDate(date);
      const info = cellMap.get(k);
      const inYear = date.getFullYear() === year;
      const isToday = k === todayKey;
      const hasSession = sessionDates.has(k);

      let bg = inYear ? "#141414" : "#0c0c0c";
      if (info) {
        if (info.training) {
          const c = info.count;
          bg = c === 0 ? "#1c3522" : c === 1 ? "#1e4a2a" : c <= 3 ? "#256033" : c <= 5 ? "#2e7a3e" : "#389e4c";
        } else {
          bg = "#161c17";
        }
      }

      cells.push(
        <div
          key={k}
          title={`${k}${info?.training ? ` · ${info.count || "?"} вправ` : info ? " · відпочинок" : ""}`}
          onClick={() => onDayClick(k)}
          style={{
            width: cellSz, height: cellSz,
            background: bg,
            borderRadius: 2,
            border: isToday ? `1.5px solid ${accent}` : "none",
            outline: isToday ? `1px solid ${accent}44` : "none",
            outlineOffset: 1,
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {hasSession && (
            <div style={{
              position: "absolute", bottom: 1, right: 1,
              width: 3, height: 3, borderRadius: "50%",
              background: accent,
            }} />
          )}
        </div>
      );
    }
  }

  return (
    <div ref={wrapRef} style={{ marginBottom: 8, width: "100%" }}>
      <div style={{ position: "relative", paddingLeft: LEFT, paddingTop: TOP }}>
        {periodBoxes.map(box => (
          <span key={box.pi} style={{
            position: "absolute",
            left: LEFT + box.colStart * U, top: 0,
            fontSize: "var(--fz-micro)", fontWeight: 800, letterSpacing: 0.4,
            color: box.color, whiteSpace: "nowrap", lineHeight: "16px",
            maxWidth: (box.colEnd - box.colStart + 1) * U,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{
              fontSize: "var(--fz-micro)", fontWeight: 700, letterSpacing: 0.8,
              color: box.color + "99", background: box.color + "18",
              border: `1px solid ${box.color}40`,
              borderRadius: 3, padding: "0 3px", lineHeight: "12px",
            }}>МАКРОПЕРІОД</span>
            {box.name.toUpperCase()}
          </span>
        ))}

        {monthLabels.map(({ label, col }) => (
          <span key={col} style={{
            position: "absolute", left: LEFT + col * U, top: 16,
            fontSize: "var(--fz-micro)", color: "#3a4048", fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px",
          }}>{label}</span>
        ))}

        {["Пн","","Ср","","Пт","",""].map((label, row) => label ? (
          <span key={row} style={{
            position: "absolute", left: 0, top: TOP + row * U,
            fontSize: "var(--fz-micro)", color: "#3a4048", fontWeight: 600, lineHeight: `${cellSz}px`,
          }}>{label}</span>
        ) : null)}

        <div style={{ position: "relative", width: gridW, height: gridH }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${totalWeeks}, ${cellSz}px)`,
            gridTemplateRows: `repeat(7, ${cellSz}px)`,
            gap: GAP, gridAutoFlow: "column",
          }}>{cells}</div>

          {periodBoxes.map(box => (
            <div key={box.pi} style={{
              position: "absolute",
              left: box.colStart * U - 2, top: -2,
              width: (box.colEnd - box.colStart + 1) * U - GAP + 4,
              height: gridH + 4,
              border: `1.5px solid ${box.color}70`, borderRadius: 4,
              pointerEvents: "none",
              boxShadow: `inset 0 0 0 0.5px ${box.color}20, 0 0 8px ${box.color}10`,
            }} />
          ))}

          {mesoLines.map(({ col, color }, i) => (
            <div key={i} style={{
              position: "absolute", left: col * U - 1, top: 2,
              height: gridH - 4, width: 1,
              background: `${color}50`, pointerEvents: "none",
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, paddingLeft: LEFT, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["#141414","#161c17","#1e4a2a","#2e7a3e","#389e4c"].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c, border: "1px solid #222" }} />
          ))}
          <span style={{ fontSize: "var(--fz-micro)", color: "#3a4048", marginLeft: 4, fontWeight: 600 }}>немає → більше вправ</span>
        </div>
        <div style={{ width: 1, height: 12, background: "#222" }} />
        {Object.entries({ 0: "Top Roll", 1: "Hook", 2: "Press", 3: "Загальне" }).map(([k, lbl]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 2,
              background: `${STYLE_COLORS[+k]}18`,
              border: `1.5px solid ${STYLE_COLORS[+k]}80`,
            }} />
            <span style={{ fontSize: "var(--fz-micro)", color: "#3a4048", fontWeight: 600 }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

interface TemplateData {
  id: string;
  title: string;
  description: string;
  rating: number;
  tags: string[];
  image?: string;
}

function useTemplates() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("training_templates") ?? "[]");
      setTemplates(raw.map((t: Record<string, unknown>) => ({
        id:          t.id as string,
        title:       (t.title as string) || "Без назви",
        description: `${(t.exercises as unknown[])?.length ?? 0} вправ`,
        rating:      (t.rating as number) ?? 0,
        tags:        (t.focuses as string[] | undefined)?.slice(0, 2) ?? [],
        image:       t.image as string | undefined,
      })));
    } catch { /* ignore */ }
  }, []);

  const remove = (id: string) => {
    try {
      const raw = JSON.parse(localStorage.getItem("training_templates") ?? "[]");
      localStorage.setItem("training_templates", JSON.stringify(raw.filter((t: { id: string }) => t.id !== id)));
    } catch { /* ignore */ }
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return { templates, remove };
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: "var(--fz-xs)", color: i < value ? "#fbbf24" : "#2a2e32" }}>★</span>
      ))}
    </div>
  );
}

function TemplateCard({ t, accent, onDelete }: { t: TemplateData; accent: string; onDelete?: () => void }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/training/session/new?template=true`)}
      style={{
        background: "linear-gradient(180deg, rgba(20,22,26,0.95), rgba(12,13,16,0.98))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, overflow: "hidden",
        cursor: "pointer", transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = accent + "50";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image area */}
      <div style={{
        height: 120, background: "linear-gradient(135deg, #0e1014 0%, #1a1e22 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {t.image ? (
          <img src={t.image} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: accent + "18", border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "var(--fz-h2)",
          }}>💪</div>
        )}
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 26, height: 26, borderRadius: 6,
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: "var(--fz-xs)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Видалити шаблон"
          >✕</button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: "var(--fz-sm)", fontWeight: 700, color: "#c8d0da", marginBottom: 4, lineHeight: 1.3 }}>
          {t.title}
        </div>
        <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginBottom: 8, lineHeight: 1.4 }}>
          {t.description}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <StarRating value={t.rating} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {t.tags.slice(0, 2).map(tag => (
              <span key={tag} style={{
                fontSize: "var(--fz-micro)", fontWeight: 700,
                color: accent, background: accent + "18",
                border: `1px solid ${accent}30`,
                borderRadius: 4, padding: "1px 5px",
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTemplateCard({ accent }: { accent: string }) {
  return (
    <div style={{
      background: "rgba(14,16,20,0.5)",
      border: "1.5px dashed #1e2228",
      borderRadius: 14, cursor: "pointer",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: 196, gap: 8,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent + "60"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e2228"; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: accent + "18", border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--fz-h2)", color: accent,
      }}>+</div>
      <span style={{ fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 600 }}>Новий шаблон</span>
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

const DIFF_COLOR: Record<TrainingArticle["difficulty"], string> = {
  "Початківець": "#34d399",
  "Середній":    "#fbbf24",
  "Просунутий":  "#f87171",
};

function ArticleCard({ a, accent, onClick }: { a: TrainingArticle; accent: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(180deg, rgba(20,22,26,0.95), rgba(12,13,16,0.98))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "14px 14px 12px",
        cursor: "pointer", transition: "border-color 0.15s, transform 0.15s",
        display: "flex", flexDirection: "column", gap: 8,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = accent + "50";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: "var(--fz-sm)", fontWeight: 700, color: "#c8d0da", lineHeight: 1.35, flex: 1 }}>
          {a.title}
        </div>
        <span style={{
          fontSize: "var(--fz-micro)", fontWeight: 800, flexShrink: 0,
          color: DIFF_COLOR[a.difficulty],
          background: DIFF_COLOR[a.difficulty] + "18",
          border: `1px solid ${DIFF_COLOR[a.difficulty]}30`,
          borderRadius: 4, padding: "2px 6px", marginTop: 1,
        }}>{a.difficulty}</span>
      </div>
      <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", lineHeight: 1.5 }}>{a.excerpt}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {a.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: "var(--fz-micro)", fontWeight: 700,
              color: accent, background: accent + "18",
              border: `1px solid ${accent}30`,
              borderRadius: 4, padding: "1px 5px",
            }}>{tag}</span>
          ))}
        </div>
        <span style={{ fontSize: "var(--fz-micro)", color: "#2a2e32" }}>📖 {a.readMin} хв</span>
      </div>
    </div>
  );
}

function ArticleModal({ a, onClose }: { a: TrainingArticle | null; onClose: () => void }) {
  const { accent: AC } = useTheme();
  if (!a) return null;
  return (
    <Modal open={!!a} onClose={onClose} title={a.title} size="lg">
      <ModalBody>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            fontSize: "var(--fz-xs)", fontWeight: 800,
            color: DIFF_COLOR[a.difficulty],
            background: DIFF_COLOR[a.difficulty] + "18",
            border: `1px solid ${DIFF_COLOR[a.difficulty]}30`,
            borderRadius: 6, padding: "3px 10px",
          }}>{a.difficulty}</span>
          {a.tags.map(tag => (
            <span key={tag} style={{
              fontSize: "var(--fz-xs)", fontWeight: 700,
              color: AC, background: AC + "18",
              border: `1px solid ${AC}30`,
              borderRadius: 6, padding: "3px 10px",
            }}>{tag}</span>
          ))}
          <span style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginLeft: "auto" }}>📖 {a.readMin} хв читання</span>
        </div>
        <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginBottom: 16, fontStyle: "italic" }}>
          Джерело: {a.source}
        </div>
        <div style={{ fontSize: "var(--fz-sm)", color: "#c8d0da", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {a.body.split("**").map((chunk, i) =>
            i % 2 === 1
              ? <strong key={i} style={{ color: "#e8edf2", fontWeight: 700 }}>{chunk}</strong>
              : <span key={i}>{chunk}</span>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

// ─── Compact macroperiod card ─────────────────────────────────────────────────

function CompactPeriodCard({
  period, onDelete,
}: { period: MacroperiodDto; onDelete: (id: string) => void }) {
  const router = useRouter();
  const styleColor = STYLE_COLORS[period.focusStyle] ?? "#84cc16";
  const start = localDate(period.startDate);
  const end   = new Date(start); end.setDate(end.getDate() + period.weeksCount * 7);
  const fmt   = (d: Date) => d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div
      onClick={() => router.push(`/training/${period.id}`)}
      style={{
        background: "linear-gradient(180deg, rgba(18,20,24,0.9), rgba(10,11,13,0.95))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${styleColor}`,
        borderRadius: 10, padding: "11px 12px",
        marginBottom: 8, cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = styleColor + "60"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--fz-sm)", fontWeight: 700, color: "#c8d0da" }}>{period.name}</span>
            <Badge variant="accent">{STYLE_LABELS[period.focusStyle]}</Badge>
          </div>
          <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginBottom: 6 }}>
            {GOAL_LABELS[period.goal]}
          </div>
          <div style={{ fontSize: "var(--fz-xs)", color: "#2a2e32", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span>📅 {fmt(start)} — {fmt(end)}</span>
            <span>⏱ {period.weeksCount} тижнів</span>
          </div>
          {period.mesocycles.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 7, flexWrap: "wrap" }}>
              {period.mesocycles.map((ms, i) => (
                <span key={i} style={{
                  fontSize: "var(--fz-micro)", fontWeight: 600,
                  color: "#3a4048", background: "#0e1014",
                  border: "1px solid #1a1e22", borderRadius: 5,
                  padding: "1px 6px",
                }}>
                  {ms.name} · {ms.durationWeeks}т
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(period.id); }}
          style={{
            width: 24, height: 24, borderRadius: 5, flexShrink: 0,
            background: "none", border: "none",
            color: "#2a2e32", fontSize: "var(--fz-xs)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#2a2e32"; }}
          title="Видалити"
        >✕</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const router = useRouter();
  const { accent: AC } = useTheme();
  const [ready,       setReady]       = useState(false);
  const [periods,     setPeriods]     = useState<MacroperiodDto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { templates, remove: removeTemplate } = useTemplates();
  const [journalTab,   setJournalTab]   = useState<"templates" | "articles">("templates");
  const [openArticle,  setOpenArticle]  = useState<TrainingArticle | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setReady(true);
    trainingApi.getMacroperiods().then(setPeriods).finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити макроперіод?")) return;
    await trainingApi.deleteMacroperiod(id);
    setPeriods(p => p.filter(x => x.id !== id));
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: "24px 32px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #1a1e22",
        }}>
          <div>
            <h1 style={{ fontSize: "var(--fz-h1)", fontWeight: 800, color: "#e8edf2", lineHeight: 1.1 }}>Тренування</h1>
            <p style={{ fontSize: "var(--fz-xs)", color: "#3a4048", marginTop: 4 }}>Макроперіоди та тренувальні плани</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button variant="ghost" size="sm" onClick={() => router.push("/training/new")}>+ Новий план</Button>
            <Button size="md" onClick={() => router.push("/training/session/new")} glow>
              ⚡ Нове тренування
            </Button>
          </div>
        </div>

        {/* ── Calendar ────────────────────────────────────────────────────── */}
        <div style={{ padding: "16px 32px 0" }}>
          <div style={{
            background: "#0c0e10", border: "1px solid #1a1e22",
            borderRadius: 12, padding: "16px 20px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: "var(--fz-xs)", color: "#4a5058", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                {new Date().getFullYear()} · Активність
              </span>
              <span style={{ fontSize: "var(--fz-xs)", color: "#2a2e32" }}>
                {periods.length > 0
                  ? `${periods.reduce((s, p) => s + p.weeksCount, 0)} тижнів заплановано`
                  : "Натисни на день щоб додати тренування"}
              </span>
            </div>
            {loading ? (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a2e32", fontSize: "var(--fz-xs)" }}>
                Завантаження...
              </div>
            ) : (
              <TrainingCalendar periods={periods} accent={AC} onDayClick={setSelectedDay} />
            )}
          </div>
        </div>

        {/* ── Two-panel content ────────────────────────────────────────────── */}
        <div style={{
          flex: 1, display: "flex", padding: "20px 32px 32px", gap: 0, minHeight: 0,
        }}>

          {/* Left: Journal (Templates / Articles) */}
          <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--fz-xs)", color: "#4a5058", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginRight: 4 }}>
                Журнал
              </span>
              <Chip active={journalTab === "templates"} color={AC} onClick={() => setJournalTab("templates")}>
                Мої шаблони
              </Chip>
              <Chip active={journalTab === "articles"} color={AC} onClick={() => setJournalTab("articles")}>
                📖 Статті
              </Chip>
              <div style={{ flex: 1 }} />
              {journalTab === "templates" && (
                <Button variant="ghost" size="sm" onClick={() => router.push("/training/session/new?template=true")}>
                  + Додати
                </Button>
              )}
            </div>

            {journalTab === "templates" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {templates.map(t => (
                  <TemplateCard key={t.id} t={t} accent={AC} onDelete={() => removeTemplate(t.id)} />
                ))}
                <AddTemplateCard accent={AC} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {TRAINING_ARTICLES.map(a => (
                  <ArticleCard key={a.id} a={a} accent={AC} onClick={() => setOpenArticle(a)} />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: "#1a1e22", flexShrink: 0 }} />

          {/* Right: Macroperiods narrow sidebar */}
          <div style={{ width: 300, flexShrink: 0, paddingLeft: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: "var(--fz-xs)", color: "#4a5058", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                Макроперіоди
              </span>
              <Button size="sm" onClick={() => router.push("/training/new")}>+ Новий</Button>
            </div>

            {loading ? (
              <div style={{ color: "#2a2e32", fontSize: "var(--fz-xs)" }}>Завантаження...</div>
            ) : periods.length === 0 ? (
              <div style={{
                padding: "24px 16px", textAlign: "center",
                background: "rgba(14,16,20,0.5)", border: "1.5px dashed #1e2228",
                borderRadius: 10,
              }}>
                <div style={{ fontSize: "var(--fz-h2)", marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: "var(--fz-xs)", color: "#3a4048", fontWeight: 600, marginBottom: 12 }}>
                  Планів ще немає
                </div>
                <Button size="sm" onClick={() => router.push("/training/new")}>Створити план</Button>
              </div>
            ) : (
              periods.map(p => (
                <CompactPeriodCard key={p.id} period={p} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Day modal */}
      <DayModal dateKey={selectedDay} onClose={() => setSelectedDay(null)} accent={AC} />

      {/* Article modal */}
      <ArticleModal a={openArticle} onClose={() => setOpenArticle(null)} />
    </div>
  );
}
