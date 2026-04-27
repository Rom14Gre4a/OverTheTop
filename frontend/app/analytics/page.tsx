"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, Badge } from "@/components/ui";
import { loadTournaments, getDaysUntil } from "@/lib/tournaments";

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "overview" | "training" | "diet" | "pharma" | "rest" | "rehab";
type TrainTab = "analysis" | "injuries";
interface Rec { level: "critical" | "warning" | "good" | "info"; text: string }

// ─── Mock data ────────────────────────────────────────────────────────────────

const WEEKS    = ["7.03", "14.03", "21.03", "28.03", "4.04", "11.04", "Цей"];
const VOLUME   = [14, 20, 17, 24, 21, 26, 19];
const SLEEP    = [7.5, 6.0, 8.0, 6.5, 7.0, 5.5, 7.2];
const HRV      = [68, 62, 74, 65, 70, 58, 72];
const RECOVERY = [78, 65, 82, 71, 68, 55, 73];
const WEIGHT   = [76.2, 75.8, 76.4, 75.5, 75.1, 74.8, 74.5];
const WDATES   = ["17.04","19.04","21.04","23.04","24.04","25.04","27.04"];

const RADAR_LABELS  = ["Передпліч.", "Біцепс", "Спина", "Плечі", "Хват", "Трицепс"];
const RADAR_CURRENT = [85, 70, 55, 45, 90, 40];
const RADAR_TARGET  = [90, 80, 72, 68, 90, 62];

const MACROS = { protein: 165, carbs: 280, fat: 75 };
const CALORIES = 2460;

const SUPPLEMENTS = [
  { name: "Креатин моногідрат",  dose: "5г",         timing: "Після тренування, щодня",    status: "active",  priority: "high"   },
  { name: "Бета-аланін",         dose: "3.2г",        timing: "За 30 хв до тренування",     status: "active",  priority: "high"   },
  { name: "Магній гліцинат",     dose: "400мг",       timing: "На ніч",                     status: "active",  priority: "high"   },
  { name: "Вітамін D3 + K2",     dose: "2000 МО",     timing: "Вранці з їжею",              status: "active",  priority: "medium" },
  { name: "Омега-3",             dose: "2г EPA+DHA",  timing: "З основним прийомом їжі",    status: "active",  priority: "medium" },
  { name: "Цитрулін малат",      dose: "6г",          timing: "За 45 хв до тренування",     status: "paused",  priority: "medium" },
  { name: "Колаген + Вітамін C", dose: "10г + 200мг", timing: "За 1 год до тренування",     status: "active",  priority: "medium" },
  { name: "Цинк",                dose: "25мг",        timing: "На ніч (окремо від магнію)", status: "active",  priority: "low"    },
];

const INJURIES = [
  {
    id: 1, name: "Ліктьовий тендиніт (латеральний)", side: "Права рука",
    severity: "mild" as const, daysSince: 12, totalDays: 28, phase: 2,
    restrictions: ["Пронаційний захват з навантаженням", "Важкі тяги із супінацією"],
    rehab: ["Ексцентр. розгинання зап'ястка — 3×15 (без болю)", "МФР роликом передпліччя — 5 хв", "Стретчинг розгиначів — 3×30с"],
    avoid: ["Армрестлінг у повну силу", "Пронаційні потяги > 50% 1ПМ"],
  },
  {
    id: 2, name: "Підвивих зап'ястка", side: "Ліва рука",
    severity: "moderate" as const, daysSince: 5, totalDays: 21, phase: 1,
    restrictions: ["Будь-яке аксіальне навантаження на зап'ясток"],
    rehab: ["Кріотерапія 15 хв × 3/день", "Компресійна пов'язка цілодобово", "Пасивний безболісний РОД"],
    avoid: ["Всі вправи з навантаженням на зап'ясток"],
  },
];

const REHAB_PHASES = [
  { phase: 1, name: "Гостра",      duration: "1–3 дні",    desc: "RICE: відпочинок, лід, компресія, підняття. Нікого навантаження.",           color: "#f43f5e" },
  { phase: 2, name: "Підгостра",   duration: "4–14 днів",  desc: "Контрольований рух, легке ексцентричне навантаження, нейром'язова активація.", color: "#f97316" },
  { phase: 3, name: "Реабілітація",duration: "15–28 днів", desc: "Прогресивне навантаження, специфічні вправи, підготовка до спорту.",           color: "#84cc16" },
  { phase: 4, name: "Повернення",  duration: "29+ днів",   desc: "Поступове повернення до повного тренувального об'єму та змагань.",             color: "#22c55e" },
];

