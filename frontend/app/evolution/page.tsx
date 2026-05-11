"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE     = 10;
const MAP_W    = 140;
const MAP_H    = 100;
const CANVAS_W = MAP_W * TILE;
const CANVAS_H = MAP_H * TILE;

const COLORS: Record<number, [number, number, number]> = {
  0: [10,  38,  74],   // water
  1: [38,  92,  42],   // land/grass
  2: [194, 164,  95],  // sand
  3: [100,  90,  82],  // mountain
  4: [18,   58,  22],  // forest
};

// Resource dot colors (kind: 0=Food, 1=Wood, 2=Stone, 3=Energy)
const RES_COLORS: Record<number, [number, number, number]> = {
  0: [255, 220,  45],  // food   – yellow
  1: [160, 100,  30],  // wood   – brown
  2: [190, 190, 190],  // stone  – gray
  3: [ 50, 210, 255],  // energy – cyan
};
const RES_LABELS = ["🌾 Їжа", "🪵 Дерево", "⛏ Камінь", "⚡ Енергія"];

interface ResourceDto {
  id:        string;
  x:         number;
  y:         number;
  kind:      number;
  amount:    number;
  maxAmount: number;
}

interface SpawnRuleDto {
  tileType:     number;
  tileName:     string;
  resourceKind: number;
  resourceName: string;
  priority:     number;
  chance:       number;
  amountMin:    number;
  amountMax:    number;
}

// ─── Dev Plan ─────────────────────────────────────────────────────────────────

interface PlanItem  { id: string; label: string; done: boolean; }
interface PlanStage { title: string; items: PlanItem[]; }

