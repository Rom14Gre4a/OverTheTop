"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

// ─── Dev Plan ─────────────────────────────────────────────────────────────────

interface PlanItem { id: string; label: string; done: boolean; }
interface PlanStage { title: string; items: PlanItem[]; }

const INITIAL_PLAN: PlanStage[] = [
  {
    title: "Етап 1 · Карта",
    items: [
      { id: "s1-1", label: "Grid/hex система тайлів", done: false },
      { id: "s1-2", label: "Типи зон (ліс, вода, гори, рівнина, пустеля)", done: false },
      { id: "s1-3", label: "Родовища ресурсів на карті", done: false },
      { id: "s1-4", label: "Камера: pan / zoom / focus", done: false },
      { id: "s1-5", label: "Туман війни (fog of war)", done: false },
    ],
  },
  {
    title: "Етап 2 · Ресурси",
    items: [
      { id: "s2-1", label: "Типи ресурсів (їжа, дерево, камінь, мінерали, енергія)", done: false },
      { id: "s2-2", label: "Поява та регенерація ресурсів", done: false },
      { id: "s2-3", label: "Візуалізація ресурсів на карті", done: false },
      { id: "s2-4", label: "Спустошення та відновлення тайлів", done: false },
    ],
  },
  {
    title: "Етап 3 · Фракції та колонії",
    items: [
      { id: "s3-1", label: "Типи фракцій (комахи, гриби, рослини, машини…)", done: false },
      { id: "s3-2", label: "Точки спавну колоній", done: false },
      { id: "s3-3", label: "Захоплення території / кордони", done: false },
      { id: "s3-4", label: "Унікальні характеристики кожної фракції", done: false },
    ],
  },
  {
    title: "Етап 4 · Юніти та ШІ",
    items: [
      { id: "s4-1", label: "Базові типи юнітів (робітник, солдат, розвідник)", done: false },
      { id: "s4-2", label: "Пошук шляху (A*)", done: false },
      { id: "s4-3", label: "Задачі юнітів (збір, будівля, атака, розвідка)", done: false },
      { id: "s4-4", label: "Базовий ШІ прийняття рішень", done: false },
    ],
  },
  {
    title: "Етап 5 · Еволюція",
    items: [
      { id: "s5-1", label: "Досвід та навчання юнітів", done: false },
      { id: "s5-2", label: "Система трейтів (юніти набувають рис)", done: false },
      { id: "s5-3", label: "Дерево еволюції колонії", done: false },
      { id: "s5-4", label: "Генетичне успадкування між поколіннями", done: false },
      { id: "s5-5", label: "Мутації при стресових умовах", done: false },
    ],
  },
  {
    title: "Етап 6 · Автономія колоній",
    items: [
      { id: "s6-1", label: "Самостійне управління ресурсами", done: false },
      { id: "s6-2", label: "Стратегія розширення (ШІ)", done: false },
      { id: "s6-3", label: "Стратегія бою (ШІ)", done: false },
      { id: "s6-4", label: "Пріоритизація цілей колонії", done: false },
    ],
  },
  {
    title: "Етап 7 · Бойова система",
    items: [
      { id: "s7-1", label: "Бій юніт vs юніт", done: false },
      { id: "s7-2", label: "Війни за територію", done: false },
      { id: "s7-3", label: "Облога та оборона", done: false },
      { id: "s7-4", label: "Знищення / завоювання колонії", done: false },
    ],
  },
  {
    title: "Етап 8 · Панель управління",
    items: [
      { id: "s8-1", label: "Контроль швидкості (пауза / 1× / 2× / 4×)", done: false },
      { id: "s8-2", label: "Вибір фракції та фокус камери", done: false },
      { id: "s8-3", label: "Інструменти спостерігача / втручання", done: false },
      { id: "s8-4", label: "Перемикач шарів карти (ресурси / тери / юніти)", done: false },
    ],
  },
  {
    title: "Етап 9 · Лог подій",
    items: [
      { id: "s9-1", label: "Потік подій у реальному часі", done: false },
      { id: "s9-2", label: "Категорії подій (бій, еволюція, торгівля, відкриття)", done: false },
      { id: "s9-3", label: "Фільтрація та пошук по логу", done: false },
      { id: "s9-4", label: "Клік на подію → фокус камери на місце", done: false },
    ],
  },
  {
    title: "Етап 10 · Просунуті фічі",
    items: [
      { id: "s10-1", label: "Погода та сезони", done: false },
      { id: "s10-2", label: "Дипломатія між фракціями", done: false },
      { id: "s10-3", label: "Технологічне дерево", done: false },
      { id: "s10-4", label: "Статистика та графіки росту", done: false },
      { id: "s10-5", label: "Система повтору (replay)", done: false },
    ],
  },
];

