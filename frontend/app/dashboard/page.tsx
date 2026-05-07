"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { useTheme } from "@/context/ThemeContext";

// ─── Static design tokens ───────────────────────────────────────────────────────
const B   = "#050505";
const PAN = "#0f1214";
const FR  = "#2a2e32";
const FR2 = "#3a3f44";
const TX  = "#f4f4f5";
const MU  = "#71717a";
const AC2 = "#00ffc2";
const WA  = "#ffb020";

// Steel panel style — clipped corners
function sp(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: PAN,
    border: `1.5px solid ${FR}`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.035), 0 2px 12px rgba(0,0,0,0.5)`,
    clipPath: "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
    ...extra,
  };
}

// ─── Micro line chart ───────────────────────────────────────────────────────────
function MiniChart({ data, w = 280, h = 80 }: { data: number[]; w?: number; h?: number }) {
  const { accent: AC } = useTheme();
  const P = 10;
  const W = w - P * 2;
  const H = h - P * 2;
  const mn = Math.min(...data) - 4;
  const mx = Math.max(...data) + 4;
  const pts = data.map((v, i) => ({
    x: P + (i / (data.length - 1)) * W,
    y: P + H - ((v - mn) / (mx - mn)) * H,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x} ${h} L ${P} ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={AC} stopOpacity="0.18" />
          <stop offset="100%" stopColor={AC} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.33, 0.66].map((t, i) => (
        <line key={i} x1={P} y1={P + H * t} x2={P + W} y2={P + H * t} stroke={FR} strokeWidth="0.5" />
      ))}
      {["16 бер", "13 кві", "11 тра", "8 чер"].map((lbl, i) => (
        <text key={i} x={P + (i / 3) * W} y={h + 14} fill={MU} fontSize="9" textAnchor="middle">{lbl}</text>
      ))}
      <path d={area} fill="url(#cg)" />
      <path d={line} fill="none" stroke={AC} strokeWidth="1.5" />
      <circle cx={last.x} cy={last.y} r={4} fill={B} stroke={AC} strokeWidth="1.5" />
      <text x={last.x + 8} y={last.y + 4} fill={AC} fontSize="11" fontWeight="700">
        {data[data.length - 1]} кг
      </text>
      <text x={last.x + 8} y={last.y + 15} fill={`${AC}99`} fontSize="8">PR</text>
    </svg>
  );
}

// ─── Recovery circle ────────────────────────────────────────────────────────────
function RecoveryCircle({ value }: { value: number }) {
  const { accent: AC } = useTheme();
  const R = 20;
  const C = 2 * Math.PI * R;
  const dash = (value / 100) * C;
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={R} fill="none" stroke={FR2} strokeWidth="3.5" />
        <circle cx="25" cy="25" r={R} fill="none" stroke={AC} strokeWidth="3.5"
          strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="butt" />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--fz-xs)", fontWeight: 800, color: AC, lineHeight: 1,
      }}>{value}%</div>
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────────
function SLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: "10px 16px",
      borderBottom: `1px solid ${FR}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
        {children}
      </span>
      {right && <span style={{ color: MU, fontSize: "var(--fz-micro)" }}>{right}</span>}
    </div>
  );
}

// ─── Mock data ──────────────────────────────────────────────────────────────────
const TODAY_W = [
  { name: "Back Pressure", desc: "Стенд",         sets: 6, max: 6, pct: 90, done: true  },
  { name: "Pronation",     desc: "Ремінь",         sets: 5, max: 6, pct: 85, done: false },
  { name: "Cup",           desc: "Rolling Handle", sets: 4, max: 5, pct: 75, done: false },
  { name: "Кисть",         desc: "Блоки",           sets: 3, max: 5, pct: 70, done: false },
];

const STR_DATA = [40, 44, 48, 52, 55, 59, 62, 66, 70, 73, 77, 80, 84, 87.5];