const INITIAL_PLAN: PlanStage[] = [
  { title: "Етап 1 · Карта", items: [
    { id:"s1-1", label:"Grid система тайлів",                    done:true  },
    { id:"s1-2", label:"Типи зон (вода, суша)",                  done:true  },
    { id:"s1-3", label:"Генерація острова (процедурна)",          done:true  },
    { id:"s1-4", label:"Рендер через ImageData (1400×1000)",      done:true  },
    { id:"s1-5", label:"Редагування карти (пензель / гумка)",    done:true  },
    { id:"s1-6", label:"Туман війни (fog of war)",               done:true  },
    { id:"s1-7", label:"Камера: pan / zoom",                     done:true  },
    { id:"s1-8", label:"Більше типів тайлів (пісок, гори, ліс)", done:true  },
  ]},

  { title: "Етап 2 · Ресурси", items: [
    { id:"s2-1",  label:"✦ Типи ресурсів: їжа, дерево, камінь, енергія",       done:true  },
    { id:"s2-2",  label:"Правила спавну: щільність по типу тайлу",              done:true  },
    { id:"s2-3",  label:"Рідкісні ресурси: самоцвіти, нафта, руда",            done:false },
    { id:"s2-4",  label:"Іконки / кольорові маркери ресурсів на тайлах",        done:false },
    { id:"s2-5",  label:"Heatmap-режим: тепловізор концентрації ресурсів",      done:false },
    { id:"s2-6",  label:"Видобуток: зменшення amount при зборі юнітом",         done:false },
    { id:"s2-7",  label:"Depleted-стан тайлу (візуально виснажений)",           done:false },
    { id:"s2-8",  label:"Регенерація ресурсів через N тактів",                  done:false },
    { id:"s2-9",  label:"Сезонна залежність (зима: їжа –40%, дерево –20%)",    done:false },
    { id:"s2-10", label:"Склади колоній: накопичення та ліміти запасів",         done:false },
    { id:"s2-11", label:"Глобальна статистика ресурсів у реальному часі",       done:false },
  ]},

  { title: "Етап 3 · Фракції та колонії", items: [
    { id:"s3-1",  label:"3 фракції: Лісовики / Гірняки / Морські",              done:false },
    { id:"s3-2",  label:"Унікальні бонуси та слабкості кожної фракції",          done:false },
    { id:"s3-3",  label:"Точки спавну (стартова відстань ≥ 20 тайлів)",         done:false },
    { id:"s3-4",  label:"Стартова база: штаб, склад, вогнище",                  done:false },
    { id:"s3-5",  label:"Система населення: народжуваність, смертність, ріст",  done:false },
    { id:"s3-6",  label:"Захоплення тайлів: радіус впливу від штабу",           done:false },
    { id:"s3-7",  label:"Кордони фракцій на карті (кольорові зони)",             done:false },
    { id:"s3-8",  label:"Мораль колонії (впливає на швидкість і видобуток)",    done:false },
    { id:"s3-9",  label:"Дипломатія: союз / нейтралітет / стан війни",          done:false },
    { id:"s3-10", label:"Торгівля між колоніями (обмін ресурсами)",              done:false },
    { id:"s3-11", label:"Кризи: голод, пожежа, хвороба (рандомні події)",       done:false },
    { id:"s3-12", label:"Культурний рівень (накопичується, відкриває бонуси)",  done:false },
    { id:"s3-13", label:"Технологічне дерево: 3 гілки (військо/економіка/наука)",done:false },
    { id:"s3-14", label:"Умови перемоги та поразки колонії",                     done:false },
  ]},

  { title: "Етап 4 · Юніти та ШІ", items: [
    { id:"s4-1",  label:"4 базові класи: Збирач / Будівник / Воїн / Розвідник", done:false },
    { id:"s4-2",  label:"Характеристики: HP, сила, швидкість, витривалість, IQ", done:false },
    { id:"s4-3",  label:"Потреби юніта: голод, стомленість, мораль",             done:false },
    { id:"s4-4",  label:"Пошук шляху A* з вагами тайлів (гори=повільно)",       done:false },
    { id:"s4-5",  label:"Черга задач: збирати / будувати / патрулювати / атакувати", done:false },
    { id:"s4-6",  label:"Behavior Trees: дерева поведінки для ШІ",               done:false },
    { id:"s4-7",  label:"Автономний розподіл юнітів колонією",                   done:false },
    { id:"s4-8",  label:"Формації загонів: колона, щит, оточення",               done:false },
    { id:"s4-9",  label:"Спец-юніти: Шаман (бафи), Інженер (будує), Шпигун",   done:false },
    { id:"s4-10", label:"Ранги: Новобранець → Ветеран → Герой",                  done:false },
    { id:"s4-11", label:"Загибель юніта: перманентна / поповнення з бази",      done:false },
    { id:"s4-12", label:"Режим швидкості: ×1 / ×4 / ×16 / пауза",               done:false },
    { id:"s4-13", label:"Покрокова симуляція (next tick вручну)",                done:false },
    { id:"s4-14", label:"Візуалізація юнітів на карті (значки, кольори фракцій)", done:false },
  ]},

  { title: "Етап 5 · Еволюція", items: [
    { id:"s5-1",  label:"Система XP: юніт отримує досвід за дії",               done:false },
    { id:"s5-2",  label:"4 трейти: Сила / Витривалість / Кмітливість / Агресія", done:false },
    { id:"s5-3",  label:"Мутації при народженні (5% шанс нового трейту)",        done:false },
    { id:"s5-4",  label:"Генетичне успадкування трейтів від батьків",             done:false },
    { id:"s5-5",  label:"Природний відбір: слабкі гинуть першими",               done:false },
    { id:"s5-6",  label:"Адаптація до біому (гірські юніти → +бонус в горах)",  done:false },
    { id:"s5-7",  label:"Дерево еволюції колонії (розблоковується через культуру)", done:false },
    { id:"s5-8",  label:"Культурна пам'ять: колонія пам'ятає кризи та їх рішення", done:false },
    { id:"s5-9",  label:"Мутація під стресом: нова суб-фракція може відколотися", done:false },
    { id:"s5-10", label:"Технологічний стрибок при критичній масі знань",        done:false },
    { id:"s5-11", label:"Легендарні юніти: унікальні імена, особливі здібності", done:false },
    { id:"s5-12", label:"Занепад: старіння технологій без інвестицій у розвиток", done:false },
    { id:"s5-13", label:"Відродження: колонія відновлюється після майже поразки", done:false },
    { id:"s5-14", label:"Конвергентна еволюція: дві фракції стають схожими",     done:false },
  ]},

  { title: "Етап 6 · Автономія та збереження", items: [
    { id:"s6-1",  label:"Повна автономія: гравець лише спостерігає",             done:false },
    { id:"s6-2",  label:"Режим «Бог»: ручне втручання (ресурс, юніт, подія)",   done:false },
    { id:"s6-3",  label:"Пам'ять рішень: колонія вчиться на власному досвіді",  done:false },
    { id:"s6-4",  label:"Автоматична реакція на загрози (тривога, евакуація)",   done:false },
    { id:"s6-5",  label:"Автоматичний розподіл ресурсів між будівлями",          done:false },
    { id:"s6-6",  label:"Міграція бази: колонія переносить штаб при потребі",   done:false },
    { id:"s6-7",  label:"Спільні атаки союзних фракцій",                         done:false },
    { id:"s6-8",  label:"Збереження / завантаження повного стану симуляції (БД)", done:false },
  ]},

  { title: "Етап 7 · Бойова система", items: [
    { id:"s7-1",  label:"Ближній бій: атака сусіднього тайлу",                   done:false },
    { id:"s7-2",  label:"Дальній бій: лучники / маги (дальність 3–5 тайлів)",   done:false },
    { id:"s7-3",  label:"Формула бою: сила атаки vs захист + рандом",            done:false },
    { id:"s7-4",  label:"Облога: захоплення штабу → перемога над колонією",      done:false },
    { id:"s7-5",  label:"Оборонні споруди: стіна, вежа, рів",                    done:false },
    { id:"s7-6",  label:"Тактичний відступ та переформування загону",             done:false },
    { id:"s7-7",  label:"Полонені: захоплення та обмін бранцями",                done:false },
    { id:"s7-8",  label:"Трофеї: захоплення технологій переможеної фракції",     done:false },
    { id:"s7-9",  label:"Герої: унікальні бойові юніти зі спецздібностями",      done:false },
    { id:"s7-10", label:"Нічна тактика: бонус атаки вночі для певних юнітів",   done:false },
  ]},

  { title: "Етап 8 · Панель управління", items: [
    { id:"s8-1",  label:"Статистика: населення, ресурси, вік колонії (live)",    done:false },
    { id:"s8-2",  label:"Графіки: ріст популяції та споживання ресурсів",        done:false },
    { id:"s8-3",  label:"Overlay карти впливу фракцій",                          done:false },
    { id:"s8-4",  label:"Рейтинг-таблиця фракцій (сила, ресурси, юніти)",       done:false },
    { id:"s8-5",  label:"Журнал подій з фільтрами (бій / дипломатія / еволюція)", done:false },
    { id:"s8-6",  label:"Картка юніта (клік → HP, трейти, XP, завдання)",       done:false },
    { id:"s8-7",  label:"Картка колонії (клік → огляд, технології, кордони)",   done:false },
    { id:"s8-8",  label:"Експорт статистики симуляції до CSV/JSON",              done:false },
  ]},

  { title: "Етап 9 · Потік подій та Replay", items: [
    { id:"s9-1",  label:"SignalR Hub: стрімінг тактів симуляції на клієнт",      done:false },
    { id:"s9-2",  label:"Підписка фронтенду на канали подій (народження/бій/…)", done:false },
    { id:"s9-3",  label:"Спалахи на карті при важливих подіях",                  done:false },
    { id:"s9-4",  label:"Запис усіх тактів до БД (повний Replay)",               done:false },
    { id:"s9-5",  label:"Відтворення збереженої симуляції (перемотка)",          done:false },
    { id:"s9-6",  label:"Позначки: «перейти до такту N» або «до події X»",      done:false },
    { id:"s9-7",  label:"Мультиплеєр-спостереження (кілька браузерів — одна сесія)", done:false },
  ]},

  { title: "Етап 10 · Погода, дипломатія, фінал", items: [
    { id:"s10-1", label:"Цикл день/ніч (видимість, поведінка юнітів)",           done:false },
    { id:"s10-2", label:"Пори року: весна/літо/осінь/зима з різними бонусами",  done:false },
    { id:"s10-3", label:"Погода: дощ, сніг, посуха (вплив на рух та ресурси)",  done:false },
    { id:"s10-4", label:"Стихійні лиха: повінь, пожежа, землетрус",              done:false },
    { id:"s10-5", label:"Повна дипломатична система з пам'яттю відносин",        done:false },
    { id:"s10-6", label:"Мирний договір та демілітаризовані зони",               done:false },
    { id:"s10-7", label:"Підсумковий екран: переможець, хронологія, рекорди",   done:false },
    { id:"s10-8", label:"Збереження та завантаження повних сесій симуляції",     done:false },
  ]},
];

