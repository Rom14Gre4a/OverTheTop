"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as signalR from "@microsoft/signalr";
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

// Resource colors (kind: 0=Food 1=Wood 2=Stone 3=Energy 4=Gems 5=Oil 6=Ore)
const RES_COLORS: Record<number, [number, number, number]> = {
  0: [255, 220,  45],  // food    – yellow
  1: [160, 100,  30],  // wood    – brown
  2: [190, 190, 190],  // stone   – gray
  3: [ 50, 210, 255],  // energy  – cyan
  4: [210,  60, 220],  // gems    – magenta  (rare)
  5: [ 30,  30,  30],  // oil     – near-black (rare)
  6: [210, 110,  30],  // ore     – orange    (rare)
};
const RES_LABELS = ["🌾 Їжа", "🪵 Дерево", "⛏ Камінь", "⚡ Енергія", "💎 Самоцвіти", "🛢 Нафта", "🪨 Руда"];

// Pixel-art marker shapes — [dx, dy] offsets within a 10×10 tile
// Common resources use simple, compact shapes; rare ones are more distinctive
const RES_SHAPES: Record<number, ReadonlyArray<[number, number]>> = {
  // Food: small 3×3 center dot
  0: [[3,3],[4,3],[5,3],[3,4],[4,4],[5,4],[3,5],[4,5],[5,5]],
  // Wood: 2-wide tall vertical bar (tree silhouette)
  1: [[4,1],[5,1],[4,2],[5,2],[4,3],[5,3],[4,4],[5,4],[4,5],[5,5],[4,6],[5,6],[4,7],[5,7]],
  // Stone: 4×4 filled square
  2: [[3,3],[4,3],[5,3],[6,3],[3,4],[4,4],[5,4],[6,4],[3,5],[4,5],[5,5],[6,5],[3,6],[4,6],[5,6],[6,6]],
  // Energy: + cross shape
  3: [[4,2],[5,2],[4,3],[5,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[4,6],[5,6],[4,7],[5,7]],
  // Gems (rare): diamond
  4: [[4,1],[5,1],[3,2],[4,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[3,4],[4,4],[5,4],[6,4],[4,5],[5,5]],
  // Oil (rare): filled oval
  5: [[4,2],[5,2],[3,3],[4,3],[5,3],[6,3],[3,4],[4,4],[5,4],[6,4],[3,5],[4,5],[5,5],[6,5],[4,6],[5,6]],
  // Ore (rare): hollow square frame
  6: [[3,3],[4,3],[5,3],[6,3],[3,4],[6,4],[3,5],[6,5],[3,6],[4,6],[5,6],[6,6]],
};

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

interface FactionBonusDto {
  resourceKind: number;
  resourceName: string;
  multiplier:   number;
}

interface BuildingDto {
  type: "hq" | "warehouse" | "campfire";
  x:    number;
  y:    number;
}

interface ColonyStorageDto {
  worldSeed:  number;
  colonyKind: number;
  food:       number;
  wood:       number;
  stone:      number;
  energy:     number;
  gems:       number;
  oil:        number;
  ore:        number;
}

interface ColonyStartDto {
  kind:        number;
  name:        string;
  description: string;
  color:       string;  // hex
  bonuses:     FactionBonusDto[];
  spawnX:      number;
  spawnY:      number;
  buildings:   BuildingDto[];
}

interface UnitDto {
  id:         string;
  worldSeed:  number;
  colonyKind: number;
  class:      number;  // 0=Gatherer 1=Builder 2=Warrior 3=Scout
  className:  string;
  x:          number;
  y:          number;
  hp:         number;
  maxHp:      number;
  strength:   number;
  speed:      number;
  endurance:  number;
  iq:         number;
  hunger:     number;
  fatigue:    number;
  morale:     number;
  task:       number;       // 0=Idle 1=Gather 2=Build 3=Patrol 4=Attack
  targetX:    number | null;
  targetY:    number | null;
}

const UNIT_CLASS_LABELS = ["⛏ Збирач", "🏗 Будівник", "⚔ Воїн", "🏹 Розвідник"];
const TASK_LABELS = ["Спокій", "Збирати", "Будувати", "Патрулювати", "Атакувати"];
const TASK_ICONS  = ["⏸", "⛏", "🏗", "🛡", "⚔"];

// Pixel-art shapes per unit class (drawn over tile on map)
const UNIT_SHAPES: Record<number, ReadonlyArray<[number, number]>> = {
  0: [[4,4],[5,4],[4,5],[5,5]],                                    // Gatherer: 2×2 dot
  1: [[4,3],[5,3],[4,4],[5,4],[4,5],[5,5]],                        // Builder: 2×3 rect
  2: [[5,3],[4,4],[5,4],[6,4],[5,5]],                              // Warrior: diamond
  3: [[4,3],[6,3],[5,4],[4,5],[6,5]],                              // Scout: X
};

// Depleted-tile marker: dark × cross at tile center
const DEPLETED_SHAPE: ReadonlyArray<[number, number]> = [
  [3,3],[4,4],[5,5],[6,6], [6,3],[5,4],[4,5],[3,6],
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function findAdjacentTile(
  cx: number, cy: number, tiles: number[], occupied: Set<number>
): [number, number] {
  const dirs: [number,number][] = [
    [1,0],[0,1],[-1,0],[0,-1],[2,0],[0,2],[-2,0],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = cx+dx, ny = cy+dy;
    if (nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) continue;
    if (tiles[ny*MAP_W+nx]===0) continue;
    if (occupied.has(ny*MAP_W+nx)) continue;
    return [nx, ny];
  }
  return [cx, cy];
}

function computeColonyBuildings(spawnX: number, spawnY: number, tiles: number[]): BuildingDto[] {
  const occ = new Set<number>([spawnY*MAP_W+spawnX]);
  const blds: BuildingDto[] = [{ type:"hq", x:spawnX, y:spawnY }];
  const [wx, wy] = findAdjacentTile(spawnX, spawnY, tiles, occ);
  occ.add(wy*MAP_W+wx);
  blds.push({ type:"warehouse", x:wx, y:wy });
  const [cx, cy] = findAdjacentTile(spawnX, spawnY, tiles, occ);
  blds.push({ type:"campfire", x:cx, y:cy });
  return blds;
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
    { id:"s2-3",  label:"Рідкісні ресурси: самоцвіти, нафта, руда",            done:true  },
    { id:"s2-4",  label:"Іконки / кольорові маркери ресурсів на тайлах",        done:true  },
    { id:"s2-5",  label:"Heatmap-режим: тепловізор концентрації ресурсів",      done:false },
    { id:"s2-6",  label:"Видобуток: зменшення amount при зборі юнітом",         done:true  },
    { id:"s2-7",  label:"Depleted-стан тайлу (візуально виснажений)",           done:true  },
    { id:"s2-8",  label:"Регенерація ресурсів через N тактів",                  done:false },
    { id:"s2-9",  label:"Сезонна залежність (зима: їжа –40%, дерево –20%)",    done:false },
    { id:"s2-10", label:"Склади колоній: накопичення та ліміти запасів",         done:true  },
    { id:"s2-11", label:"Глобальна статистика ресурсів у реальному часі",       done:false },
  ]},

  { title: "Етап 3 · Фракції та колонії", items: [
    { id:"s3-1",  label:"3 фракції: Лісовики / Гірняки / Морські",              done:true  },
    { id:"s3-2",  label:"Унікальні бонуси та слабкості кожної фракції",          done:true  },
    { id:"s3-3",  label:"Точки спавну (стартова відстань ≥ 20 тайлів)",         done:true  },
    { id:"s3-4",  label:"Стартова база: штаб, склад, вогнище",                  done:true  },
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
    { id:"s4-1",  label:"4 базові класи: Збирач / Будівник / Воїн / Розвідник", done:true  },
    { id:"s4-2",  label:"Характеристики: HP, сила, швидкість, витривалість, IQ", done:true  },
    { id:"s4-3",  label:"Потреби юніта: голод, стомленість, мораль",             done:true  },
    { id:"s4-4",  label:"Пошук шляху A* з вагами тайлів (гори=повільно)",       done:true  },
    { id:"s4-5",  label:"Черга задач: збирати / будувати / патрулювати / атакувати", done:true  },
    { id:"s4-6",  label:"Behavior Trees: дерева поведінки для ШІ",               done:false },
    { id:"s4-7",  label:"Автономний розподіл юнітів колонією",                   done:true  },
    { id:"s4-8",  label:"Формації загонів: колона, щит, оточення",               done:false },
    { id:"s4-9",  label:"Спец-юніти: Шаман (бафи), Інженер (будує), Шпигун",   done:false },
    { id:"s4-10", label:"Ранги: Новобранець → Ветеран → Герой",                  done:false },
    { id:"s4-11", label:"Загибель юніта: перманентна / поповнення з бази",      done:true  },
    { id:"s4-12", label:"Режим швидкості: ×1 / ×4 / ×16 / пауза",               done:true  },
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
    { id:"s7-1",  label:"Ближній бій: атака сусіднього тайлу",                   done:true  },
    { id:"s7-2",  label:"Дальній бій: лучники / маги (дальність 3–5 тайлів)",   done:false },
    { id:"s7-3",  label:"Формула бою: сила атаки vs захист + рандом",            done:true  },
    { id:"s7-4",  label:"Облога: захоплення штабу → перемога над колонією",      done:false },
    { id:"s7-5",  label:"Оборонні споруди: стіна, вежа, рів",                    done:false },
    { id:"s7-6",  label:"Тактичний відступ та переформування загону",             done:false },
    { id:"s7-7",  label:"Полонені: захоплення та обмін бранцями",                done:false },
    { id:"s7-8",  label:"Трофеї: захоплення технологій переможеної фракції",     done:false },
    { id:"s7-9",  label:"Герої: унікальні бойові юніти зі спецздібностями",      done:false },
    { id:"s7-10", label:"Нічна тактика: бонус атаки вночі для певних юнітів",   done:false },
  ]},

  { title: "Етап 8 · Панель управління", items: [
    { id:"s8-1",  label:"Статистика: населення, ресурси, вік колонії (live)",    done:true  },
    { id:"s8-2",  label:"Графіки: ріст популяції та споживання ресурсів",        done:false },
    { id:"s8-3",  label:"Overlay карти впливу фракцій",                          done:false },
    { id:"s8-4",  label:"Рейтинг-таблиця фракцій (сила, ресурси, юніти)",       done:false },
    { id:"s8-5",  label:"Журнал подій з фільтрами (бій / дипломатія / еволюція)", done:false },
    { id:"s8-6",  label:"Картка юніта (клік → HP, трейти, XP, завдання)",       done:true  },
    { id:"s8-7",  label:"Картка колонії (клік → огляд, технології, кордони)",   done:false },
    { id:"s8-8",  label:"Експорт статистики симуляції до CSV/JSON",              done:false },
    { id:"s8-9",  label:"Тултіп при наведенні на об'єкти (юніт, ресурс, будівля)", done:true  },
  ]},

  { title: "Етап 9 · Потік подій та Replay", items: [
    { id:"s9-1",  label:"SignalR Hub: стрімінг тактів симуляції на клієнт",      done:true  },
    { id:"s9-2",  label:"Підписка фронтенду на канали подій (народження/бій/…)", done:true  },
    { id:"s9-3",  label:"Спалахи на карті при важливих подіях",                  done:false },
    { id:"s9-4",  label:"Запис усіх тактів до БД (повний Replay)",               done:false },
    { id:"s9-5",  label:"Відтворення збереженої симуляції (перемотка)",          done:false },
    { id:"s9-6",  label:"Позначки: «перейти до такту N» або «до події X»",      done:false },
    { id:"s9-7",  label:"Мультиплеєр-спостереження (кілька браузерів — одна сесія)", done:false },
    { id:"s9-8",  label:"Спливаючі сповіщення про події (бій, народження, ресурси)", done:true  },
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

interface BuildingInfo { type: string; rgb: [number, number, number]; colonyKind: number; }

interface UnitMarker { classNum: number; rgb: [number, number, number]; }

interface MapCanvasProps {
  tiles:         number[];
  fogTiles:      Uint8Array;
  fogEnabled:    boolean;
  resourceMap:   Record<number, ResourceDto>;
  buildingMap:   Record<number, BuildingInfo>;
  depletedTiles: Record<number, number>;
}

function MapCanvas({ tiles, fogTiles, fogEnabled, resourceMap, buildingMap, depletedTiles }: MapCanvasProps) {
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

        // Resource marker — pixel-art shape per kind
        const res = resourceMap[idx];
        if (res && vis) {
          const [rr,rg,rb] = RES_COLORS[res.kind] ?? [255,255,255];
          const shape = RES_SHAPES[res.kind];
          const isRare = res.kind >= 4;

          // For rare resources, draw a faint 1px glow border first
          if (isRare && shape) {
            const gr = Math.min(255, rr + 80);
            const gg = Math.min(255, rg + 80);
            const gb = Math.min(255, rb + 80);
            for (const [dx, dy] of shape) {
              for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
                const nx = dx + ox, ny = dy + oy;
                if (nx < 0 || nx >= TILE || ny < 0 || ny >= TILE) continue;
                const i = ((ty * TILE + ny) * CANVAS_W + tx * TILE + nx) * 4;
                if (d[i+3] === 255) { d[i]=gr; d[i+1]=gg; d[i+2]=gb; }
              }
            }
          }

          // Draw the shape pixels
          if (shape) {
            for (const [dx, dy] of shape) {
              const i = ((ty * TILE + dy) * CANVAS_W + tx * TILE + dx) * 4;
              d[i]=rr; d[i+1]=rg; d[i+2]=rb; d[i+3]=255;
            }
          }
        }
      }
    }

    // Building markers — rendered on top of resources
    for (const key of Object.keys(buildingMap)) {
      const idx = +key;
      const bx  = idx % MAP_W;
      const by  = Math.floor(idx / MAP_W);
      const vis = !fogEnabled || fogTiles[idx] === 1;
      if (!vis) continue;
      const { type, rgb: [br, bg, bb] } = buildingMap[idx];
      if (type === "hq") {
        // 8×8 block in faction color
        for (let dy = 1; dy <= 8; dy++)
          for (let dx = 1; dx <= 8; dx++) {
            const pi = ((by * TILE + dy) * CANVAS_W + bx * TILE + dx) * 4;
            d[pi]=br; d[pi+1]=bg; d[pi+2]=bb; d[pi+3]=255;
          }
        // bright 2×2 center marker
        for (const [dx, dy] of [[4,4],[5,4],[4,5],[5,5]] as [number,number][]) {
          const pi = ((by * TILE + dy) * CANVAS_W + bx * TILE + dx) * 4;
          d[pi]=255; d[pi+1]=255; d[pi+2]=200; d[pi+3]=255;
        }
      } else if (type === "warehouse") {
        // 6×6 block in lighter faction shade
        const lr = Math.min(255, br+70), lg = Math.min(255, bg+70), lb = Math.min(255, bb+70);
        for (let dy = 2; dy <= 7; dy++)
          for (let dx = 2; dx <= 7; dx++) {
            const pi = ((by * TILE + dy) * CANVAS_W + bx * TILE + dx) * 4;
            d[pi]=lr; d[pi+1]=lg; d[pi+2]=lb; d[pi+3]=255;
          }
      } else if (type === "campfire") {
        // orange flame shape
        for (const [dx, dy] of [
          [4,2],[5,2],[3,3],[4,3],[5,3],[6,3],[3,4],[4,4],[5,4],[6,4],[4,5],[5,5],[3,6],[4,6],[5,6],[6,6],
        ] as [number,number][]) {
          const pi = ((by * TILE + dy) * CANVAS_W + bx * TILE + dx) * 4;
          d[pi]=255; d[pi+1]=140; d[pi+2]=20; d[pi+3]=255;
        }
        // bright yellow tip
        for (const [dx, dy] of [[4,2],[5,2],[4,3],[5,3]] as [number,number][]) {
          const pi = ((by * TILE + dy) * CANVAS_W + bx * TILE + dx) * 4;
          d[pi]=255; d[pi+1]=220; d[pi+2]=80; d[pi+3]=255;
        }
      }
    }

    // Depleted tile markers — dark × where resource was exhausted
    for (const key of Object.keys(depletedTiles)) {
      const idx = +key;
      const tx  = idx % MAP_W;
      const ty  = Math.floor(idx / MAP_W);
      const vis = !fogEnabled || fogTiles[idx] === 1;
      if (!vis) continue;
      for (const [dx, dy] of DEPLETED_SHAPE) {
        const pi = ((ty * TILE + dy) * CANVAS_W + tx * TILE + dx) * 4;
        d[pi]=50; d[pi+1]=35; d[pi+2]=35; d[pi+3]=255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [tiles, fogTiles, fogEnabled, resourceMap, buildingMap, depletedTiles]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display:"block", imageRendering:"pixelated", pointerEvents:"none" }}
    />
  );
}