const GOALS = [
  { text: "3 тренування",              cur: 3,    tot: 3,  done: true  },
  { text: "Відпрацювати Back Pressure", cur: 6,    tot: 6,  done: true  },
  { text: "Додати вагу в Pronation",    cur: 42.5, tot: 45, done: false },
  { text: "Відновлення 80%+ щодня",     cur: 5,    tot: 7,  done: false },
];

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { accent: AC } = useTheme();
  const [ready, setReady] = useState(false);
  const [wallpaper] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("ott-wallpaper") ?? "") : ""
  );

  useEffect(() => {
    if (!getToken()) router.push("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  const wpStyle: React.CSSProperties = wallpaper
    ? { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(155deg, #0a0e14 0%, #0e1418 45%, #0c0a10 100%)" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: B }}>
      <Sidebar />

      <main style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "auto",
      }}>

        {/* ──────────────── WALLPAPER ZONE ──────────────── */}
        <div style={{
          position: "relative",
          height: "58vh", minHeight: 320, maxHeight: 520,
          flexShrink: 0,
          ...wpStyle,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.55) 42%, rgba(5,5,5,0.12) 100%)",
            zIndex: 1,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(5,5,5,1) 0%, transparent 38%)",
            zIndex: 1,
          }} />

          {/* ── Title block — bottom left ── */}
          <div style={{ position: "absolute", bottom: 32, left: 36, zIndex: 10 }}>
            <div style={{
              color: AC, fontSize: "var(--fz-micro)", letterSpacing: 5, fontWeight: 700,
              textTransform: "uppercase", marginBottom: 10, opacity: 0.7,
            }}>
              Платформа армрестлера
            </div>
            <h1 style={{
              color: TX, fontSize: "var(--fz-display)", fontWeight: 900, margin: "0 0 14px",
              letterSpacing: -2, lineHeight: 1,
            }}>
              OverTheTop
            </h1>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 0,
              border: `1.5px solid ${FR}`,
              background: "rgba(15,18,20,0.88)",
              clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "7px 12px", background: `${AC}18`, borderRight: `1px solid ${FR}` }}>
                <span style={{ color: MU, fontSize: "var(--fz-xs)", fontWeight: 600 }}>Сьогодні</span>
              </div>
              {["Back Pressure", "Pronation", "Cup"].map((ex, i) => (
                <div key={ex} style={{ padding: "7px 12px", borderRight: i < 2 ? `1px solid ${FR}33` : "none" }}>
                  <span style={{ color: TX, fontSize: "var(--fz-xs)", fontWeight: 600 }}>{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Metrics column — top right ── */}
          <div style={{
            position: "absolute", top: 24, right: 24, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ ...sp(), padding: "11px 16px", display: "flex", alignItems: "center", gap: 14, minWidth: 215 }}>
              <RecoveryCircle value={82} />
              <div>
                <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>Відновлення</div>
                <div style={{ color: AC, fontSize: "var(--fz-sm)", fontWeight: 700 }}>Готовий</div>
              </div>
            </div>

            <div style={{ ...sp(), padding: "11px 16px", minWidth: 215 }}>
              <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Вага тіла</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ color: TX, fontSize: "var(--fz-h1)", fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>85.6</span>
                <span style={{ color: MU, fontSize: "var(--fz-sm)" }}>кг</span>
              </div>
              <div style={{ color: "#34d399", fontSize: "var(--fz-xs)", marginTop: 2 }}>−0.4 кг від учора</div>
            </div>

            <div style={{ ...sp(), padding: "11px 16px", minWidth: 215 }}>
              <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Останній PR</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ color: TX, fontSize: "var(--fz-h1)", fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>87.5</span>
                <span style={{ color: MU, fontSize: "var(--fz-sm)" }}>кг</span>
              </div>
              <div style={{ color: AC, fontSize: "var(--fz-xs)", fontWeight: 600, marginTop: 1 }}>Back Pressure</div>
            </div>

            <div style={{ ...sp(), padding: "11px 16px", minWidth: 215 }}>
              <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Наступний турнір</div>
              <div style={{ color: TX, fontSize: "var(--fz-sm)", fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>Кубок Сходу 2025</div>
              <div style={{ color: MU, fontSize: "var(--fz-xs)" }}>Чернівці · Україна</div>
              <div style={{ color: WA, fontSize: "var(--fz-xs)", fontWeight: 700, marginTop: 2 }}>14 червня 2025</div>
            </div>
          </div>
        </div>

        {/* ──────────────── BOTTOM STRIP ──────────────── */}
        <div style={{
          flex: 1,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12, padding: "14px 16px 16px",
          background: B, borderTop: `1.5px solid ${FR}`,
        }}>

          {/* ── Today's Training ── */}
          <div style={{ ...sp(), display: "flex", flexDirection: "column" }}>
            <SLabel right="Тиждень 3 / День 2">Тренування · Сьогодні</SLabel>

            <div style={{ flex: 1 }}>
              {TODAY_W.map((ex, i) => {
                const barColor = ex.pct >= 90 ? "#ef4444" : ex.pct >= 80 ? AC : AC2;
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 52px 88px",
                    alignItems: "center", gap: 8, padding: "9px 16px",
                    borderBottom: i < TODAY_W.length - 1 ? `1px solid ${FR}28` : "none",
                  }}>
                    <div>
                      <div style={{ color: ex.done ? AC : TX, fontSize: "var(--fz-sm)", fontWeight: 700, marginBottom: 1 }}>{ex.name}</div>
                      <div style={{ color: MU, fontSize: "var(--fz-xs)" }}>{ex.desc}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: TX, fontSize: "var(--fz-body)", fontWeight: 900, lineHeight: 1 }}>
                        {ex.sets}<span style={{ color: FR2, fontSize: "var(--fz-xs)" }}>/{ex.max}</span>
                      </div>
                      <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 0.3, marginTop: 1 }}>підходи</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ flex: 1, height: 2, background: FR2, borderRadius: 1 }}>
                          <div style={{ height: "100%", width: `${ex.pct}%`, background: barColor, borderRadius: 1 }} />
                        </div>
                        <span style={{ color: barColor, fontSize: "var(--fz-xs)", fontWeight: 700, width: 28 }}>{ex.pct}%</span>
                      </div>
                      <div style={{ color: MU, fontSize: "var(--fz-micro)", textAlign: "right", marginTop: 1, letterSpacing: 0.3 }}>інтенсивність</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "10px 16px", borderTop: `1px solid ${FR}` }}>
              <button style={{
                width: "100%", padding: "9px 0",
                background: "transparent", border: `1px solid ${AC}44`,
                color: AC, fontSize: "var(--fz-xs)", fontWeight: 700,
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer",
                clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${AC}12`; e.currentTarget.style.borderColor = `${AC}88`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${AC}44`; }}
              >Перейти до тренування →</button>
            </div>
          </div>

          {/* ── Strength Progress ── */}
          <div style={{ ...sp(), display: "flex", flexDirection: "column" }}>
            <SLabel right="Back Pressure · 3 міс.">Прогрес сили</SLabel>

            <div style={{ flex: 1, padding: "18px 16px 8px" }}>
              <MiniChart data={STR_DATA} w={280} h={90} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 22 }}>
                {[
                  { label: "Початок",   val: "40 кг",   hi: false },
                  { label: "Зараз",     val: "87.5 кг", hi: true  },
                  { label: "Зростання", val: "+119%",   hi: false },
                ].map((s, i) => (
                  <div key={i} style={{
                    textAlign: "center", padding: "8px 4px",
                    border: `1px solid ${s.hi ? AC + "44" : FR}`,
                    background: s.hi ? `${AC}0a` : "transparent",
                    clipPath: "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
                  }}>
                    <div style={{ color: s.hi ? AC : TX, fontSize: "var(--fz-body)", fontWeight: 900 }}>{s.val}</div>
                    <div style={{ color: MU, fontSize: "var(--fz-micro)", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Weekly Goals ── */}
          <div style={{ ...sp(), display: "flex", flexDirection: "column" }}>
            <SLabel right={
              <span style={{ color: AC, fontWeight: 700 }}>
                {GOALS.filter(g => g.done).length}/{GOALS.length}
              </span>
            }>Цілі тижня</SLabel>

            <div style={{ flex: 1 }}>
              {GOALS.map((g, i) => {
                const pct = Math.min((g.cur / g.tot) * 100, 100);
                return (
                  <div key={i} style={{
                    padding: "11px 16px",
                    borderBottom: i < GOALS.length - 1 ? `1px solid ${FR}28` : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 15, height: 15, flexShrink: 0,
                          border: `1.5px solid ${g.done ? AC : FR2}`,
                          background: g.done ? `${AC}18` : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          clipPath: "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)",
                        }}>
                          {g.done && <span style={{ color: AC, fontSize: "var(--fz-micro)", fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{ color: g.done ? MU : TX, fontSize: "var(--fz-sm)", textDecoration: g.done ? "line-through" : "none" }}>
                          {g.text}
                        </span>
                      </div>
                      <span style={{ color: MU, fontSize: "var(--fz-xs)", flexShrink: 0, marginLeft: 8 }}>{g.cur}/{g.tot}</span>
                    </div>
                    <div style={{ height: 2, background: FR, borderRadius: 1 }}>
                      <div style={{ height: "100%", borderRadius: 1, width: `${pct}%`, background: g.done ? AC : `${AC}66` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