// ─── DevPlanPanel ─────────────────────────────────────────────────────────────

function DevPlanPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState<PlanStage[]>(INITIAL_PLAN);

  const toggle = (stageIdx: number, itemId: string) => {
    setPlan(prev => prev.map((stage, si) =>
      si !== stageIdx ? stage : {
        ...stage,
        items: stage.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it),
      }
    ));
  };

  const total = plan.reduce((a, s) => a + s.items.length, 0);
  const done  = plan.reduce((a, s) => a + s.items.filter(i => i.done).length, 0);
  const pct   = Math.round((done / total) * 100);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 340,
        background: "#0a0a0a",
        borderLeft: "1px solid #1e1e1e",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px 14px", borderBottom: "1px solid #1a1a1a", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#e0e0e0", fontWeight: 800, fontSize: "var(--fz-body)" }}>
              📋 План розробки
            </span>
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "#444",
              fontSize: "var(--fz-h2)", cursor: "pointer", lineHeight: 1, padding: 4,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
              onMouseLeave={e => (e.currentTarget.style.color = "#444")}
            >✕</button>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 2,
                background: "linear-gradient(90deg, #7c3aed, #34d399)",
                transition: "width 0.3s",
              }} />
            </div>
            <span style={{ color: "#555", fontSize: "var(--fz-xs)", flexShrink: 0 }}>
              {done}/{total}
            </span>
          </div>
        </div>

        {/* Items */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {plan.map((stage, si) => {
            const stageDone = stage.items.filter(i => i.done).length;
            return (
              <div key={stage.title} style={{ marginBottom: 4 }}>
                {/* Stage title */}
                <div style={{
                  padding: "10px 20px 6px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#666", fontSize: "var(--fz-xs)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    {stage.title}
                  </span>
                  <span style={{ color: stageDone === stage.items.length ? "#34d399" : "#333", fontSize: "var(--fz-xs)" }}>
                    {stageDone}/{stage.items.length}
                  </span>
                </div>

                {/* Checkboxes */}
                {stage.items.map(item => (
                  <label
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "7px 20px", cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      onClick={() => toggle(si, item.id)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: `1.5px solid ${item.done ? "#7c3aed" : "#2a2a2a"}`,
                        background: item.done ? "rgba(124,58,237,0.2)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s", cursor: "pointer",
                      }}
                    >
                      {item.done && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{
                      color: item.done ? "#444" : "#888",
                      fontSize: "var(--fz-xs)", lineHeight: 1.4,
                      textDecoration: item.done ? "line-through" : "none",
                      transition: "color 0.15s",
                    }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvolutionPage() {
  const [planOpen, setPlanOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />

      <main style={{ flex: 1, background: "#080808", minHeight: "100vh", position: "relative" }}>

        {/* Toggle button */}
        <button
          onClick={() => setPlanOpen(v => !v)}
          style={{
            position: "absolute", top: 20, right: planOpen ? 356 : 20,
            zIndex: 45,
            padding: "8px 14px", borderRadius: 10,
            background: planOpen ? "rgba(124,58,237,0.15)" : "#111",
            border: `1px solid ${planOpen ? "rgba(124,58,237,0.4)" : "#1e1e1e"}`,
            color: planOpen ? "#a78bfa" : "#555",
            fontSize: "var(--fz-xs)", fontWeight: 700, cursor: "pointer",
            transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
            letterSpacing: 0.5,
          }}
          onMouseEnter={e => { if (!planOpen) { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#333"; } }}
          onMouseLeave={e => { if (!planOpen) { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1e1e1e"; } }}
        >
          📋 План розробки
        </button>

        <DevPlanPanel open={planOpen} onClose={() => setPlanOpen(false)} />
      </main>
    </div>
  );
}