// ─── UnitsCanvas (dynamic layer — redraws on each tick) ──────────────────────

interface UnitsCanvasProps {
  fogTiles:  Uint8Array;
  fogEnabled: boolean;
  unitMap:   Record<number, UnitMarker>;
  unitPaths: Record<string, { x: number; y: number }[]>;
}

function UnitsCanvas({ fogTiles, fogEnabled, unitMap, unitPaths }: UnitsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Unit shapes
    for (const [key, { classNum, rgb: [ur, ug, ub] }] of Object.entries(unitMap)) {
      const idx = +key;
      const ux  = idx % MAP_W;
      const uy  = Math.floor(idx / MAP_W);
      if (fogEnabled && fogTiles[idx] !== 1) continue;
      const lr = Math.min(255, ur+80), lg = Math.min(255, ug+80), lb = Math.min(255, ub+80);
      ctx.fillStyle = `rgb(${lr},${lg},${lb})`;
      for (const [dx, dy] of (UNIT_SHAPES[classNum] ?? UNIT_SHAPES[0]))
        ctx.fillRect(ux * TILE + dx, uy * TILE + dy, 1, 1);
    }

    // Paths
    const half = TILE / 2;
    for (const pts of Object.values(unitPaths)) {
      if (pts.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,220,30,0.25)";
      ctx.lineWidth   = 6;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      ctx.moveTo(pts[0].x * TILE + half, pts[0].y * TILE + half);
      for (let i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i].x * TILE + half, pts[i].y * TILE + half);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,220,30,0.85)";
      ctx.lineWidth   = 2;
      ctx.moveTo(pts[0].x * TILE + half, pts[0].y * TILE + half);
      for (let i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i].x * TILE + half, pts[i].y * TILE + half);
      ctx.stroke();
    }
  }, [fogTiles, fogEnabled, unitMap, unitPaths]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display:"block", imageRendering:"pixelated", pointerEvents:"none",
               position:"absolute", top:0, left:0 }}
    />
  );
}