const PREVENTION = [
  { exercise: "Пронація / супінація з гумою",       sets: "3×20", note: "Щодня, легка амплітуда" },
  { exercise: "Ексцентричні згинання зап'ястка",    sets: "3×15", note: "Перед тренуванням" },
  { exercise: "Фермерська хода з хватом",            sets: "4×30с", note: "Зміцнення зв'язок" },
  { exercise: "Розтяжка розгиначів передпліччя",    sets: "3×30с", note: "Після тренування" },
  { exercise: "Пасивна пронація на розтяжку",       sets: "2×45с", note: "Ранкова рутина" },
];

// ─── SVG Chart Primitives ─────────────────────────────────────────────────────

const CW = 300, CH = 130;
const P = { x: 28, y: 8, w: 264, h: 92 };

function px(i: number, n: number) { return P.x + (i / Math.max(n - 1, 1)) * P.w; }
function py(v: number, lo: number, hi: number) { return P.y + P.h - ((v - lo) / Math.max(hi - lo, 1)) * P.h; }

function LineChart({ data, labels, color = "var(--accent)", id }: {
  data: number[]; labels?: string[]; color?: string; id: string;
}) {
  const lo = Math.min(...data), hi = Math.max(...data);
  const pts = data.map((v, i) => [px(i, data.length), py(v, lo, hi)] as [number, number]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `M${pts[0][0]},${P.y + P.h} ${pts.map(([x, y]) => `L${x},${y}`).join(" ")} L${pts.at(-1)![0]},${P.y + P.h}Z`;
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ height: CH }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, .25, .5, .75, 1].map((t, i) => (
        <line key={i} x1={P.x} y1={P.y + P.h * t} x2={P.x + P.w} y2={P.y + P.h * t}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
      {labels?.map((l, i) => (
        <text key={i} x={px(i, labels.length)} y={CH - 2} textAnchor="middle" fontSize="8" fill="#52525b">{l}</text>
      ))}
    </svg>
  );
}