// ─── DevPlanPanel ─────────────────────────────────────────────────────────────

function DevPlanPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState<PlanStage[]>(INITIAL_PLAN);
  const toggle = (si: number, id: string) =>
    setPlan(p => p.map((s, i) => i !== si ? s : {
      ...s, items: s.items.map(it => it.id === id ? { ...it, done: !it.done } : it),
    }));
  const total = plan.reduce((a, s) => a + s.items.length, 0);
  const done  = plan.reduce((a, s) => a + s.items.filter(i => i.done).length, 0);

  return (
    <>
      {open && <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:40, background:"rgba(0,0,0,0.35)" }} />}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, zIndex:50, width:320,
        background:"#0a0a0a", borderLeft:"1px solid #1e1e1e",
        display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #1a1a1a", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ color:"#e0e0e0", fontWeight:800, fontSize:"var(--fz-body)" }}>📋 План розробки</span>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", fontSize:"var(--fz-h2)", cursor:"pointer", lineHeight:1, padding:4 }}
              onMouseEnter={e => (e.currentTarget.style.color="#aaa")}
              onMouseLeave={e => (e.currentTarget.style.color="#444")}
            >✕</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:4, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.round(done/total*100)}%`, borderRadius:2, background:"linear-gradient(90deg,#7c3aed,#34d399)", transition:"width 0.3s" }} />
            </div>
            <span style={{ color:"#555", fontSize:"var(--fz-xs)" }}>{done}/{total}</span>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"8px 0" }}>
          {plan.map((stage, si) => (
            <div key={stage.title} style={{ marginBottom:4 }}>
              <div style={{ padding:"10px 20px 6px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#666", fontSize:"var(--fz-xs)", fontWeight:700, letterSpacing:0.8, textTransform:"uppercase" }}>{stage.title}</span>
                <span style={{ color: stage.items.every(i=>i.done) ? "#34d399" : "#333", fontSize:"var(--fz-xs)" }}>
                  {stage.items.filter(i=>i.done).length}/{stage.items.length}
                </span>
              </div>
              {stage.items.map(item => (
                <label key={item.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"7px 20px", cursor:"pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background="#111")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                >
                  <div onClick={() => toggle(si, item.id)} style={{
                    width:16, height:16, borderRadius:4, flexShrink:0, marginTop:1, cursor:"pointer",
                    border:`1.5px solid ${item.done ? "#7c3aed" : "#2a2a2a"}`,
                    background: item.done ? "rgba(124,58,237,0.2)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                  }}>
                    {item.done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ color: item.done ? "#444" : "#888", fontSize:"var(--fz-xs)", lineHeight:1.4, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── MapCanvas ────────────────────────────────────────────────────────────────

interface MapCanvasProps {
  tiles:       number[];
  fogTiles:    Uint8Array;
  fogEnabled:  boolean;
  resourceMap: Record<number, ResourceDto>;
}

function MapCanvas({ tiles, fogTiles, fogEnabled, resourceMap }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tiles.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(CANVAS_W, CANVAS_H);
    const d   = img.data;

    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const idx = ty * MAP_W + tx;
        const vis = !fogEnabled || fogTiles[idx] === 1;
        const [r,g,b] = COLORS[tiles[idx]] ?? COLORS[0];
        const fr = vis ? r : Math.round(r * 0.12);
        const fg = vis ? g : Math.round(g * 0.12);
        const fb = vis ? b : Math.round(b * 0.12);

        for (let py = 0; py < TILE; py++) {
          for (let px = 0; px < TILE; px++) {
            const i = ((ty * TILE + py) * CANVAS_W + tx * TILE + px) * 4;
            d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=255;
          }
        }

        // Resource dot — 4×4 pixels centered in tile (px 3-6)
        const res = resourceMap[idx];
        if (res && vis) {
          const [rr,rg,rb] = RES_COLORS[res.kind] ?? [255,255,255];
          for (let py = 3; py < 7; py++) {
            for (let px = 3; px < 7; px++) {
              const i = ((ty * TILE + py) * CANVAS_W + tx * TILE + px) * 4;
              d[i]=rr; d[i+1]=rg; d[i+2]=rb; d[i+3]=255;
            }
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [tiles, fogTiles, fogEnabled, resourceMap]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display:"block", imageRendering:"pixelated", pointerEvents:"none" }}
    />
  );
}

// ─── Edit / ResEdit state ─────────────────────────────────────────────────────

interface EditState {
  enabled: boolean;
  tool:    "paint" | "erase";
  brush:   number;
  tile:    number;
}

interface ResEditState {
  kind:  number; // 0-3 = resource kind, -1 = erase
  brush: number;
}

// ─── BottomPanel ──────────────────────────────────────────────────────────────

type PanelTab = "edit" | "resources";

interface BottomPanelProps {
  open:        boolean;
  activeTab:   PanelTab;
  onTabClick:  (tab: PanelTab) => void;
  edit:        EditState;
  onEdit:      (patch: Partial<EditState>) => void;
  resEdit:     ResEditState;
  onResEdit:   (patch: Partial<ResEditState>) => void;
  resources:   ResourceDto[];
  spawnRules:  SpawnRuleDto[];
  onResClear:  () => void;
  fogEnabled:  boolean;
  onFogToggle: () => void;
  onFogReveal: () => void;
  onFogHide:   () => void;
  onClear:     () => void;
  onReset:     () => void;
}

function BottomPanel(p: BottomPanelProps) {
  const TAB_H   = 44;
  const PANEL_H = p.activeTab === "resources" ? 210 : 175;

  const Seg = ({ label, val, cur, set }: { label:string; val:any; cur:any; set:(v:any)=>void }) => (
    <button onClick={() => set(val)} style={{
      padding:"5px 12px", borderRadius:6, fontSize:"var(--fz-xs)", cursor:"pointer",
      border:`1px solid ${cur===val ? "rgba(139,92,246,0.55)" : "#1e1e1e"}`,
      background: cur===val ? "rgba(139,92,246,0.15)" : "transparent",
      color: cur===val ? "#a78bfa" : "#555", transition:"all 0.12s",
    }}>{label}</button>
  );

  const Act = ({ label, onClick, danger }: { label:string; onClick:()=>void; danger?:boolean }) => (
    <button onClick={onClick} style={{
      padding:"5px 12px", borderRadius:6, fontSize:"var(--fz-xs)", cursor:"pointer",
      border:`1px solid ${danger ? "#ef444433" : "#1e1e1e"}`,
      background: danger ? "rgba(239,68,68,0.08)" : "#111",
      color: danger ? "#ef4444" : "#555", transition:"all 0.12s",
    }}
      onMouseEnter={e => (e.currentTarget.style.color = danger ? "#ff6b6b" : "#aaa")}
      onMouseLeave={e => (e.currentTarget.style.color = danger ? "#ef4444" : "#555")}
    >{label}</button>
  );

  const Tab = ({ id, label }: { id: PanelTab; label: string }) => {
    const active = p.open && p.activeTab === id;
    return (
      <button onClick={() => p.onTabClick(id)} style={{
        display:"flex", alignItems:"center", gap:6, padding:"0 16px", height:"100%",
        background:"none", border:"none",
        borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
        color: active ? "#a78bfa" : "#444",
        fontSize:"var(--fz-xs)", fontWeight:700, letterSpacing:0.5,
        cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
      }}>{label}</button>
    );
  };

  const resCounts = [0,1,2,3].map(k => p.resources.filter(r => r.kind === k).length);

  return (
    <div style={{
      position:"absolute", bottom:0, left:0, right:0, zIndex:20,
      background:"#090909", borderTop:"1px solid #1a1a1a",
      height: p.open ? TAB_H + PANEL_H : TAB_H,
      transition:"height 0.22s cubic-bezier(0.4,0,0.2,1)",
      overflow:"hidden", flexShrink:0,
    }}>
      {/* Tab bar */}
      <div style={{ height:TAB_H, display:"flex", alignItems:"center", gap:0, padding:"0 8px", borderBottom: p.open ? "1px solid #1a1a1a" : "none" }}>
        <Tab id="edit"      label="🖌 Редагування" />
        <Tab id="resources" label="📦 Ресурси" />

        <div style={{ flex:1 }} />

        {/* Fog toggle */}
        <button onClick={p.onFogToggle} style={{
          padding:"5px 13px", borderRadius:8, fontSize:"var(--fz-xs)", fontWeight:600, cursor:"pointer",
          border:`1px solid ${p.fogEnabled ? "#60a5fa55" : "#1e1e1e"}`,
          background: p.fogEnabled ? "rgba(96,165,250,0.12)" : "#111",
          color: p.fogEnabled ? "#60a5fa" : "#555", transition:"all 0.15s", marginRight:6,
        }}>
          {p.fogEnabled ? "🌫 Туман ON" : "🌫 Туман OFF"}
        </button>

        {/* Edit toggle */}
        <button onClick={() => p.onEdit({ enabled: !p.edit.enabled })} style={{
          padding:"5px 13px", borderRadius:8, fontSize:"var(--fz-xs)", fontWeight:600, cursor:"pointer",
          border:`1px solid ${p.edit.enabled ? "#34d39966" : "#1e1e1e"}`,
          background: p.edit.enabled ? "rgba(52,211,153,0.12)" : "#111",
          color: p.edit.enabled ? "#34d399" : "#555", transition:"all 0.15s",
        }}>
          {p.edit.enabled ? "✎ ON" : "✎ OFF"}
        </button>
      </div>

      {/* Panel body — Редагування */}
      {p.open && p.activeTab === "edit" && (
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"flex-start", gap:28, flexWrap:"wrap" }}>

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Інструмент</div>
            <div style={{ display:"flex", gap:6 }}>
              <Seg label="🖌 Пензель" val="paint" cur={p.edit.tool} set={v => p.onEdit({ tool:v })} />
              <Seg label="🧹 Гумка"   val="erase" cur={p.edit.tool} set={v => p.onEdit({ tool:v })} />
            </div>
          </div>

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Тайл</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Seg label="🟦 Вода"  val={0} cur={p.edit.tile} set={v => p.onEdit({ tile:v })} />
              <Seg label="🟩 Суша"  val={1} cur={p.edit.tile} set={v => p.onEdit({ tile:v })} />
              <Seg label="🟨 Пісок" val={2} cur={p.edit.tile} set={v => p.onEdit({ tile:v })} />
              <Seg label="⛰ Гори"  val={3} cur={p.edit.tile} set={v => p.onEdit({ tile:v })} />
              <Seg label="🌲 Ліс"   val={4} cur={p.edit.tile} set={v => p.onEdit({ tile:v })} />
            </div>
          </div>

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Пензель</div>
            <div style={{ display:"flex", gap:6 }}>
              {[1,3,5,9].map(s => <Seg key={s} label={`${s}×${s}`} val={s} cur={p.edit.brush} set={v => p.onEdit({ brush:v })} />)}
            </div>
          </div>

          <div style={{ width:1, height:48, background:"#1e1e1e", alignSelf:"center" }} />

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Туман</div>
            <div style={{ display:"flex", gap:6 }}>
              <Act label="👁 Відкрити все" onClick={p.onFogReveal} />
              <Act label="🌑 Сховати все"  onClick={p.onFogHide} />
            </div>
          </div>

          <div style={{ width:1, height:48, background:"#1e1e1e", alignSelf:"center" }} />

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Карта</div>
            <div style={{ display:"flex", gap:6 }}>
              <Act label="🌊 Все вода" onClick={p.onClear} danger />
              <Act label="↺ Скинути"   onClick={p.onReset} />
            </div>
          </div>
        </div>
      )}

      {/* Panel body — Ресурси */}
      {p.open && p.activeTab === "resources" && (
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"flex-start", gap:28, flexWrap:"wrap" }}>

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Ресурс</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Seg label="🌾 Їжа"     val={0}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🪵 Дерево"  val={1}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="⛏ Камінь"  val={2}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="⚡ Енергія" val={3}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🧹 Стерти"  val={-1} cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
            </div>
          </div>

          <div>
            <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Пензель</div>
            <div style={{ display:"flex", gap:6 }}>
              {[1,3,5,9].map(s => <Seg key={s} label={`${s}×${s}`} val={s} cur={p.resEdit.brush} set={v => p.onResEdit({ brush:v })} />)}
            </div>
          </div>

          <div style={{ width:1, height:48, background:"#1e1e1e", alignSelf:"center" }} />

          {/* Spawn rules density table */}
          {p.spawnRules.length > 0 && (
            <div>
              <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Правила спавну</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {p.spawnRules.map((rule, i) => {
                  const [rr,rg,rb] = RES_COLORS[rule.resourceKind] ?? [180,180,180];
                  const TILE_ICONS: Record<number,string> = { 1:"🟩", 2:"🟨", 3:"⛰", 4:"🌲" };
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {/* Tile label */}
                      <span style={{ color:"#444", fontSize:"var(--fz-xs)", minWidth:58, whiteSpace:"nowrap" }}>
                        {TILE_ICONS[rule.tileType] ?? "?"} {rule.tileName}
                      </span>
                      {/* Arrow */}
                      <span style={{ color:"#282828", fontSize:"var(--fz-xs)" }}>→</span>
                      {/* Resource dot + name */}
                      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:7, height:7, borderRadius:2, background:`rgb(${rr},${rg},${rb})`, display:"inline-block", flexShrink:0 }} />
                        <span style={{ color:"#555", fontSize:"var(--fz-xs)", minWidth:52 }}>{rule.resourceName}</span>
                      </span>
                      {/* Density bar */}
                      <div style={{ width:80, height:5, background:"#151515", borderRadius:3, overflow:"hidden" }}>
                        <div style={{
                          height:"100%",
                          width:`${Math.round(rule.chance * 100)}%`,
                          background:`rgb(${rr},${rg},${rb})`,
                          opacity: 0.7,
                          borderRadius:3,
                          transition:"width 0.3s",
                        }} />
                      </div>
                      {/* Percent */}
                      <span style={{ color:"#383838", fontSize:"var(--fz-xs)", minWidth:26, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>
                        {Math.round(rule.chance * 100)}%
                      </span>
                      {/* Amount range */}
                      <span style={{ color:"#2a2a2a", fontSize:"var(--fz-xs)", whiteSpace:"nowrap" }}>
                        {rule.amountMin}–{rule.amountMax}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ width:1, height:48, background:"#1e1e1e", alignSelf:"center" }} />

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <div style={{ color:"#444", fontSize:"var(--fz-xs)", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>На карті</div>
              <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                {([["🌾", 0], ["🪵", 1], ["⛏", 2], ["⚡", 3]] as [string,number][]).map(([icon, k]) => {
                  const [r,g,b] = RES_COLORS[k];
                  return (
                    <span key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"var(--fz-xs)" }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:`rgb(${r},${g},${b})`, display:"inline-block" }} />
                      <span style={{ color:"#444" }}>{icon}</span>
                      <span style={{ color:"#666", fontVariantNumeric:"tabular-nums" }}>{resCounts[k]}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <Act label="🗑 Очистити ресурси" onClick={p.onResClear} danger />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface MapData { width:number; height:number; seed:number; tiles:number[]; }
interface Camera  { x:number; y:number; scale:number; }

export default function EvolutionPage() {
  const [planOpen,   setPlanOpen]   = useState(false);
  const [tiles,      setTiles]      = useState<number[]>([]);
  const [origTiles,  setOrigTiles]  = useState<number[]>([]);
  const [resources,  setResources]  = useState<ResourceDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [seed,       setSeed]       = useState(42);
  const [panelOpen,   setPanelOpen]   = useState(true);
  const [activeTab,   setActiveTab]   = useState<PanelTab>("edit");
  const [spawnRules,  setSpawnRules]  = useState<SpawnRuleDto[]>([]);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogTiles,   setFogTiles]   = useState<Uint8Array>(new Uint8Array(MAP_W * MAP_H));
  const [camera,     setCamera]     = useState<Camera>({ x:0, y:0, scale:1 });
  const [edit,    setEdit]    = useState<EditState>({ enabled:false, tool:"paint", brush:1, tile:1 });
  const [resEdit, setResEdit] = useState<ResEditState>({ kind:0, brush:1 });

  // Refs for event handlers (avoid stale closures)
  const cameraRef     = useRef(camera);
  const editRef       = useRef(edit);
  const resEditRef    = useRef(resEdit);
  const activeTabRef  = useRef(activeTab);
  const tilesRef      = useRef(tiles);
  const fogTilesRef   = useRef(fogTiles);
  const fogEnabledRef = useRef(fogEnabled);
  const viewportRef   = useRef<HTMLDivElement>(null);
  const isDragging    = useRef(false);
  const dragStart     = useRef({ mx:0, my:0, cx:0, cy:0 });
  const didDrag       = useRef(false);

  useEffect(() => { cameraRef.current    = camera;     }, [camera]);
  useEffect(() => { editRef.current      = edit;        }, [edit]);
  useEffect(() => { resEditRef.current   = resEdit;     }, [resEdit]);
  useEffect(() => { activeTabRef.current = activeTab;   }, [activeTab]);
  useEffect(() => { tilesRef.current     = tiles;       }, [tiles]);
  useEffect(() => { fogTilesRef.current  = fogTiles;    }, [fogTiles]);
  useEffect(() => { fogEnabledRef.current = fogEnabled; }, [fogEnabled]);

  // ── Resource lookup map ───────────────────────────────────────────────────
  const resourceMap = useMemo(() => {
    const m: Record<number, ResourceDto> = {};
    for (const r of resources) m[r.y * MAP_W + r.x] = r;
    return m;
  }, [resources]);

  // ── Fetch map + resources ─────────────────────────────────────────────────
  const fetchMap = async (s: number) => {
    setLoading(true);
    try {
      const [mapRes, resRes, rulesRes] = await Promise.all([
        api.get<MapData>("/api/evolution/map",             { params:{ seed:s } }),
        api.get<ResourceDto[]>("/api/evolution/resources", { params:{ seed:s } }),
        api.get<SpawnRuleDto[]>("/api/evolution/spawn-rules"),
      ]);
      setTiles([...mapRes.data.tiles]);
      setOrigTiles([...mapRes.data.tiles]);
      setResources(resRes.data);
      setSpawnRules(rulesRes.data);
      setFogTiles(new Uint8Array(MAP_W * MAP_H));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMap(seed); }, []);

  const reroll = () => { const s = Math.floor(Math.random()*99999); setSeed(s); fetchMap(s); };

  // ── Tile coords from screen ──────────────────────────────────────────────
  const screenToTile = useCallback((clientX: number, clientY: number) => {
    const vp = viewportRef.current!;
    const rect = vp.getBoundingClientRect();
    const cam  = cameraRef.current;
    return {
      tx: Math.floor((clientX - rect.left  - cam.x) / (TILE * cam.scale)),
      ty: Math.floor((clientY - rect.top   - cam.y) / (TILE * cam.scale)),
    };
  }, []);

  // ── Paint tiles ───────────────────────────────────────────────────────────
  const applyPaint = useCallback((clientX: number, clientY: number) => {
    const e = editRef.current;
    if (!e.enabled || activeTabRef.current !== "edit") return;
    const { tx, ty } = screenToTile(clientX, clientY);
    const value = e.tool === "erase" ? 0 : e.tile;
    const half  = Math.floor(e.brush / 2);
    setTiles(prev => {
      const next = [...prev];
      for (let dy = -half; dy <= half; dy++)
        for (let dx = -half; dx <= half; dx++) {
          const nx = tx+dx, ny = ty+dy;
          if (nx>=0 && nx<MAP_W && ny>=0 && ny<MAP_H) next[ny*MAP_W+nx] = value;
        }
      return next;
    });
  }, [screenToTile]);

  // ── Paint resources ───────────────────────────────────────────────────────
  const applyResPaint = useCallback((clientX: number, clientY: number) => {
    const e  = editRef.current;
    const re = resEditRef.current;
    if (!e.enabled || activeTabRef.current !== "resources") return;
    const { tx, ty } = screenToTile(clientX, clientY);
    const half = Math.floor(re.brush / 2);
    const cells: [number,number][] = [];
    for (let dy = -half; dy <= half; dy++)
      for (let dx = -half; dx <= half; dx++) {
        const nx = tx+dx, ny = ty+dy;
        if (nx>=0 && nx<MAP_W && ny>=0 && ny<MAP_H) cells.push([nx, ny]);
      }
    setResources(prev => {
      const next = [...prev];
      for (const [nx, ny] of cells) {
        const idx = next.findIndex(r => r.x === nx && r.y === ny);
        if (re.kind === -1) {
          if (idx >= 0) next.splice(idx, 1);
        } else {
          const entry: ResourceDto = { id:`local-${nx}-${ny}`, x:nx, y:ny, kind:re.kind, amount:80, maxAmount:80 };
          if (idx >= 0) next[idx] = entry; else next.push(entry);
        }
      }
      return next;
    });
  }, [screenToTile]);

  // ── Fog reveal on click ──────────────────────────────────────────────────
  const applyFogReveal = useCallback((clientX: number, clientY: number) => {
    if (!fogEnabledRef.current) return;
    const { tx, ty } = screenToTile(clientX, clientY);
    const R = 10;
    setFogTiles(prev => {
      const next = new Uint8Array(prev);
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++)
          if (dx*dx+dy*dy <= R*R) {
            const nx = tx+dx, ny = ty+dy;
            if (nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H) next[ny*MAP_W+nx] = 1;
          }
      return next;
    });
  }, [screenToTile]);

  // ── Mouse handlers on viewport ───────────────────────────────────────────
  const doPaint = useCallback((cx: number, cy: number) => {
    if (activeTabRef.current === "resources") applyResPaint(cx, cy);
    else applyPaint(cx, cy);
  }, [applyPaint, applyResPaint]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    didDrag.current    = false;
    dragStart.current  = { mx:e.clientX, my:e.clientY, cx:cameraRef.current.x, cy:cameraRef.current.y };
    if (editRef.current.enabled) doPaint(e.clientX, e.clientY);
  }, [doPaint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx)>2 || Math.abs(dy)>2) didDrag.current = true;

    if (editRef.current.enabled) {
      doPaint(e.clientX, e.clientY);
    } else {
      setCamera({ ...cameraRef.current, x: dragStart.current.cx + dx, y: dragStart.current.cy + dy });
    }
  }, [doPaint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!didDrag.current && fogEnabledRef.current && !editRef.current.enabled)
      applyFogReveal(e.clientX, e.clientY);
    isDragging.current = false;
  }, [applyFogReveal]);

  // ── Zoom on wheel ────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const vp   = viewportRef.current!;
    const rect = vp.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const cam  = cameraRef.current;
    const factor    = e.deltaY < 0 ? 1.12 : 1/1.12;
    const newScale  = Math.max(0.25, Math.min(5, cam.scale * factor));
    setCamera({
      scale: newScale,
      x: mx - (mx - cam.x) * (newScale / cam.scale),
      y: my - (my - cam.y) * (newScale / cam.scale),
    });
  }, []);

  // ── Tab click — toggle open/close, switch tab ─────────────────────────────
  const handleTabClick = (tab: PanelTab) => {
    if (panelOpen && activeTab === tab) setPanelOpen(false);
    else { setActiveTab(tab); setPanelOpen(true); }
  };

  // ── Zoom reset ────────────────────────────────────────────────────────────
  const resetCamera = () => setCamera({ x:0, y:0, scale:1 });

  // ── Cursor logic ──────────────────────────────────────────────────────────
  const cursor = edit.enabled ? "crosshair" : isDragging.current ? "grabbing" : "grab";

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />

      <main style={{ flex:1, background:"#080808", minHeight:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>

        {/* Top toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 18px", borderBottom:"1px solid #111", flexShrink:0, background:"#080808" }}>
          <span style={{ color:"#252525", fontSize:"var(--fz-xs)", fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>🧬 Evolution</span>
          <div style={{ flex:1 }} />

          {/* Zoom indicator */}
          <span style={{ color:"#333", fontSize:"var(--fz-xs)", minWidth:52, textAlign:"right" }}>
            {Math.round(camera.scale*100)}%
          </span>
          <button onClick={resetCamera} style={{
            padding:"4px 10px", borderRadius:6, fontSize:"var(--fz-xs)", cursor:"pointer",
            border:"1px solid #1e1e1e", background:"#111", color:"#444", transition:"all 0.15s",
          }}
            onMouseEnter={e=>(e.currentTarget.style.color="#aaa")}
            onMouseLeave={e=>(e.currentTarget.style.color="#444")}
          >1:1</button>

          <div style={{ width:1, height:20, background:"#1e1e1e" }} />

          <span style={{ color:"#333", fontSize:"var(--fz-xs)" }}>seed: {seed}</span>
          <button onClick={reroll} disabled={loading} style={{
            padding:"4px 12px", borderRadius:6, fontSize:"var(--fz-xs)", fontWeight:600, cursor:"pointer",
            border:"1px solid #1e1e1e", background:"#111", color:"#555", transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.color="#aaa";e.currentTarget.style.borderColor="#333";}}
            onMouseLeave={e=>{e.currentTarget.style.color="#555";e.currentTarget.style.borderColor="#1e1e1e";}}
          >↺ Новий острів</button>

          <button onClick={() => setPlanOpen(v=>!v)} style={{
            padding:"4px 12px", borderRadius:6, fontSize:"var(--fz-xs)", fontWeight:700, cursor:"pointer",
            border:`1px solid ${planOpen?"rgba(124,58,237,0.4)":"#1e1e1e"}`,
            background: planOpen?"rgba(124,58,237,0.12)":"#111",
            color: planOpen?"#a78bfa":"#555", transition:"all 0.22s",
          }}>📋 План</button>
        </div>

        {/* Hint bar + resource legend */}
        <div style={{ padding:"4px 18px", background:"#070707", borderBottom:"1px solid #0d0d0d", flexShrink:0, display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ color:"#252525", fontSize:"var(--fz-xs)" }}>
            {edit.enabled
              ? "✎ Режим редагування — малюй по карті"
              : "🖱 Скрол = zoom · Drag = pan" + (fogEnabled ? " · Клік = відкрити туман" : "")}
          </span>
          <div style={{ flex:1 }} />
          {/* Resource legend */}
          {Object.entries(RES_COLORS).map(([kind, [r,g,b]]) => (
            <span key={kind} style={{ display:"flex", alignItems:"center", gap:4, fontSize:"var(--fz-xs)", color:"#383838" }}>
              <span style={{ width:8, height:8, borderRadius:2, flexShrink:0, background:`rgb(${r},${g},${b})`, display:"inline-block" }} />
              {RES_LABELS[+kind]}
            </span>
          ))}
        </div>

        {/* Map viewport */}
        <div
          ref={viewportRef}
          style={{ flex:1, overflow:"hidden", position:"relative", cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDragging.current = false; }}
          onWheel={handleWheel}
        >
          {loading ? (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:"var(--fz-sm)" }}>
              Генерація карти...
            </div>
          ) : (
            <div style={{
              position:"absolute", left:0, top:0,
              transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`,
              transformOrigin:"0 0",
              willChange:"transform",
            }}>
              <MapCanvas tiles={tiles} fogTiles={fogTiles} fogEnabled={fogEnabled} resourceMap={resourceMap} />
            </div>
          )}
        </div>

        {/* Bottom panel */}
        <BottomPanel
          open={panelOpen}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          edit={edit}
          onEdit={patch => setEdit(prev => ({ ...prev, ...patch }))}
          resEdit={resEdit}
          onResEdit={patch => setResEdit(prev => ({ ...prev, ...patch }))}
          resources={resources}
          spawnRules={spawnRules}
          onResClear={() => setResources([])}
          fogEnabled={fogEnabled}
          onFogToggle={() => setFogEnabled(v=>!v)}
          onFogReveal={() => setFogTiles(new Uint8Array(MAP_W*MAP_H).fill(1))}
          onFogHide={()  => setFogTiles(new Uint8Array(MAP_W*MAP_H))}
          onClear={() => setTiles(new Array(MAP_W*MAP_H).fill(0))}
          onReset={() => setTiles([...origTiles])}
        />
      </main>

      <DevPlanPanel open={planOpen} onClose={() => setPlanOpen(false)} />
    </div>
  );
}