// ─── UnitCard ─────────────────────────────────────────────────────────────────

function UnitCard({ unit, colony, onClose }: {
  unit:    UnitDto;
  colony:  ColonyStartDto | undefined;
  onClose: () => void;
}) {
  const colColor = colony?.color ?? "#888";

  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div style={{ width:"100%", height:4, background:"#111", borderRadius:2, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.max(0, Math.round(value/max*100))}%`,
                    background:color, borderRadius:2, transition:"width 0.3s" }} />
    </div>
  );

  return (
    <div style={{
      position:"fixed", bottom:110, right:16, zIndex:60, width:200,
      background:"#0c0c0c", border:"1px solid #1e1e1e", borderRadius:10,
      padding:"12px 14px", boxShadow:"0 4px 24px rgba(0,0,0,0.7)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ width:9, height:9, borderRadius:"50%", background:colColor,
                        display:"inline-block", boxShadow:`0 0 6px ${colColor}88`, flexShrink:0 }} />
        <span style={{ color:"#ccc", fontSize:"var(--fz-xs)", fontWeight:700, flex:1 }}>
          {UNIT_CLASS_LABELS[unit.class]}
        </span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#444",
          fontSize:"var(--fz-sm)", cursor:"pointer", lineHeight:1, padding:2 }}
          onMouseEnter={e=>(e.currentTarget.style.color="#aaa")}
          onMouseLeave={e=>(e.currentTarget.style.color="#444")}
        >✕</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:10 }}>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ color:"#555", fontSize:"var(--fz-xs)" }}>❤ HP</span>
            <span style={{ color:"#666", fontSize:"var(--fz-xs)", fontVariantNumeric:"tabular-nums" }}>
              {unit.hp}/{unit.maxHp}
            </span>
          </div>
          <Bar value={unit.hp} max={unit.maxHp} color="#ef4444" />
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ color:"#555", fontSize:"var(--fz-xs)" }}>🌾 Голод</span>
            <span style={{ color:"#666", fontSize:"var(--fz-xs)", fontVariantNumeric:"tabular-nums" }}>
              {Math.round(unit.hunger)}%
            </span>
          </div>
          <Bar value={unit.hunger} max={100} color="#f59e0b" />
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ color:"#555", fontSize:"var(--fz-xs)" }}>⚡ Мораль</span>
            <span style={{ color:"#666", fontSize:"var(--fz-xs)", fontVariantNumeric:"tabular-nums" }}>
              {Math.round(unit.morale)}%
            </span>
          </div>
          <Bar value={unit.morale} max={100} color="#34d399" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 10px", marginBottom:10 }}>
        {([
          ["Сила",      unit.strength],
          ["Швидкість", unit.speed],
          ["Витривал",  unit.endurance],
          ["IQ",        unit.iq],
        ] as [string, number][]).map(([lbl, val]) => (
          <div key={lbl} style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#383838", fontSize:"var(--fz-xs)" }}>{lbl}</span>
            <span style={{ color:"#555", fontSize:"var(--fz-xs)", fontVariantNumeric:"tabular-nums" }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop:"1px solid #141414", paddingTop:8 }}>
        <span style={{ color: unit.task !== 0 ? colColor : "#333", fontSize:"var(--fz-xs)" }}>
          {TASK_ICONS[unit.task]} {TASK_LABELS[unit.task]}
          {unit.targetX !== null && <span style={{ color:"#333" }}> → ({unit.targetX},{unit.targetY})</span>}
        </span>
      </div>
    </div>
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

type PanelTab = "edit" | "resources" | "colonies";

interface BottomPanelProps {
  open:        boolean;
  activeTab:   PanelTab;
  onTabClick:  (tab: PanelTab) => void;
  edit:        EditState;
  onEdit:      (patch: Partial<EditState>) => void;
  resEdit:     ResEditState;
  onResEdit:   (patch: Partial<ResEditState>) => void;
  resources:   ResourceDto[];
  spawnRules:     SpawnRuleDto[];
  colonies:       ColonyStartDto[];
  placingFaction: number | null;
  onStartPlace:   (kind: number) => void;
  units:          UnitDto[];
  onCreateUnit:   (colonyKind: number, unitClass: number) => void;
  onAssignTask:   (unit: UnitDto, taskType: number) => void;
  onResClear:     () => void;
  storages:       Record<number, ColonyStorageDto>;
  fogEnabled:  boolean;
  onFogToggle: () => void;
  onFogReveal: () => void;
  onFogHide:   () => void;
  onClear:     () => void;
  onReset:     () => void;
}

function BottomPanel(p: BottomPanelProps) {
  const TAB_H   = 44;
  const PANEL_H = p.activeTab === "resources" ? 210 : p.activeTab === "colonies" ? 280 : 175;

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

  const resCounts = [0,1,2,3,4,5,6].map(k => p.resources.filter(r => r.kind === k).length);

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
        <Tab id="colonies"  label="🏰 Колонії" />

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
              <Seg label="🌾 Їжа"        val={0}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🪵 Дерево"     val={1}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="⛏ Камінь"     val={2}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="⚡ Енергія"    val={3}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="💎 Самоцвіти" val={4}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🛢 Нафта"      val={5}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🪨 Руда"       val={6}  cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
              <Seg label="🧹 Стерти"     val={-1} cur={p.resEdit.kind} set={v => p.onResEdit({ kind:v })} />
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
                {(([
                  ["🌾",0],["🪵",1],["⛏",2],["⚡",3],
                  ["💎",4],["🛢",5],["🪨",6],
                ] as [string,number][])).map(([icon, k]) => {
                  const [r,g,b] = RES_COLORS[k];
                  const isRare = k >= 4;
                  return (
                    <span key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"var(--fz-xs)" }}>
                      <span style={{ width:8, height:8, borderRadius: k===4?"50%":2, background:`rgb(${r},${g},${b})`, display:"inline-block" }} />
                      <span style={{ color: isRare ? "#555" : "#444" }}>{icon}</span>
                      <span style={{ color: isRare ? "#555" : "#666", fontVariantNumeric:"tabular-nums" }}>{resCounts[k]}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <Act label="🗑 Очистити ресурси" onClick={p.onResClear} danger />
          </div>
        </div>
      )}

      {/* Panel body — Колонії */}
      {p.open && p.activeTab === "colonies" && (
        <div style={{ padding:"14px 20px", height:PANEL_H, boxSizing:"border-box", overflowY:"auto", display:"flex", gap:16, flexWrap:"wrap", alignContent:"flex-start" }}>
          {p.colonies.length === 0
            ? <span style={{ color:"#333", fontSize:"var(--fz-xs)" }}>Фракції ще не завантажено…</span>
            : p.colonies.map(col => (
              <div key={col.kind} style={{
                background:"#0e0e0e", border:`1px solid ${col.color}33`,
                borderRadius:8, padding:"10px 14px", minWidth:175,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ width:10, height:10, borderRadius:"50%", background:col.color, flexShrink:0, display:"inline-block", boxShadow:`0 0 6px ${col.color}88` }} />
                  <span style={{ color:"#ccc", fontSize:"var(--fz-xs)", fontWeight:700 }}>{col.name}</span>
                  <div style={{ flex:1 }} />
                  <button
                    onClick={() => p.onStartPlace(col.kind)}
                    style={{
                      padding:"2px 8px", borderRadius:5, fontSize:"var(--fz-xs)", cursor:"pointer", lineHeight:1.6,
                      border:`1px solid ${p.placingFaction===col.kind ? col.color+"88" : "#1e1e1e"}`,
                      background: p.placingFaction===col.kind ? col.color+"22" : "#111",
                      color: p.placingFaction===col.kind ? col.color : "#444",
                      transition:"all 0.15s",
                    }}
                    onMouseEnter={e=>(e.currentTarget.style.color=col.color)}
                    onMouseLeave={e=>(e.currentTarget.style.color=p.placingFaction===col.kind ? col.color : "#444")}
                  >📍</button>
                </div>
                <div style={{ color:"#3a3a3a", fontSize:"var(--fz-xs)", marginBottom:8, lineHeight:1.4 }}>{col.description}</div>
                <div style={{ color:"#2a2a2a", fontSize:"var(--fz-xs)", marginBottom:8 }}>
                  Спавн: ({col.spawnX}, {col.spawnY})
                </div>
                {/* Bonuses */}
                <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:10 }}>
                  {col.bonuses.map((b, i) => {
                    const pct  = Math.round((b.multiplier - 1) * 100);
                    const good = b.multiplier > 1;
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ color:"#383838", fontSize:"var(--fz-xs)", minWidth:72 }}>{b.resourceName}</span>
                        <span style={{ color: good ? "#4ade80" : "#f87171", fontSize:"var(--fz-xs)", fontVariantNumeric:"tabular-nums" }}>
                          {good ? "+" : ""}{pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Colony storage */}
                {p.storages[col.kind] && (() => {
                  const st = p.storages[col.kind];
                  const entries: [string, number][] = [
                    ["🌾", st.food], ["🪵", st.wood], ["⛏", st.stone], ["⚡", st.energy],
                    ["💎", st.gems], ["🛢", st.oil],  ["🪨", st.ore],
                  ].filter(([, v]) => (v as number) > 0) as [string, number][];
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ borderTop:"1px solid #141414", paddingTop:6, marginBottom:8 }}>
                      <div style={{ color:"#2a2a2a", fontSize:"var(--fz-xs)", marginBottom:4 }}>Склад:</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"2px 10px" }}>
                        {entries.map(([icon, val]) => (
                          <span key={icon} style={{ color:"#555", fontSize:"var(--fz-xs)" }}>{icon} {val}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Create unit buttons */}
                <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:8, marginBottom:8 }}>
                  <div style={{ color:"#333", fontSize:"var(--fz-xs)", marginBottom:5 }}>+ Юніт:</div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {[0,1,2,3].map(cls => (
                      <button key={cls}
                        onClick={() => p.onCreateUnit(col.kind, cls)}
                        style={{
                          padding:"3px 8px", borderRadius:5, fontSize:"var(--fz-xs)", cursor:"pointer",
                          border:"1px solid #1e1e1e", background:"#111", color:"#555", transition:"all 0.12s",
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.color=col.color;e.currentTarget.style.borderColor=col.color+"55";}}
                        onMouseLeave={e=>{e.currentTarget.style.color="#555";e.currentTarget.style.borderColor="#1e1e1e";}}
                      >{UNIT_CLASS_LABELS[cls]}</button>
                    ))}
                  </div>
                </div>

                {/* Unit list with task assignment */}
                {(() => {
                  const colUnits = p.units.filter(u => u.colonyKind === col.kind);
                  if (colUnits.length === 0) return null;
                  return (
                    <div style={{ borderTop:"1px solid #141414", paddingTop:8 }}>
                      <div style={{ color:"#2a2a2a", fontSize:"var(--fz-xs)", marginBottom:5 }}>
                        Юніти ({colUnits.length}):
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        {colUnits.map(u => (
                          <div key={u.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ color:"#444", fontSize:"var(--fz-xs)", minWidth:72 }}>
                              {UNIT_CLASS_LABELS[u.class]}
                            </span>
                            <span style={{ color:"#2a2a2a", fontSize:9 }}>
                              {TASK_ICONS[u.task]} {TASK_LABELS[u.task]}
                            </span>
                            <div style={{ flex:1 }} />
                            <div style={{ display:"flex", gap:2 }}>
                              {[0,1,2,3,4].map(t => (
                                <button key={t}
                                  onClick={() => p.onAssignTask(u, t)}
                                  title={TASK_LABELS[t]}
                                  style={{
                                    width:20, height:20, borderRadius:4, fontSize:9, cursor:"pointer",
                                    border:`1px solid ${u.task===t ? col.color+"66" : "#1a1a1a"}`,
                                    background: u.task===t ? col.color+"22" : "#0e0e0e",
                                    color: u.task===t ? col.color : "#333",
                                    padding:0, lineHeight:"20px", textAlign:"center",
                                  }}
                                  onMouseEnter={e=>{e.currentTarget.style.color=col.color;}}
                                  onMouseLeave={e=>{e.currentTarget.style.color=u.task===t?col.color:"#333";}}
                                >{TASK_ICONS[t]}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Map Tooltip ──────────────────────────────────────────────────────────────

function MapTooltip({ tooltip }: { tooltip: { sx: number; sy: number; lines: string[][] } | null }) {
  if (!tooltip) return null;
  return (
    <div style={{
      position: "fixed", left: tooltip.sx + 14, top: tooltip.sy + 10,
      zIndex: 1200, background: "rgba(6,6,6,0.96)", border: "1px solid #1e1e1e",
      borderRadius: 5, padding: "5px 9px", pointerEvents: "none",
      fontSize: 10, color: "#666", whiteSpace: "nowrap",
    }}>
      {tooltip.lines.map((line, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{line[0]}</span>
          {line[1] && <span style={{ color: "#999" }}>{line[1]}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Notification Stack ───────────────────────────────────────────────────────

function NotifStack({ notifs }: { notifs: { id: number; icon: string; text: string }[] }) {
  if (notifs.length === 0) return null;
  return (
    <div style={{
      position: "fixed", top: 52, right: 16, zIndex: 1100,
      display: "flex", flexDirection: "column", gap: 4, pointerEvents: "none",
    }}>
      {notifs.map(n => (
        <div key={n.id} style={{
          background: "rgba(8,8,8,0.94)", border: "1px solid #1e1e1e",
          borderRadius: 5, padding: "4px 10px", fontSize: 11, color: "#666",
        }}>
          {n.icon} {n.text}
        </div>
      ))}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ colonies, units, storages }: {
  colonies: ColonyStartDto[];
  units:    UnitDto[];
  storages: Record<number, ColonyStorageDto>;
}) {
  if (colonies.length === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 18, padding: "3px 18px",
      background: "#060606", borderBottom: "1px solid #0d0d0d",
      flexShrink: 0, minHeight: 28, flexWrap: "wrap",
    }}>
      {colonies.map((col, i) => {
        const count = units.filter(u => u.colonyKind === col.kind).length;
        const st    = storages[col.kind];
        return (
          <span key={col.kind} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
            {i > 0 && <span style={{ color: "#1a1a1a", marginRight: 4 }}>│</span>}
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ color: "#555", fontWeight: 600 }}>{col.name}</span>
            <span style={{ color: "#383838" }}>👥 {count}</span>
            {st && <>
              <span style={{ color: "#333" }}>🌾 {st.food}</span>
              <span style={{ color: "#333" }}>🪵 {st.wood}</span>
              <span style={{ color: "#333" }}>⛏ {st.stone}</span>
            </>}
          </span>
        );
      })}
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
  const [colonies,    setColonies]    = useState<ColonyStartDto[]>([]);
  const [units,       setUnits]       = useState<UnitDto[]>([]);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogTiles,   setFogTiles]   = useState<Uint8Array>(new Uint8Array(MAP_W * MAP_H));
  const [camera,     setCamera]     = useState<Camera>({ x:0, y:0, scale:1 });
  const [edit,    setEdit]    = useState<EditState>({ enabled:false, tool:"paint", brush:1, tile:1 });
  const [resEdit,        setResEdit]        = useState<ResEditState>({ kind:0, brush:1 });
  const [placingFaction, setPlacingFaction] = useState<number | null>(null);
  const [taskMode,       setTaskMode]       = useState<{ unit: UnitDto; taskType: number } | null>(null);
  const [unitPaths,      setUnitPaths]      = useState<Record<string, { x:number; y:number }[]>>({});
  const [storages,       setStorages]       = useState<Record<number, ColonyStorageDto>>({});
  const [depletedTiles,  setDepletedTiles]  = useState<Record<number, number>>({});
  const [selectedUnit,   setSelectedUnit]   = useState<UnitDto | null>(null);
  const [speed,          setSpeed]          = useState(1);
  const [tooltip,        setTooltip]        = useState<{ sx: number; sy: number; lines: string[][] } | null>(null);
  const [notifs,         setNotifs]         = useState<{ id: number; icon: string; text: string }[]>([]);
  const [notifsEnabled,  setNotifsEnabled]  = useState(true);

  // Refs for event handlers (avoid stale closures)
  const cameraRef     = useRef(camera);
  const editRef       = useRef(edit);
  const resEditRef    = useRef(resEdit);
  const activeTabRef  = useRef(activeTab);
  const tilesRef      = useRef(tiles);
  const fogTilesRef   = useRef(fogTiles);
  const fogEnabledRef = useRef(fogEnabled);
  const placingFactionRef = useRef<number | null>(null);
  const taskModeRef       = useRef<{ unit: UnitDto; taskType: number } | null>(null);
  const seedRef           = useRef(seed);
  const unitsRef          = useRef(units);
  const coloniesRef       = useRef(colonies);
  const resourceMapRef    = useRef<Record<number, ResourceDto>>({});
  const buildingMapRef    = useRef<Record<number, BuildingInfo>>({});
  const depletedTilesRef  = useRef<Record<number, number>>({});
  const unitLookupRef     = useRef<Record<number, UnitDto>>({});
  const notifIdRef        = useRef(0);
  const notifsEnabledRef  = useRef(true);
  const viewportRef       = useRef<HTMLDivElement>(null);
  const isDragging        = useRef(false);
  const dragStart     = useRef({ mx:0, my:0, cx:0, cy:0 });
  const didDrag       = useRef(false);

  useEffect(() => { cameraRef.current    = camera;     }, [camera]);
  useEffect(() => { editRef.current      = edit;        }, [edit]);
  useEffect(() => { resEditRef.current   = resEdit;     }, [resEdit]);
  useEffect(() => { activeTabRef.current = activeTab;   }, [activeTab]);
  useEffect(() => { tilesRef.current     = tiles;       }, [tiles]);
  useEffect(() => { fogTilesRef.current  = fogTiles;    }, [fogTiles]);
  useEffect(() => { fogEnabledRef.current    = fogEnabled;      }, [fogEnabled]);
  useEffect(() => { placingFactionRef.current = placingFaction; }, [placingFaction]);
  useEffect(() => { taskModeRef.current = taskMode; }, [taskMode]);
  useEffect(() => { seedRef.current  = seed;  }, [seed]);
  useEffect(() => { unitsRef.current     = units;        }, [units]);
  useEffect(() => { coloniesRef.current  = colonies;     }, [colonies]);
  useEffect(() => { notifsEnabledRef.current = notifsEnabled; }, [notifsEnabled]);
  useEffect(() => {
    const m: Record<number, UnitDto> = {};
    for (const u of units) m[u.y * MAP_W + u.x] = u;
    unitLookupRef.current = m;
  }, [units]);

  // ── Resource lookup map ───────────────────────────────────────────────────
  const resourceMap = useMemo(() => {
    const m: Record<number, ResourceDto> = {};
    for (const r of resources) m[r.y * MAP_W + r.x] = r;
    return m;
  }, [resources]);

  // ── Unit lookup map (tile index → marker for rendering) ──────────────────
  const unitMap = useMemo(() => {
    const m: Record<number, UnitMarker> = {};
    const colRgb: Record<number, [number,number,number]> = {};
    for (const col of colonies) colRgb[col.kind] = hexToRgb(col.color);
    for (const u of units) {
      const rgb = colRgb[u.colonyKind] ?? [200,200,200];
      m[u.y * MAP_W + u.x] = { classNum: u.class, rgb };
    }
    return m;
  }, [units, colonies]);

  // ── Building lookup map ───────────────────────────────────────────────────
  const buildingMap = useMemo(() => {
    const m: Record<number, BuildingInfo> = {};
    for (const col of colonies) {
      const rgb = hexToRgb(col.color);
      for (const bld of col.buildings)
        m[bld.y * MAP_W + bld.x] = { type: bld.type, rgb, colonyKind: col.kind };
    }
    return m;
  }, [colonies]);

  useEffect(() => { resourceMapRef.current  = resourceMap;  }, [resourceMap]);
  useEffect(() => { buildingMapRef.current  = buildingMap;  }, [buildingMap]);
  useEffect(() => { depletedTilesRef.current = depletedTiles; }, [depletedTiles]);

  // ── Create unit ──────────────────────────────────────────────────────────
  const createUnit = async (colonyKind: number, unitClass: number) => {
    const col = colonies.find(c => c.kind === colonyKind);
    if (!col) return;
    const hq = col.buildings.find(b => b.type === "hq") ?? { x: col.spawnX, y: col.spawnY };
    try {
      const res = await api.post<UnitDto>("/api/evolution/units", {
        worldSeed: seed, colonyKind, class: unitClass, x: hq.x, y: hq.y,
      });
      setUnits(prev => [...prev, res.data]);
    } catch { /* ignore */ }
  };

  // ── Assign task to unit ──────────────────────────────────────────────────
  const assignTask = useCallback((unit: UnitDto, taskType: number) => {
    if (taskType === 0) {
      // Idle — no target needed, apply immediately
      (async () => {
        try {
          const res = await api.post<UnitDto>(`/api/evolution/units/${unit.id}/task`, {
            taskType: 0, targetX: null, targetY: null,
          });
          setUnits(prev => prev.map(u => u.id === unit.id ? res.data : u));
          setUnitPaths(prev => { const n = { ...prev }; delete n[unit.id]; return n; });
        } catch { /* ignore */ }
      })();
    } else {
      setTaskMode({ unit, taskType });
    }
  }, []);

  const assignTaskWithTarget = useCallback(async (unit: UnitDto, taskType: number, tx: number, ty: number) => {
    try {
      const res = await api.post<{ unit: UnitDto; path: { x:number; y:number }[] | null }>(
        `/api/evolution/units/${unit.id}/task`,
        { taskType, targetX: tx, targetY: ty }
      );
      setUnits(prev => prev.map(u => u.id === unit.id ? res.data.unit : u));
      if (res.data.path?.length) {
        setUnitPaths(prev => ({ ...prev, [unit.id]: res.data.path! }));
      }
    } catch { /* ignore */ }
  }, []);

  // ── Place colony base manually ────────────────────────────────────────────
  const placeColony = useCallback((kind: number, tx: number, ty: number) => {
    const t = tilesRef.current;
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return;
    if (t[ty * MAP_W + tx] === 0) return; // reject water tiles
    const buildings = computeColonyBuildings(tx, ty, t);
    setColonies(prev => prev.map(col =>
      col.kind !== kind ? col : { ...col, spawnX: tx, spawnY: ty, buildings }
    ));
  }, []);

  // ── Fetch map + resources ─────────────────────────────────────────────────
  const fetchMap = async (s: number) => {
    setLoading(true);
    try {
      const [mapRes, resRes, rulesRes, colRes, unitRes, storRes] = await Promise.all([
        api.get<MapData>("/api/evolution/map",                    { params:{ seed:s } }),
        api.get<ResourceDto[]>("/api/evolution/resources",         { params:{ seed:s } }),
        api.get<SpawnRuleDto[]>("/api/evolution/spawn-rules"),
        api.get<ColonyStartDto[]>("/api/evolution/colony-start",   { params:{ seed:s } }),
        api.get<UnitDto[]>("/api/evolution/units",                 { params:{ seed:s } }),
        api.get<ColonyStorageDto[]>("/api/evolution/storage",      { params:{ seed:s } }),
      ]);
      setTiles([...mapRes.data.tiles]);
      setOrigTiles([...mapRes.data.tiles]);
      setResources(resRes.data);
      setSpawnRules(rulesRes.data);
      setColonies(colRes.data);
      setUnits(unitRes.data);
      setFogTiles(new Uint8Array(MAP_W * MAP_H));
      setDepletedTiles({});
      setSelectedUnit(null);
      const storMap: Record<number, ColonyStorageDto> = {};
      for (const st of storRes.data) storMap[st.colonyKind] = st;
      setStorages(storMap);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMap(seed); }, []);

  // ── SignalR — real-time unit movement ────────────────────────────────────
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBase}/hubs/simulation`)
      .withAutomaticReconnect()
      .build();

    conn.on("UnitsMoved", (updates: { id: string; x: number; y: number; task: number }[]) => {
      setUnits(prev => {
        const next = [...prev];
        for (const upd of updates) {
          const i = next.findIndex(u => u.id === upd.id);
          if (i >= 0) next[i] = { ...next[i], x: upd.x, y: upd.y, task: upd.task };
        }
        return next;
      });
      setSelectedUnit(prev => {
        if (!prev) return prev;
        const upd = updates.find(u => u.id === prev.id);
        return upd ? { ...prev, x: upd.x, y: upd.y, task: upd.task } : prev;
      });
      setUnitPaths(prev => {
        let changed = false;
        const next = { ...prev };
        for (const upd of updates) {
          if (upd.task === 0) {
            if (next[upd.id]) { delete next[upd.id]; changed = true; }
          } else if (next[upd.id]?.length > 1) {
            next[upd.id] = next[upd.id].slice(1);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    conn.on("UnitsDied", (ids: string[]) => {
      const dead = new Set(ids);
      setUnits(prev => prev.filter(u => !dead.has(u.id)));
      setSelectedUnit(prev => (prev && dead.has(prev.id)) ? null : prev);
      setUnitPaths(prev => {
        const next = { ...prev };
        let changed = false;
        for (const id of ids) { if (next[id]) { delete next[id]; changed = true; } }
        return changed ? next : prev;
      });
      if (notifsEnabledRef.current && ids.length > 0) {
        const id = ++notifIdRef.current;
        setNotifs(prev => [...prev.slice(-4), { id, icon: "☠", text: `${ids.length} юніт${ids.length === 1 ? "" : "и"} загинул${ids.length === 1 ? "о" : "и"}` }]);
        setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 3500);
      }
    });

    conn.on("StorageUpdated", (updates: ColonyStorageDto[]) => {
      setStorages(prev => {
        const next = { ...prev };
        for (const upd of updates) next[upd.colonyKind] = upd;
        return next;
      });
    });

    conn.on("ResourceUpdated", (updates: { worldSeed: number; x: number; y: number; newAmount: number; kind: number; maxAmount: number }[]) => {
      setResources(prev => {
        const next = [...prev];
        for (const upd of updates) {
          const idx = next.findIndex(r => r.x === upd.x && r.y === upd.y);
          if (upd.newAmount <= 0) {
            if (idx >= 0) next.splice(idx, 1);
          } else if (idx >= 0) {
            next[idx] = { ...next[idx], amount: upd.newAmount };
          } else {
            next.push({ id: `${upd.x}-${upd.y}`, x: upd.x, y: upd.y, kind: upd.kind, amount: upd.newAmount, maxAmount: upd.maxAmount });
          }
        }
        return next;
      });
      setDepletedTiles(prev => {
        const next = { ...prev };
        for (const u of updates) {
          if (u.newAmount <= 0) next[u.y * MAP_W + u.x] = u.kind;
          else delete next[u.y * MAP_W + u.x];
        }
        return next;
      });
      if (notifsEnabledRef.current) {
        const regenCount = updates.filter(u => u.newAmount > 0 && (u.y * MAP_W + u.x) in depletedTilesRef.current).length;
        if (regenCount > 0) {
          const id = ++notifIdRef.current;
          setNotifs(prev => [...prev.slice(-4), { id, icon: "🌱", text: `${regenCount} ресурс${regenCount === 1 ? "" : "и"} відновил${regenCount === 1 ? "ся" : "ись"}` }]);
          setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 3500);
        }
      }
    });

    conn.on("UnitsSpawned", (newUnits: UnitDto[]) => {
      setUnits(prev => [...prev, ...newUnits]);
      if (notifsEnabledRef.current && newUnits.length > 0) {
        const id = ++notifIdRef.current;
        const names = newUnits.map(u => UNIT_CLASS_LABELS[u.class]).join(", ");
        setNotifs(prev => [...prev.slice(-4), { id, icon: "👶", text: `${names} народил${newUnits.length === 1 ? "ся" : "ись"}` }]);
        setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 3500);
      }
    });

    conn.start().catch(() => { /* silently ignore — server may not be running */ });
    return () => { conn.stop(); };
  }, []);

  const reroll = () => { const s = Math.floor(Math.random()*99999); setSeed(s); fetchMap(s); };

  const setSimSpeed = async (m: number) => {
    setSpeed(m);
    try { await api.post("/api/evolution/speed", { multiplier: m }); } catch { /* ignore */ }
  };

  // ── ESC cancels placement / task mode ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPlacingFaction(null); setTaskMode(null); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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

  // ── Hover tooltip ────────────────────────────────────────────────────────
  const BLD_NAMES: Record<string, string> = { hq: "🏠 Штаб", warehouse: "🏪 Склад", campfire: "🔥 Вогнище" };

  const handleTooltipMove = useCallback((e: React.MouseEvent) => {
    if (activeTabRef.current === "edit") { setTooltip(null); return; }
    const { tx, ty } = screenToTile(e.clientX, e.clientY);
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) { setTooltip(null); return; }
    const idx = ty * MAP_W + tx;
    if (fogEnabledRef.current && fogTilesRef.current[idx] !== 1) { setTooltip(null); return; }

    const sx = e.clientX, sy = e.clientY;

    const unit = unitLookupRef.current[idx];
    if (unit) {
      const col = coloniesRef.current.find(c => c.kind === unit.colonyKind);
      setTooltip({ sx, sy, lines: [
        [UNIT_CLASS_LABELS[unit.class], col?.name ?? ""],
        ["HP",    `${unit.hp}/${unit.maxHp}`],
        ["Голод", `${Math.floor(unit.hunger)}%`],
        [TASK_ICONS[unit.task] + " " + TASK_LABELS[unit.task], ""],
      ]});
      return;
    }

    const bld = buildingMapRef.current[idx];
    if (bld) {
      const col = coloniesRef.current.find(c => c.kind === bld.colonyKind);
      setTooltip({ sx, sy, lines: [[BLD_NAMES[bld.type] ?? bld.type, col?.name ?? ""]] });
      return;
    }

    const res = resourceMapRef.current[idx];
    if (res) {
      setTooltip({ sx, sy, lines: [[RES_LABELS[res.kind], `${res.amount} / ${res.maxAmount}`]] });
      return;
    }

    if (idx in depletedTilesRef.current) {
      const kind = depletedTilesRef.current[idx];
      setTooltip({ sx, sy, lines: [["🌑 Вичерпано", RES_LABELS[kind]]] });
      return;
    }

    setTooltip(null);
  }, [screenToTile]);

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
    if (!didDrag.current) {
      const tm = taskModeRef.current;
      const pf = placingFactionRef.current;
      const { tx, ty } = screenToTile(e.clientX, e.clientY);
      if (tm !== null) {
        assignTaskWithTarget(tm.unit, tm.taskType, tx, ty);
        setTaskMode(null);
      } else if (pf !== null) {
        placeColony(pf, tx, ty);
        setPlacingFaction(null);
      } else if (!editRef.current.enabled) {
        // check for unit click
        const clicked = unitsRef.current.find(u => u.x === tx && u.y === ty);
        if (clicked) {
          setSelectedUnit(prev => prev?.id === clicked.id ? null : clicked);
        } else if (fogEnabledRef.current) {
          applyFogReveal(e.clientX, e.clientY);
        } else {
          setSelectedUnit(null);
        }
      }
    }
    isDragging.current = false;
  }, [applyFogReveal, assignTaskWithTarget, placeColony, screenToTile]);

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
  const cursor = (edit.enabled || placingFaction !== null || taskMode !== null) ? "crosshair" : isDragging.current ? "grabbing" : "grab";

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

          {/* Speed controls */}
          {([0,1,4,16] as const).map(m => (
            <button key={m} onClick={() => setSimSpeed(m)} style={{
              padding:"4px 10px", borderRadius:6, fontSize:"var(--fz-xs)", cursor:"pointer",
              border:`1px solid ${speed===m ? "#a78bfa55" : "#1e1e1e"}`,
              background: speed===m ? "rgba(139,92,246,0.12)" : "#111",
              color: speed===m ? "#a78bfa" : "#555", transition:"all 0.12s",
            }}
              onMouseEnter={e=>(e.currentTarget.style.color="#aaa")}
              onMouseLeave={e=>(e.currentTarget.style.color=speed===m?"#a78bfa":"#555")}
            >{m === 0 ? "⏸" : `×${m}`}</button>
          ))}

          <div style={{ width:1, height:20, background:"#1e1e1e" }} />

          <label style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", userSelect:"none", fontSize:"var(--fz-xs)", color: notifsEnabled ? "#555" : "#333" }}>
            <input type="checkbox" checked={notifsEnabled} onChange={e => { setNotifsEnabled(e.target.checked); notifsEnabledRef.current = e.target.checked; }} style={{ accentColor:"#a78bfa", cursor:"pointer" }} />
            Сповіщення
          </label>

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
          <span style={{ color: (placingFaction !== null || taskMode !== null) ? "#a78bfa" : "#252525", fontSize:"var(--fz-xs)" }}>
            {taskMode !== null
              ? `${TASK_ICONS[taskMode.taskType]} ${TASK_LABELS[taskMode.taskType]} — клікни на карту щоб вибрати ціль · ESC = скасувати`
              : placingFaction !== null
              ? `📍 Клікни на карту щоб розмістити базу «${colonies.find(c=>c.kind===placingFaction)?.name ?? ""}» · ESC = скасувати`
              : edit.enabled
              ? "✎ Режим редагування — малюй по карті"
              : "🖱 Скрол = zoom · Drag = pan" + (fogEnabled ? " · Клік = відкрити туман" : "")}
          </span>
          <div style={{ flex:1 }} />
          {/* Resource legend */}
          {Object.entries(RES_COLORS).map(([kind, [r,g,b]]) => {
            const isRare = +kind >= 4;
            return (
              <span key={kind} style={{ display:"flex", alignItems:"center", gap:4, fontSize:"var(--fz-xs)", color: isRare ? "#555" : "#383838" }}>
                <span style={{
                  width:8, height:8, borderRadius: +kind === 4 ? "50%" : 2, flexShrink:0,
                  background:`rgb(${r},${g},${b})`,
                  display:"inline-block",
                  boxShadow: isRare ? `0 0 4px rgb(${r},${g},${b})` : "none",
                }} />
                {RES_LABELS[+kind]}
                {isRare && <span style={{ color:"#333", fontSize:9 }}>✦</span>}
              </span>
            );
          })}
        </div>

        {/* Stats bar */}
        <StatsBar colonies={colonies} units={units} storages={storages} />

        {/* Map viewport */}
        <div
          ref={viewportRef}
          style={{ flex:1, overflow:"hidden", position:"relative", cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => { handleMouseMove(e); handleTooltipMove(e); }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDragging.current = false; setTooltip(null); }}
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
              <div style={{ position:"relative", width:CANVAS_W, height:CANVAS_H }}>
                <MapCanvas tiles={tiles} fogTiles={fogTiles} fogEnabled={fogEnabled} resourceMap={resourceMap} buildingMap={buildingMap} depletedTiles={depletedTiles} />
                <UnitsCanvas fogTiles={fogTiles} fogEnabled={fogEnabled} unitMap={unitMap} unitPaths={unitPaths} />
              </div>
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
          colonies={colonies}
          placingFaction={placingFaction}
          onStartPlace={kind => setPlacingFaction(prev => prev === kind ? null : kind)}
          units={units}
          onCreateUnit={createUnit}
          onAssignTask={assignTask}
          onResClear={() => setResources([])}
          storages={storages}
          fogEnabled={fogEnabled}
          onFogToggle={() => setFogEnabled(v=>!v)}
          onFogReveal={() => setFogTiles(new Uint8Array(MAP_W*MAP_H).fill(1))}
          onFogHide={()  => setFogTiles(new Uint8Array(MAP_W*MAP_H))}
          onClear={() => setTiles(new Array(MAP_W*MAP_H).fill(0))}
          onReset={() => setTiles([...origTiles])}
        />
      </main>

      {selectedUnit && (
        <UnitCard
          unit={selectedUnit}
          colony={colonies.find(c => c.kind === selectedUnit.colonyKind)}
          onClose={() => setSelectedUnit(null)}
        />
      )}

      <DevPlanPanel open={planOpen} onClose={() => setPlanOpen(false)} />
      <MapTooltip tooltip={tooltip} />
      <NotifStack notifs={notifs} />
    </div>
  );
}