function BarChart({ data, labels, color = "var(--accent)", id }: {
  data: number[]; labels?: string[]; color?: string; id: string;
}) {
  const hi = Math.max(...data, 1);
  const slot = P.w / data.length;
  const bw = Math.min(slot * 0.58, 32);
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ height: CH }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {[0, .33, .66, 1].map((t, i) => (
        <line key={i} x1={P.x} y1={P.y + P.h * t} x2={P.x + P.w} y2={P.y + P.h * t}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {data.map((v, i) => {
        const bh = (v / hi) * P.h;
        const x = P.x + i * slot + (slot - bw) / 2;
        return (
          <g key={i}>
            <rect x={x} y={P.y + P.h - bh} width={bw} height={bh} rx="3" fill={`url(#${id})`} />
            {labels?.[i] && (
              <text x={x + bw / 2} y={CH - 2} textAnchor="middle" fontSize="8" fill="#52525b">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RadarChart({ labels, current, target }: { labels: string[]; current: number[]; target?: number[] }) {
  const CX = 105, CY = 100, R = 72, n = labels.length;
  const ang = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, v: number) => `${CX + (v / 100) * R * Math.cos(ang(i))},${CY + (v / 100) * R * Math.sin(ang(i))}`;
  const lp = (i: number) => {
    const d = R + 17, a = ang(i);
    return { x: CX + d * Math.cos(a), y: CY + d * Math.sin(a) };
  };
  const anchor = (i: number) => {
    const x = CX + R * Math.cos(ang(i));
    return x < CX - 5 ? "end" : x > CX + 5 ? "start" : "middle";
  };
  return (
    <svg viewBox="0 0 210 200" className="w-full" style={{ height: 200 }}>
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={Array.from({ length: n }, (_, i) => pt(i, lvl)).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={CX} y1={CY} x2={parseFloat(pt(i, 100))} y2={parseFloat(pt(i, 100).split(",")[1])}
          stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
      ))}
      {target && (
        <polygon points={target.map((v, i) => pt(i, v)).join(" ")}
          fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5" strokeDasharray="4 3" />
      )}
      <polygon points={current.map((v, i) => pt(i, v)).join(" ")}
        fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="2" />
      {current.map((v, i) => {
        const [x, y] = pt(i, v).split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
      })}
      {labels.map((l, i) => {
        const p = lp(i);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={anchor(i)} dominantBaseline="middle" fontSize="8.5" fill="#71717a">{l}</text>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const CX = 70, CY = 70, R = 52, SW = 18;
  const CIRC = 2 * Math.PI * R;
  const total = segments.reduce((s, g) => s + g.value, 0);
  let ang = -90;
  return (
    <svg viewBox="0 0 140 140" className="w-full" style={{ maxWidth: 140 }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
      {segments.map((seg, i) => {
        const dl = (seg.value / total) * CIRC - 2.5;
        const rot = ang;
        ang += (seg.value / total) * 360;
        return (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color} strokeWidth={SW}
            strokeDasharray={`${Math.max(dl, 0)} ${CIRC}`}
            transform={`rotate(${rot} ${CX} ${CY})`} />
        );
      })}
    </svg>
  );
}

function Ring({ value, max = 100, color, size = 76, label }: {
  value: number; max?: number; color: string; size?: number; label?: string;
}) {
  const R = size / 2 - 9, CX = size / 2, CY = size / 2;
  const CIRC = 2 * Math.PI * R;
  const dl = Math.min(value / max, 1) * CIRC;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dl} ${CIRC}`} strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fontSize={size / 5} fontWeight="700" fill={color}>{value}</text>
      </svg>
      {label && <span className="text-xs text-muted text-center">{label}</span>}
    </div>
  );
}

// ─── Recommendation Panel ─────────────────────────────────────────────────────

const REC_STYLE: Record<Rec["level"], { bg: string; border: string; dot: string }> = {
  critical: { bg: "rgba(244,63,94,0.08)",  border: "rgba(244,63,94,0.22)",  dot: "#f43f5e" },
  warning:  { bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.22)",  dot: "#eab308" },
  good:     { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.22)",  dot: "#22c55e" },
  info:     { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.22)", dot: "#3b82f6" },
};

function RecPanel({ recs, title = "Розумний аналіз" }: { recs: Rec[]; title?: string }) {
  return (
    <Card strong className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
        <span className="font-bold text-sm text-foreground">🤖 {title}</span>
        <Badge variant="accent">AI</Badge>
      </div>
      <div className="space-y-2">
        {recs.map((r, i) => {
          const s = REC_STYLE[r.level];
          return (
            <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.dot }} />
              <span className="text-foreground leading-snug">{r.text}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span className="text-xs font-semibold text-muted uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function OverviewSection({ daysToTournament }: { daysToTournament: number | null }) {
  const avgRecovery = Math.round(RECOVERY.reduce((a, b) => a + b) / RECOVERY.length);
  const avgSleep = (SLEEP.reduce((a, b) => a + b) / SLEEP.length).toFixed(1);
  const recs: Rec[] = [
    daysToTournament && daysToTournament < 60
      ? { level: "warning", text: `До турніру ${daysToTournament} днів — час переходити до спеціальної підготовки та фінального піку.` }
      : { level: "info", text: "До наступного цільового турніру більше 60 днів — хороший час для базової підготовки та об'єму." },
    parseFloat(avgSleep) < 7
      ? { level: "critical", text: `Середній сон ${avgSleep} год — нижче норми. Недосипання знижує синтез білку та гормону росту на 25–40%.` }
      : { level: "good", text: `Середній сон ${avgSleep} год — оптимально. Підтримуй режим і лягай до 23:00.` },
    avgRecovery < 70
      ? { level: "warning", text: `Індекс відновлення ${avgRecovery}/100 — середній. Додай активне відновлення: 20 хв плавання або контрастний душ.` }
      : { level: "good", text: `Індекс відновлення ${avgRecovery}/100 — добре. М'язи встигають відновлюватись між сесіями.` },
    { level: "info", text: "Хват та передпліччя розвинені відмінно. Найбільший дефіцит — трицепс та плечі. Рекомендується 2 ізоляційні сесії на тиждень." },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Тренувань / тиж",  value: "4",             sub: "в середньому",  color: "var(--accent)"  },
          { label: "Відновлення",       value: `${avgRecovery}%`, sub: "цього тижня", color: "#22c55e"        },
          { label: "Поточна вага",      value: `${WEIGHT.at(-1)} кг`, sub: "−1.7 кг за місяць", color: "#3b82f6" },
          { label: "Сон",               value: `${avgSleep} год`, sub: "в середньому", color: "#a855f7"       },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} className="text-center">
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs font-semibold text-foreground mt-1">{label}</div>
            <div className="text-xs text-muted mt-0.5">{sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Об'єм тренувань — 7 тижнів</p>
          <BarChart data={VOLUME} labels={WEEKS} id="overviewBar" />
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide mb-2 font-semibold">Баланс м'язових груп</p>
          <div className="flex items-center gap-4">
            <div className="flex-1"><RadarChart labels={RADAR_LABELS} current={RADAR_CURRENT} target={RADAR_TARGET} /></div>
            <div className="text-xs text-muted space-y-2 flex-shrink-0">
              <div className="flex items-center gap-2"><div className="w-5 h-0.5" style={{ background: "var(--accent)" }} /><span>Поточне</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-0.5 border-t border-white/30 border-dashed" /><span>Ціль</span></div>
            </div>
          </div>
        </Card>
      </div>

      <RecPanel recs={recs} />
    </div>
  );
}

function TrainingSection({ daysToTournament }: { daysToTournament: number | null }) {
  const [sub, setSub] = useState<TrainTab>("analysis");

  const trainRecs: Rec[] = [
    { level: "warning", text: "Трицепс отримує лише 40/100 балів. Додай 2 вправи на трицепс у кожне тренування руки — важливо для вихідної фази." },
    { level: "warning", text: "Плечовий пояс недовантажений (45/100). Зовнішня ротація плеча — профілактика травм і важлива для топсайду." },
    { level: "info",    text: "Хват і передпліччя — сильна сторона (90 та 85). Підтримуй об'єм, не перевантажуй щоб уникнути тендинітів." },
    daysToTournament && daysToTournament <= 28
      ? { level: "critical", text: `${daysToTournament} днів до турніру — зменш загальний об'єм на 30%, збережи інтенсивність. Пікова форма.` }
      : { level: "good", text: "Зараз хороший час для збільшення тренувального об'єму. Додай 2–3 робочих підходи до основних вправ." },
    { level: "info", text: "Варто включити армрестлінгову тягу у горизонтальній площині (hook style) — специфічний патерн для стола." },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--surface)" }}>
        {([["analysis", "📈 Аналіз тренувань"], ["injuries", "🩹 Лікування травм"]] as [TrainTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSub(key)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={sub === key
              ? { background: "var(--accent)", color: "#000" }
              : { color: "var(--muted)" }}>
            {label}
          </button>
        ))}
      </div>

      {sub === "analysis" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Тренувальний об'єм (підходи/тиж)</p>
              <LineChart data={VOLUME} labels={WEEKS} id="trainLine" />
            </Card>
            <Card>
              <p className="text-xs text-muted uppercase tracking-wide mb-2 font-semibold">Баланс груп — поточне vs ціль</p>
              <div className="flex items-center gap-3">
                <div className="flex-1"><RadarChart labels={RADAR_LABELS} current={RADAR_CURRENT} target={RADAR_TARGET} /></div>
                <div className="space-y-3">
                  {RADAR_LABELS.map((l, i) => (
                    <div key={l} className="text-xs">
                      <div className="flex justify-between text-muted mb-0.5">
                        <span>{l}</span><span className="font-bold text-foreground">{RADAR_CURRENT[i]}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "var(--border)", width: 64 }}>
                        <div className="h-1 rounded-full" style={{ background: "var(--accent)", width: `${RADAR_CURRENT[i] * 0.64}px` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <SectionTitle>Рекомендовані вправи на дефіцитні групи</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {[
              { muscle: "Трицепс", exercises: ["Жим вниз на блоці", "Французький жим", "Відтискання вузьким хватом"], deficit: 60 },
              { muscle: "Плечі",   exercises: ["Зовнішня ротація з гантеллю", "Face pull", "Banded Y/T/W"],             deficit: 55 },
              { muscle: "Спина",   exercises: ["Тяга в нахилі", "Тяга Т-грифа", "Тяга на прямих руках"],               deficit: 45 },
            ].map(({ muscle, exercises, deficit }) => (
              <Card key={muscle}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-foreground">{muscle}</span>
                  <span className="text-xs font-bold text-yellow-400">−{deficit} балів</span>
                </div>
                <ul className="space-y-1.5">
                  {exercises.map(e => (
                    <li key={e} className="text-xs text-muted flex items-start gap-1.5">
                      <span style={{ color: "var(--accent)" }}>›</span>{e}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <RecPanel recs={trainRecs} title="Аналіз тренувань" />
        </div>
      ) : (
        /* ── Injury Treatment Sub-tab ── */
        <div className="space-y-6">
          <SectionTitle>Активні травми</SectionTitle>
          {INJURIES.map((inj) => {
            const progress = Math.round((inj.daysSince / inj.totalDays) * 100);
            const sevColor = inj.severity === "mild" ? "#22c55e" : inj.severity === "moderate" ? "#eab308" : "#f43f5e";
            return (
              <Card key={inj.id} strong>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-foreground">{inj.name}</h3>
                    <p className="text-sm text-muted mt-0.5">{inj.side}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: sevColor + "22", color: sevColor }}>
                      {inj.severity === "mild" ? "Легка" : inj.severity === "moderate" ? "Середня" : "Важка"}
                    </span>
                    <span className="text-xs text-muted">{inj.daysSince}/{inj.totalDays} днів</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>Прогрес відновлення</span><span className="font-bold text-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: sevColor }} />
                  </div>
                </div>

                {/* Phases */}
                <div className="flex gap-1 mb-4">
                  {REHAB_PHASES.map((ph) => (
                    <div key={ph.phase} className="flex-1 text-center">
                      <div className="h-1.5 rounded-full mb-1"
                        style={{ background: ph.phase <= inj.phase ? ph.color : "var(--border)" }} />
                      <span className="text-[10px] text-muted">{ph.name}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted font-semibold uppercase tracking-wide mb-2">✅ Реабілітаційні вправи</p>
                    <ul className="space-y-1.5">
                      {inj.rehab.map(e => (
                        <li key={e} className="flex items-start gap-1.5 text-foreground">
                          <span className="text-green-400 mt-0.5">›</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted font-semibold uppercase tracking-wide mb-2">🚫 Уникати</p>
                    <ul className="space-y-1.5">
                      {inj.avoid.map(e => (
                        <li key={e} className="flex items-start gap-1.5 text-foreground">
                          <span className="text-red-400 mt-0.5">›</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {inj.restrictions.length > 0 && (
                  <div className="mt-4 rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <span className="text-red-400 font-semibold">Обмеження: </span>
                    <span className="text-foreground">{inj.restrictions.join(" · ")}</span>
                  </div>
                )}
              </Card>
            );
          })}

          <SectionTitle>Фази реабілітації</SectionTitle>
          <div className="grid grid-cols-4 gap-3">
            {REHAB_PHASES.map((ph) => (
              <Card key={ph.phase} className="space-y-2">
                <div className="h-0.5 rounded-full" style={{ background: ph.color }} />
                <div className="font-bold text-xs" style={{ color: ph.color }}>Фаза {ph.phase} · {ph.name}</div>
                <div className="text-xs text-muted font-semibold">{ph.duration}</div>
                <p className="text-xs text-foreground leading-snug">{ph.desc}</p>
              </Card>
            ))}
          </div>

          <RecPanel recs={[
            { level: "info",    text: "Ексцентричні вправи — найефективніший метод реабілітації тендинітів. Виконуй повільно (3–5 сек опускання)." },
            { level: "warning", text: "Не повертайся до повного навантаження раніше ніж зникне біль у спокої та при пасивному розтягуванні." },
            { level: "good",    text: "Коллаген + Вітамін C за 1 год до тренування прискорює синтез сполучної тканини на 20–30%." },
            { level: "info",    text: "Кінезіотейпування під час тренувань знизить навантаження на пошкоджену область та запобіжить погіршенню." },
          ]} title="Реабілітаційні рекомендації" />
        </div>
      )}
    </div>
  );
}

function DietSection() {
  const totalKcal = MACROS.protein * 4 + MACROS.carbs * 4 + MACROS.fat * 9;
  const segments = [
    { value: MACROS.protein * 4, color: "#f97316", label: "Білки" },
    { value: MACROS.carbs * 4,   color: "#3b82f6", label: "Вуглеводи" },
    { value: MACROS.fat * 9,     color: "#a855f7", label: "Жири" },
  ];
  const proteinPerKg = (MACROS.protein / (WEIGHT.at(-1) ?? 75)).toFixed(2);
  const recs: Rec[] = [
    parseFloat(proteinPerKg) < 1.8
      ? { level: "critical", text: `Споживання білку ${proteinPerKg} г/кг — нижче рекомендованого (2.0–2.2 г/кг). Додай ще ~${Math.round((2.0 - parseFloat(proteinPerKg)) * 75)}г білку/день.` }
      : { level: "good", text: `Білок ${proteinPerKg} г/кг — оптимальний рівень для силових видів. Підтримуй рівень.` },
    { level: "info", text: "Вуглеводи перед тренуванням (60–90 хв): 40–60г легкозасвоюваних вуглеводів підвищить продуктивність на 10–15%." },
    WEIGHT.at(-1)! > 74.5
      ? { level: "warning", text: `Поточна вага ${WEIGHT.at(-1)} кг. Якщо плануєш категорію 75 кг, маєш запас — поступово скорочуй на 0.5 кг/тиж.` }
      : { level: "good", text: "Вага у норматив. Підтримуй поточний калораж та слідкуй за добовими коливаннями." },
    { level: "info", text: "Їж протеїн кожні 3–4 год. Рекомендований розмір порції: 30–40г за прийом для максимального синтезу м'язового білку." },
    { level: "warning", text: "Споживання рідини: мінімум 35 мл/кг маси тіла. Зневоднення на 2% знижує силу на 5–10%." },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center gap-4">
          <DonutChart segments={segments} />
          <div className="text-center">
            <div className="text-2xl font-black text-foreground">{CALORIES} ккал</div>
            <div className="text-xs text-muted">добовий калораж</div>
          </div>
        </Card>
        <Card className="col-span-2">
          <p className="text-xs text-muted uppercase tracking-wide mb-4 font-semibold">Макронутрієнти</p>
          <div className="space-y-4">
            {segments.map(({ label, color, value }) => {
              const grams = label === "Білки" ? MACROS.protein : label === "Вуглеводи" ? MACROS.carbs : MACROS.fat;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold" style={{ color }}>{label}</span>
                    <span className="text-muted">{grams}г <span className="text-foreground font-bold">{value} ккал</span></span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-2 rounded-full" style={{ background: color, width: `${(value / totalKcal) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[var(--border)]">
            {[
              { label: "Білок/кг", value: `${proteinPerKg} г`, ok: parseFloat(proteinPerKg) >= 1.8 },
              { label: "Вуглеводи/кг", value: `${(MACROS.carbs / 75).toFixed(1)} г`, ok: true },
              { label: "Жири/кг",      value: `${(MACROS.fat / 75).toFixed(1)} г`,   ok: true },
            ].map(({ label, value, ok }) => (
              <div key={label} className="text-center">
                <div className="font-black text-lg" style={{ color: ok ? "#22c55e" : "#f43f5e" }}>{value}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Динаміка ваги (кг)</p>
        <LineChart data={WEIGHT} labels={WDATES} color="#3b82f6" id="weightLine" />
      </Card>

      <RecPanel recs={recs} title="Аналіз харчування" />
    </div>
  );
}

function PharmaSection({ daysToTournament }: { daysToTournament: number | null }) {
  const recs: Rec[] = [
    { level: "good",    text: "Креатин — найбільш досліджена добавка. 5г/день стабільно збільшує силові показники на 5–15% при постійному прийомі." },
    { level: "info",    text: "Бета-аланін: відчуття поколювання (парестезія) — нормально. Ефект накопичувальний, результат через 4–8 тижнів прийому." },
    { level: "warning", text: "Цитрулін на паузі. Можна відновити після нормалізації навантаження. Значно знижує відчуття втоми та молочну кислоту." },
    { level: "good",    text: "Магній на ніч: покращує якість сну та скорочення м'язів. Гліцинатна форма — найбільш засвоювана і не викликає проносу." },
    daysToTournament && daysToTournament <= 14
      ? { level: "critical", text: `${daysToTournament} днів до старту — не вводь нових добавок. Залишайся на перевіреному стеку. Не ризикуй реакцією організму.` }
      : { level: "info", text: "Нова добавка: тестуй за 4 тижні до турніру, щоб знати реакцію організму. Ніколи не вперше в день змагань." },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle>Поточний стек добавок</SectionTitle>
      <div className="space-y-2">
        {SUPPLEMENTS.map((s) => (
          <Card key={s.name} className="flex items-center gap-4 py-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: s.status === "active" ? "#22c55e" : "#71717a" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{s.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: s.priority === "high" ? "var(--accent-dim)" : "var(--surface)",
                    color: s.priority === "high" ? "var(--accent)" : "var(--muted)",
                  }}>
                  {s.priority === "high" ? "Базовий" : s.priority === "medium" ? "Допоміжний" : "Опційний"}
                </span>
                {s.status === "paused" && <Badge variant="neutral">Пауза</Badge>}
              </div>
              <p className="text-xs text-muted mt-0.5">{s.timing}</p>
            </div>
            <span className="text-sm font-bold text-foreground flex-shrink-0">{s.dose}</span>
          </Card>
        ))}
      </div>

      <SectionTitle>Розклад прийому (схема дня)</SectionTitle>
      <Card>
        <div className="grid grid-cols-4 gap-4 text-xs">
          {[
            { time: "Ранок",       items: ["Вітамін D3 + K2", "Омега-3"] },
            { time: "До тренув.",  items: ["Бета-аланін 3.2г", "Цитрулін 6г (опційно)", "Колаген + C"] },
            { time: "Після тренув.",items: ["Креатин 5г", "Омега-3 (друга порція)"] },
            { time: "Перед сном",  items: ["Магній гліцинат 400мг", "Цинк 25мг (окремо)"] },
          ].map(({ time, items }) => (
            <div key={time}>
              <div className="font-bold text-foreground mb-2 pb-1.5 border-b border-[var(--border)]">{time}</div>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-muted">
                    <span style={{ color: "var(--accent)" }}>›</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <RecPanel recs={recs} title="Аналіз фармакології" />
    </div>
  );
}

function RestSection() {
  const avgSleep = (SLEEP.reduce((a, b) => a + b) / SLEEP.length).toFixed(1);
  const avgHrv   = Math.round(HRV.reduce((a, b) => a + b) / HRV.length);
  const avgRec   = Math.round(RECOVERY.reduce((a, b) => a + b) / RECOVERY.length);
  const recs: Rec[] = [
    parseFloat(avgSleep) < 7
      ? { level: "critical", text: `Середній сон ${avgSleep} год — критично мало. Недосипання понижує тестостерон на 10–15% за тиждень та уповільнює синтез м'язового білку.` }
      : { level: "good", text: `Сон ${avgSleep} год — оптимально. Намагайся лягати та вставати в один і той самий час (±30 хв), навіть у вихідні.` },
    { level: "warning", text: "Уникай гаджетів за 45–60 хв до сну. Синє світло пригнічує мелатонін і погіршує глибокі фази сну (SWS та REM)." },
    avgHrv < 65
      ? { level: "warning", text: `ЧСС варіабельність ${avgHrv} мс — нижче оптимуму. Сигнал про накопичену втому або стрес. Рекомендується розвантажувальний тиждень.` }
      : { level: "good", text: `ЧСС варіабельність ${avgHrv} мс — добра. Нервова система справляється з навантаженням.` },
    { level: "info", text: "Активне відновлення (15–20 хв плавання, легкий велосипед або ходьба) прискорює виведення лактату та знижує запалення." },
    { level: "info", text: "Контрастний душ після тренування: 30с холодний / 60с гарячий, 4 цикли. Знижує DOMS на 20–30%." },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center gap-3 py-6">
          <Ring value={Math.round(parseFloat(avgSleep) / 9 * 100)} color={parseFloat(avgSleep) >= 7 ? "#22c55e" : "#f43f5e"} size={88} />
          <div className="text-center">
            <div className="text-xl font-black text-foreground">{avgSleep} год</div>
            <div className="text-xs text-muted">середній сон</div>
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-3 py-6">
          <Ring value={avgRec} color={avgRec >= 70 ? "#22c55e" : avgRec >= 50 ? "#eab308" : "#f43f5e"} size={88} />
          <div className="text-center">
            <div className="text-xl font-black text-foreground">{avgRec}%</div>
            <div className="text-xs text-muted">індекс відновлення</div>
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-3 py-6">
          <Ring value={avgHrv} max={100} color={avgHrv >= 65 ? "#3b82f6" : "#eab308"} size={88} />
          <div className="text-center">
            <div className="text-xl font-black text-foreground">{avgHrv} мс</div>
            <div className="text-xs text-muted">варіабельність ЧСС</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Якість сну (год)</p>
          <LineChart data={SLEEP} labels={WEEKS} color="#a855f7" id="sleepLine" />
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Варіабельність ЧСС (мс)</p>
          <LineChart data={HRV} labels={WEEKS} color="#3b82f6" id="hrvLine" />
        </Card>
      </div>

      <Card>
        <p className="text-xs text-muted uppercase tracking-wide mb-3 font-semibold">Індекс відновлення / тиждень</p>
        <BarChart data={RECOVERY} labels={WEEKS} color="#22c55e" id="recovBar" />
      </Card>

      <RecPanel recs={recs} title="Аналіз відпочинку" />
    </div>
  );
}

function RehabSection() {
  const recs: Rec[] = [
    { level: "warning", text: "Ліктьовий тендиніт — профзахворювання армрестлерів. Ексцентричний протокол (3×15 повільних опускань) є золотим стандартом лікування." },
    { level: "info",    text: "Не ігноруй дискомфорт після тренування. Хронічний тендиніт лікується 3–6 місяців, а гострий — 2–4 тижні. Раннє лікування = швидше повернення." },
    { level: "good",    text: "Профілактика: пронація/супінація з легкою гумою 3×20 перед кожним тренуванням знижує ризик тендиніту на 60%." },
    { level: "info",    text: "Кінезіотейп нанести на ліктьову зону при поверненні до тренувань. Знижує навантаження на сухожилля без обмеження руху." },
    { level: "warning", text: "Уникай НПЗП (ібупрофен, диклофенак) систематично — вони маскують біль і перешкоджають загоєнню сухожиль." },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle>Протокол реабілітації армрестлера</SectionTitle>
      <div className="grid grid-cols-4 gap-3">
        {REHAB_PHASES.map((ph) => (
          <Card key={ph.phase} className="space-y-2">
            <div className="h-0.5 rounded-full" style={{ background: ph.color }} />
            <div className="text-xs font-black uppercase tracking-wide" style={{ color: ph.color }}>
              Фаза {ph.phase}
            </div>
            <div className="font-bold text-foreground text-sm">{ph.name}</div>
            <div className="text-xs text-muted font-semibold">{ph.duration}</div>
            <p className="text-xs text-foreground leading-relaxed">{ph.desc}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Профілактичні вправи</SectionTitle>
      <Card>
        <div className="divide-y divide-[var(--border)]">
          {PREVENTION.map(({ exercise, sets, note }) => (
            <div key={exercise} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-start gap-2.5 flex-1">
                <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">›</span>
                <span className="text-sm text-foreground">{exercise}</span>
              </div>
              <span className="text-sm font-bold text-foreground flex-shrink-0">{sets}</span>
              <span className="text-xs text-muted flex-shrink-0 w-36 text-right">{note}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Часті травми армрестлерів</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "Тендиніт ліктя",    risk: "Дуже високий", cause: "Перенавантаження, різкий старт",    prev: "Розминка, ексцентрика, обмеження об'єму" },
          { name: "Травма біцепса",     risk: "Високий",      cause: "Максимальне зусилля у «hook»",      prev: "Не тягнути понад 90%, розтяжка" },
          { name: "Травма плеча",       risk: "Середній",     cause: "Імпінджмент при відведенні",        prev: "Ротаторний манжет, зовн. ротація" },
          { name: "Травма зап'ястка",   risk: "Середній",     cause: "Ротація під навантаженням",         prev: "Тейп, контроль амплітуди" },
          { name: "Травма ліктьового",  risk: "Середній",     cause: "Ривок, недостатня розминка",        prev: "Розминка зв'язок, плавне збільш." },
          { name: "Травма передпліччя", risk: "Низький",      cause: "Перенавантаження хватових м'язів",  prev: "Ексцентричний тренінг, відпочинок" },
        ].map(({ name, risk, cause, prev }) => (
          <Card key={name} className="space-y-2">
            <div className="font-semibold text-sm text-foreground">{name}</div>
            <div className="text-xs">
              <span className="text-muted">Ризик: </span>
              <span className="font-bold"
                style={{ color: risk === "Дуже високий" ? "#f43f5e" : risk === "Високий" ? "#f97316" : risk === "Середній" ? "#eab308" : "#22c55e" }}>
                {risk}
              </span>
            </div>
            <div className="text-xs text-muted"><span className="text-foreground font-medium">Причина:</span> {cause}</div>
            <div className="text-xs text-muted"><span className="text-foreground font-medium">Профілактика:</span> {prev}</div>
          </Card>
        ))}
      </div>

      <RecPanel recs={recs} title="Реабілітаційні рекомендації" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "overview",  label: "⊞ Огляд"         },
  { id: "training",  label: "⚡ Тренування"   },
  { id: "diet",      label: "🥩 Харчування"   },
  { id: "pharma",    label: "💊 Фармакологія" },
  { id: "rest",      label: "🌙 Відпочинок"   },
  { id: "rehab",     label: "🩹 Реабілітація" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<MainTab>("overview");
  const [daysToTournament, setDaysToTournament] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    const ts = loadTournaments();
    const next = ts
      .filter(t => t.isTarget && getDaysUntil(t.date) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    if (next) setDaysToTournament(getDaysUntil(next.date));
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-foreground">Аналітика</h1>
            <p className="text-muted mt-1 text-sm">
              Розумний аналіз · Персональні рекомендації · Прогрес
              {daysToTournament && (
                <> · <span style={{ color: "var(--accent)" }} className="font-semibold">До турніру {daysToTournament} днів</span></>
              )}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: "var(--surface)" }}>
            {MAIN_TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-w-fit"
                style={tab === id
                  ? { background: "linear-gradient(160deg, var(--accent-light) 0%, var(--accent) 100%)", color: "#000", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }
                  : { color: "var(--muted)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === "overview"  && <OverviewSection daysToTournament={daysToTournament} />}
          {tab === "training"  && <TrainingSection daysToTournament={daysToTournament} />}
          {tab === "diet"      && <DietSection />}
          {tab === "pharma"    && <PharmaSection daysToTournament={daysToTournament} />}
          {tab === "rest"      && <RestSection />}
          {tab === "rehab"     && <RehabSection />}

        </div>
      </div>
    </div>
  );
}
