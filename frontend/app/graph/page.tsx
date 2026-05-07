"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  loadGraphColors, mkStyle,
  GRAPH_GROUPS, groupBBox,
  type GraphStatus,
} from "@/lib/graphColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "ready" | "wip" | "planned" | "new";

interface GNode {
  id: string;
  label: string;
  desc: string;
  status: Status;
  href?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
  hub?: boolean;
  roulette?: boolean;
}

interface GEdge {
  a: string;
  b: string;
  dash?: boolean;
}

// ─── Graph Data ───────────────────────────────────────────────────────────────

const NODES: GNode[] = [
  { id: "hub",         label: "OverTheTop",           desc: "Центр платформи армрестлера",      status: "ready",   x: 490, y: 330, w: 185, h: 88,  icon: "💪", hub: true },
  { id: "auth",        label: "Профіль",               desc: "Реєстрація, вхід, дані атлета",    status: "ready",   href: "/profile",     x: 60,  y: 55,  w: 148, h: 68, icon: "👤" },
  { id: "plan",        label: "Тренувальні плани",     desc: "Макро / мезо / мікроцикли",        status: "ready",   href: "/training",    x: 45,  y: 260, w: 158, h: 68, icon: "📅" },
  { id: "exercises",   label: "Бібліотека вправ",      desc: "Вправи армрестлера за стилем",     status: "ready",   x: 235, y: 110, w: 155, h: 68, icon: "🏋️" },
  { id: "log",         label: "Журнал тренувань",      desc: "Підходи, вага, сети, таймер",      status: "wip",     x: 155, y: 440, w: 160, h: 68, icon: "📝" },
  { id: "today",       label: "Сьогодні",              desc: "Daily check-in і план дня",        status: "wip",     x: 355, y: 545, w: 145, h: 68, icon: "☀️" },
  { id: "weight",      label: "Вага тіла",             desc: "Хронологія і цільовий трекінг",    status: "planned", x: 55,  y: 608, w: 148, h: 68, icon: "⚖️" },
  { id: "food",        label: "Що їстимемо?",          desc: "Рулетка страв для атлета",         status: "new",     x: 560, y: 45,  w: 168, h: 68, icon: "🎲", roulette: true },
  { id: "notif",       label: "Сповіщення",            desc: "Нагадування і дні тренувань",      status: "planned", x: 870, y: 55,  w: 155, h: 68, icon: "🔔" },
  { id: "tournaments", label: "Турніри",               desc: "Календар, цілі, результати",       status: "ready",   href: "/tournaments", x: 910, y: 185, w: 150, h: 68, icon: "🏆" },
  { id: "matches",     label: "Матчі",                 desc: "Статистика поєдинків і win/loss",  status: "planned", x: 1032, y: 358, w: 148, h: 68, icon: "🤼" },
  { id: "analytics",   label: "Аналітика",             desc: "6 вкладок аналізу прогресу",       status: "wip",     href: "/analytics",   x: 845, y: 432, w: 155, h: 68, icon: "📊" },
  { id: "progress",    label: "Прогрес сили",          desc: "Графіки вправ і середній приріст", status: "planned", x: 875, y: 615, w: 155, h: 68, icon: "📈" },
  { id: "recovery",    label: "Відновлення",           desc: "Сон, стрес, больові точки",        status: "planned", x: 615, y: 568, w: 158, h: 68, icon: "😴" },
  { id: "records",     label: "Рекорди (PR)",          desc: "Особисті рекорди по вправах",      status: "planned", x: 380, y: 672, w: 155, h: 68, icon: "🥇" },
  { id: "mobile",      label: "Мобільна версія",       desc: "Touch-friendly режим у залі",      status: "planned", x: 605, y: 752, w: 163, h: 68, icon: "📱" },
  { id: "almanac",     label: "Альманах",              desc: "Зірки, техніки, історія армрестлінгу", status: "ready", href: "/almanac", x: 1032, y: 570, w: 155, h: 68, icon: "📖" },
];

const EDGES: GEdge[] = [
  { a: "hub",         b: "auth" },
  { a: "hub",         b: "plan" },
  { a: "hub",         b: "tournaments" },
  { a: "hub",         b: "analytics" },
  { a: "hub",         b: "today" },
  { a: "hub",         b: "food" },
  { a: "hub",         b: "recovery" },
  { a: "hub",         b: "notif",      dash: true },
  { a: "hub",         b: "mobile",     dash: true },
  { a: "auth",        b: "plan" },
  { a: "plan",        b: "exercises" },
  { a: "plan",        b: "log" },
  { a: "log",         b: "today" },
  { a: "log",         b: "records",    dash: true },
  { a: "log",         b: "weight",     dash: true },
  { a: "log",         b: "analytics" },
  { a: "weight",      b: "analytics",  dash: true },
  { a: "recovery",    b: "analytics",  dash: true },
  { a: "records",     b: "analytics",  dash: true },
  { a: "tournaments", b: "matches",    dash: true },
  { a: "tournaments", b: "analytics" },
  { a: "analytics",   b: "progress",   dash: true },
  { a: "matches",     b: "analytics",  dash: true },
  { a: "today",       b: "recovery",   dash: true },
  { a: "hub",         b: "almanac" },
  { a: "analytics",   b: "almanac",    dash: true },
];

// ─── Status Config (now dynamic — built from saved colors) ───────────────────

const STATUS_LABELS: Record<Status, string> = {
  ready: "Готово", wip: "В роботі", planned: "Заплановано", new: "Нова ідея",
};

function buildST(colors: Record<GraphStatus, string>) {
  return Object.fromEntries(
    (Object.entries(colors) as [GraphStatus, string][]).map(([k, hex]) => {
      const s = mkStyle(hex);
      return [k, { label: STATUS_LABELS[k as Status], ...s }];
    })
  ) as Record<Status, { label: string; color: string; border: string; glow: string; bg: string }>;
}

function nc(n: GNode) { return { x: n.x + n.w / 2, y: n.y + n.h / 2 }; }

// ─── Drag position storage ────────────────────────────────────────────────────
type PosMap = Record<string, { x: number; y: number }>;
const GRAPH_POS_KEY = "graph-pos-v2";
function loadGraphPositions(): PosMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(GRAPH_POS_KEY) ?? "{}"); } catch { return {}; }
}
function saveGraphPositions(p: PosMap) {
  try { localStorage.setItem(GRAPH_POS_KEY, JSON.stringify(p)); } catch {}
}

// ─── 3D tilt helper ───────────────────────────────────────────────────────────
function apply3D(el: HTMLElement, e: React.MouseEvent) {
  const rect = el.getBoundingClientRect();
  const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
  const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
  el.style.transform = `perspective(420px) rotateX(${-dy * 9}deg) rotateY(${dx * 9}deg) scale(1.07)`;
  el.style.transition = "box-shadow 0.1s, background 0.1s, border-color 0.1s";
}
function reset3D(el: HTMLElement, isDragging: boolean) {
  el.style.transform = isDragging ? "scale(1.08)" : "";
  el.style.transition = "all 0.18s ease";
}

// ─── Food types ───────────────────────────────────────────────────────────────

type FoodTag = "protein" | "sweet" | "breakfast" | "soup" | "bulk" | "cut";

interface Dish { id: string; name: string; cal: string; prot: string; tags: FoodTag[]; recipe: string; }

const FOOD_FILTERS: { id: FoodTag; label: string; emoji: string; color: string }[] = [
  { id: "protein",   label: "Білкові",  emoji: "💪", color: "#34d399" },
  { id: "breakfast", label: "Сніданок", emoji: "🌅", color: "#fbbf24" },
  { id: "soup",      label: "Суп",      emoji: "🍲", color: "#fb923c" },
  { id: "sweet",     label: "Солодке",  emoji: "🍯", color: "#f472b6" },
  { id: "bulk",      label: "Маса",     emoji: "📈", color: "#60a5fa" },
  { id: "cut",       label: "Сушка",    emoji: "✂️", color: "#a78bfa" },
];

// ─── Dishes ───────────────────────────────────────────────────────────────────

const DEFAULT_DISHES: Dish[] = [
  // — Українська кухня —
  { id: "borscht",     name: "Борщ з яловичиною",       cal: "~420 ккал", prot: "28г", tags: ["soup","protein"],          recipe: "Яловичину варити 40хв. Обсмажити цибулю з морквою, додати тертий буряк з оцтом. Всипати капусту і картоплю, варити 20хв. Заправити часником та сметаною." },
  { id: "kapusniak",   name: "Капусняк з квашеною",     cal: "~360 ккал", prot: "22г", tags: ["soup","cut"],              recipe: "Свинину відварити 40хв. Квашену капусту промити, тушкувати з морквою і цибулею 10хв. Додати до бульйону разом з картоплею, варити ще 25хв." },
  { id: "varenyky_syr",name: "Вареники з сиром",        cal: "~380 ккал", prot: "18г", tags: ["sweet","bulk"],            recipe: "Борошно + яйце + вода → тісто, відпочити 30хв. Сир + яйце + цукор + сіль → начинка. Варити 5-7хв у підсоленій воді. Подати зі сметаною та маслом." },
  { id: "varenyky_vysh",name:"Вареники з вишнею",       cal: "~420 ккал", prot: "10г", tags: ["sweet","bulk"],            recipe: "Замісити тісто (борошно, яйце, вода, сіль). Вишні без кісточок + цукор → начинка. Варити 4-5хв. Подати зі сметаною та посипати цукром." },
  { id: "holubtsi",    name: "Голубці в томаті",        cal: "~410 ккал", prot: "26г", tags: ["protein","bulk"],          recipe: "Рис напівготовий + фарш (свинина+яловичина) + цибуля + морква. Загорнути в бланшовані капустяні листи. Залити томатним соусом зі сметаною, тушкувати 50хв." },
  { id: "deruny",      name: "Деруни зі сметаною",      cal: "~440 ккал", prot: "14г", tags: ["breakfast","bulk"],        recipe: "5 картоплин натерти, відтиснути сік. Додати 1 яйце, 2 ст.л. борошна, сіль. Смажити на олії 3-4хв з кожного боку до золотистої скоринки." },
  { id: "holodets",    name: "Холодець (колаген!)",      cal: "~200 ккал", prot: "22г", tags: ["protein","cut"],           recipe: "Свинячі ніжки + курка варити 6-8год на малому вогні. Процідити, розібрати м'ясо, додати часник і лавровий лист. Розлити у форми, охолодити 8год." },
  { id: "grechanyky",  name: "Гречаники",                cal: "~430 ккал", prot: "30г", tags: ["protein","bulk"],          recipe: "Відварити гречку, змішати з яловичим фаршем, яйцем і смаженою цибулею. Формувати котлети, обваляти в сухарях. Смажити 5хв з кожного боку, потім 15хв у духовці." },
  { id: "zrazy",       name: "Зрази з яйцем",           cal: "~460 ккал", prot: "34г", tags: ["protein","bulk"],          recipe: "Яловичий фарш розплескати на долоні. Начинка: варене яйце + цибуля + зелень. Закрити краї, обваляти. Смажити 8хв, потім запекти 180° 15хв." },
  { id: "kulish",      name: "Куліш із салом",           cal: "~480 ккал", prot: "18г", tags: ["soup","bulk"],             recipe: "Пшоно промити, варити 20хв у підсоленій воді. Сало нарізати, обсмажити з цибулею до шкварок. Заправити кашу жиром від обсмажки, посолити." },
  { id: "mlyntsi",     name: "Налисники з творогом",     cal: "~390 ккал", prot: "20г", tags: ["breakfast","sweet","bulk"],recipe: "Борошно + молоко + 2 яйця + щіпка солі → тісто. Смажити тонкі млинці. Начинка: сир + яйце + цукор + родзинки. Загорнути конвертом, підрум'янити." },
  { id: "ryba_yushka", name: "Рибна юшка",               cal: "~280 ккал", prot: "26г", tags: ["soup","cut","protein"],    recipe: "Рибу (короп або судак) потрошити, варити з цибулею і морквою 20хв. Додати картоплю, лавровий лист, перець горошком. Варити 15хв. Зелень перед подачею." },
  // — Білкові / спортивні —
  { id: "grechka_kur", name: "Гречка з куркою",          cal: "~450 ккал", prot: "45г", tags: ["protein","bulk"],          recipe: "Куряче філе посолити, запекти 180° 25хв. Гречку промити, відварити 15хв у підсоленій воді 1:2. Подати разом, можна з томатним соусом." },
  { id: "kur_rys",     name: "Курятина з рисом",         cal: "~500 ккал", prot: "52г", tags: ["protein","bulk"],          recipe: "Курячу грудку відварити 25хв. Рис промити, варити 1:2 з водою 18хв. Подати з соєвим соусом, кунжутом і свіжою зеленню." },
  { id: "losos_rys",   name: "Лосось з рисом",           cal: "~560 ккал", prot: "50г", tags: ["protein","bulk"],          recipe: "Лосось збризнути лимоном, посолити. Запекти 200° 18хв. Бурий рис варити 30хв. Подати з соусом теріякі та кунжутом." },
  { id: "tunets_pasta",name: "Тунець з пастою",          cal: "~480 ккал", prot: "38г", tags: ["protein","bulk"],          recipe: "Пасту варити аль денте 8хв. Консервований тунець + оливки + каперси + петрушка. Змішати, заправити оливковою олією та лимоном." },
  { id: "indy_batat",  name: "Індичка з бататом",        cal: "~520 ккал", prot: "48г", tags: ["protein","bulk"],          recipe: "Філе індички маринувати 30хв (йогурт + часник + орегано). Запекти 190° 30хв. Батат кубиками + оливкова олія + сіль, запекти 25хв." },
  { id: "ryba_par",    name: "Парова риба з гречкою",    cal: "~390 ккал", prot: "40г", tags: ["protein","cut"],           recipe: "Тілапію або тріску посолити з лимоном. Пропарити 12хв у пароварці. Гречку відварити. Подати з лимонним соком та кропом." },
  { id: "kur_grill",   name: "Курка гриль із салатом",   cal: "~350 ккал", prot: "44г", tags: ["protein","cut"],           recipe: "Грудку маринувати 30хв (лимон + часник + оливкова олія + паприка). Смажити на грилі 8хв з кожного боку. Подати з листовим салатом і лимоном." },
  { id: "kvasolia_kur",name: "Квасоля з куркою",         cal: "~440 ккал", prot: "42г", tags: ["protein","bulk"],          recipe: "Квасолю замочити на ніч, відварити 1год. Курку нарізати кубиками, обсмажити з цибулею. Змішати з квасолею, тушкувати 10хв у томатному соусі." },
  { id: "kotlety",     name: "М'ясні котлети з гречкою", cal: "~480 ккал", prot: "36г", tags: ["protein","bulk"],          recipe: "Яловичина + свинина 50/50 + цибуля + яйце + сіль. Вибити фарш. Формувати котлети, панірувати. Смажити 5хв з кожного боку." },
  { id: "batat_tunets",name: "Батат з тунцем",           cal: "~410 ккал", prot: "36г", tags: ["protein","cut"],           recipe: "Батат запекти цілим 200° 40хв. Розрізати навпіл. Наповнити тунцем з лимонним соком, кропом та червоним перцем." },
  { id: "grets_salat", name: "Грецький салат із тунцем", cal: "~350 ккал", prot: "35г", tags: ["protein","cut"],           recipe: "Помідор + огірок + перець + маслини + фета кубиками. Консервований тунець зверху. Заправити оливковою олією, орегано та лимонним соком." },
  { id: "holodets_kur",name: "Холодець курячий",         cal: "~180 ккал", prot: "24г", tags: ["protein","cut"],           recipe: "Курячі лапки + грудка варити 4-5год. Процідити, розібрати м'ясо. Додати часник, чорний перець. Розлити у форми, охолодити 6год у холодильнику." },
  // — Супи —
  { id: "kur_sup",     name: "Курячий суп",              cal: "~300 ккал", prot: "28г", tags: ["soup","protein","cut"],    recipe: "Грудку відварити 20хв, витягти й нарізати. Бульйон процідити. Додати картоплю, моркву, цибулю, вермішель. Варити 15хв. Зелень наприкінці." },
  { id: "gorkh_sup",   name: "Гороховий суп з м'ясом",  cal: "~400 ккал", prot: "30г", tags: ["soup","protein","bulk"],   recipe: "Горох замочити на ніч. Свинину відварити, горох варити 40хв. Додати картоплю, смажені моркву і цибулю. Копченості за смаком, посолити." },
  { id: "sochev_sup",  name: "Суп-пюре з сочевиці",     cal: "~320 ккал", prot: "20г", tags: ["soup","cut"],              recipe: "Червону сочевицю з морквою, цибулею та часником варити 20хв. Збити блендером у пюре. Додати куркуму, кмин, сіль. Подати з грінками та оливковою олією." },
  { id: "guliash",     name: "Гуляш з картоплею",        cal: "~490 ккал", prot: "35г", tags: ["soup","bulk"],             recipe: "Яловичину нарізати кубиками 3см, обсмажити з цибулею. Додати паприку, томат, бульйон. Тушкувати 1год. За 20хв до готовності додати картоплю." },
  // — Сніданки —
  { id: "omlet_ovoch", name: "Омлет з овочами та сиром", cal: "~320 ккал", prot: "25г", tags: ["protein","breakfast"],     recipe: "3 яйця + 2 ст.л. молока збити. Обсмажити болгарський перець і помідор 3хв. Залити яйцями, накрити кришкою. Через 3хв посипати твердим сиром." },
  { id: "vivs_banan",  name: "Вівсянка з бананом",       cal: "~380 ккал", prot: "12г", tags: ["breakfast","bulk"],        recipe: "Вівсяні пластівці залити теплим молоком на 7хв або варити 5хв. Нарізати банан кружечками, додати чайну ложку меду та жменю горіхів." },
  { id: "syrnyky",     name: "Сирники з йогуртом",       cal: "~360 ккал", prot: "24г", tags: ["breakfast","sweet"],       recipe: "250г сиру + яйце + 2 ст.л. борошна + 1 ст.л. цукру. Сформувати сирники 1.5см завтовшки, обваляти в борошні. Смажити на олії 3хв з кожного боку." },
  { id: "yaytsya_av",  name: "Яйця пашот з авокадо",     cal: "~420 ккал", prot: "22г", tags: ["breakfast","protein"],     recipe: "Воду з оцтом (1 ч.л.) довести до кипіння. Яйце розбити у чашку, обережно влити у воронку. Варити 3хв. Подати на тості з розтертим авокадо, сіль, перець." },
  { id: "tvorog_med",  name: "Творог з медом та горіхами",cal: "~290 ккал", prot: "22г", tags: ["breakfast","sweet","cut"],recipe: "Нежирний творог (200г) + чайна ложка натурального меду + жменя мигдалю або волоського горіха. Додати корицю і свіжі ягоди за сезоном." },
  { id: "prot_pankeyky",name:"Протеїновий панкейк",      cal: "~340 ккал", prot: "28г", tags: ["breakfast","sweet","bulk"],recipe: "1 мірна ложка протеїну + 50г вівсяних пластівців + 1 яйце + 100мл молока — збити. Смажити на тефлоні 2-3хв з кожного боку. Подати з ягодами та медом." },
  { id: "kasha_pshon", name: "Пшоняна каша з молоком",   cal: "~350 ккал", prot: "11г", tags: ["breakfast","bulk"],        recipe: "Пшоно промити окропом 3 рази. Залити молоком 1:3, варити 20хв на малому вогні постійно помішуючи. Додати вершкове масло, сіль або цукор." },
];

// ─── Roulette Wheel Constants ─────────────────────────────────────────────────

const CW  = 400;
const CH  = 370;
const WCX = 174;
const WCY = 185;
const WR  = 158;

// [bg, fg] pairs — vibrant palette
const SEG_PAL: [string, string][] = [
  ["#E53935","#fff"], ["#F4511E","#fff"], ["#FB8C00","#fff"], ["#FDD835","#000"],
  ["#C0CA33","#000"], ["#43A047","#fff"], ["#00897B","#fff"], ["#00ACC1","#fff"],
  ["#1E88E5","#fff"], ["#3949AB","#fff"], ["#8E24AA","#fff"], ["#D81B60","#fff"],
  ["#6D4C41","#fff"], ["#546E7A","#fff"], ["#00BFA5","#000"], ["#FFB300","#000"],
];

function drawWheel(ctx: CanvasRenderingContext2D, θ: number, dishes: Dish[]) {
  const nd = dishes.length;
  ctx.clearRect(0, 0, CW, CH);
  if (nd === 0) return;
  const sa = (2 * Math.PI) / nd;

  // ── Segments ──
  for (let i = 0; i < nd; i++) {
    const a0 = θ + i * sa;
    const a1 = a0 + sa;

    const [segBg, segFg] = SEG_PAL[i % SEG_PAL.length];
    ctx.beginPath();
    ctx.moveTo(WCX, WCY);
    ctx.arc(WCX, WCY, WR, a0, a1);
    ctx.closePath();
    // Subtle radial gradient for depth
    const rg = ctx.createRadialGradient(WCX, WCY, 18, WCX, WCY, WR);
    rg.addColorStop(0, segBg + "bb");
    rg.addColorStop(1, segBg);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Radial label text
    ctx.save();
    ctx.translate(WCX, WCY);
    ctx.rotate(a0 + sa / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = segFg;
    ctx.font = "bold 8.5px system-ui, -apple-system, sans-serif";
    const txt = dishes[i].name.length > 15 ? dishes[i].name.slice(0, 14) + "…" : dishes[i].name;
    ctx.fillText(txt, WR - 8, 3.5);
    ctx.restore();
  }

  // ── Outer decorative rings ──
  ctx.beginPath();
  ctx.arc(WCX, WCY, WR + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(WCX, WCY, WR + 8, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── Center hub ──
  const grad = ctx.createRadialGradient(WCX, WCY, 0, WCX, WCY, 26);
  grad.addColorStop(0, "#222");
  grad.addColorStop(1, "#0a0a0a");

  ctx.beginPath();
  ctx.arc(WCX, WCY, 26, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#000";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "16px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText("💪", WCX, WCY);
  ctx.textBaseline = "alphabetic";

  // ── Fixed pointer arrow (right side, angle = 0) ──
  // Drawn LAST so it's always on top of spinning segments
  const tipX = WCX + WR + 5;
  const tipY = WCY;

  ctx.save();
  ctx.shadowBlur = 22;
  ctx.shadowColor = "rgba(239,68,68,0.85)";
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);           // tip (points left toward wheel)
  ctx.lineTo(tipX + 28, tipY - 13); // top-right
  ctx.lineTo(tipX + 28, tipY + 13); // bottom-right
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  ctx.shadowBlur = 0;

  // Arrow notch (decorative indent on base)
  ctx.beginPath();
  ctx.moveTo(tipX + 28, tipY - 13);
  ctx.lineTo(tipX + 22, tipY);
  ctx.lineTo(tipX + 28, tipY + 13);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tip highlight
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#fca5a5";
  ctx.fill();

  ctx.restore();
}

// ─── Roulette Modal ───────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", background: "#111", border: "1px solid #1e1e1e",
  borderRadius: 7, padding: "7px 10px", color: "#ccc", fontSize: "var(--fz-sm)",
  boxSizing: "border-box",
};

function RouletteModal({ onClose }: { onClose: () => void }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const angleRef   = useRef(0);
  const rafRef     = useRef<number | null>(null);

  const [spinning,      setSpinning]      = useState(false);
  const [result,        setResult]        = useState<Dish | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FoodTag>>(new Set());
  const [editMode,      setEditMode]      = useState(false);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);

  const [dishes, setDishes] = useState<Dish[]>(() => {
    try {
      const s = localStorage.getItem("ott_dishes_v1");
      if (s) return JSON.parse(s) as Dish[];
    } catch {}
    return DEFAULT_DISHES;
  });

  const [newName,   setNewName]   = useState("");
  const [newCal,    setNewCal]    = useState("");
  const [newProt,   setNewProt]   = useState("");
  const [newRecipe, setNewRecipe] = useState("");
  const [newTags,   setNewTags]   = useState<Set<FoodTag>>(new Set());

  const filteredDishes = useMemo(
    () => activeFilters.size === 0 ? dishes : dishes.filter(d => d.tags.some(t => activeFilters.has(t))),
    [activeFilters, dishes]
  );

  const persist = (next: Dish[]) => {
    setDishes(next);
    try { localStorage.setItem("ott_dishes_v1", JSON.stringify(next)); } catch {}
  };

  const removeDish = (id: string) => persist(dishes.filter(d => d.id !== id));

  const addDish = () => {
    if (!newName.trim()) return;
    persist([...dishes, {
      id: `u${Date.now()}`,
      name: newName.trim(), cal: newCal.trim() || "—",
      prot: newProt.trim() || "—",
      tags: Array.from(newTags) as FoodTag[],
      recipe: newRecipe.trim() || "Без опису",
    }]);
    setNewName(""); setNewCal(""); setNewProt(""); setNewRecipe(""); setNewTags(new Set());
  };

  const toggleNewTag = (t: FoodTag) =>
    setNewTags(p => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const toggleFilter = (id: FoodTag) =>
    setActiveFilters(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Reset & redraw when filters/dishes change
  useEffect(() => {
    if (editMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    angleRef.current = 0;
    setResult(null);
    setSpinning(false);
    drawWheel(ctx, 0, filteredDishes);
  }, [filteredDishes, editMode]);

  // Redraw on return from edit mode
  useEffect(() => {
    if (editMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawWheel(ctx, angleRef.current, filteredDishes);
  }, [editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const spin = () => {
    if (spinning || filteredDishes.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setSpinning(true);
    setResult(null);

    const nd    = filteredDishes.length;
    const sa    = (2 * Math.PI) / nd;
    const final = Math.floor(Math.random() * nd);
    const θ0    = angleRef.current;
    const θ0n   = ((θ0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Mathematically land exactly at center of chosen sector
    const θTarget = ((-(final * sa + sa / 2)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let diff = θTarget - θ0n;
    if (diff < 0) diff += 2 * Math.PI;
    if (diff < 0.05) diff += 2 * Math.PI;

    const θEnd   = θ0 + 6 * 2 * Math.PI + diff; // fixed 6 full rotations
    const t0     = performance.now();
    const DUR    = 4500;

    const frame = (now: number) => {
      const t    = Math.min((now - t0) / DUR, 1);
      const ease = 1 - Math.pow(1 - t, 5);
      const θ    = θ0 + (θEnd - θ0) * ease;
      angleRef.current = θ;
      drawWheel(ctx, θ, filteredDishes);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        angleRef.current = θEnd;
        drawWheel(ctx, θEnd, filteredDishes);
        setResult(filteredDishes[final]);
        setSpinning(false);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  const backdropStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.84)", backdropFilter: "blur(8px)",
  };
  const panelBase: React.CSSProperties = {
    background: "#0d0d0d",
    border: "1px solid rgba(139,92,246,0.42)",
    borderRadius: 22,
    boxShadow: "0 0 70px rgba(139,92,246,0.2)",
    width: "100%", maxWidth: 480,
  };

  // ── Edit mode ────────────────────────────────────────────────────────────────
  if (editMode) return (
    <div style={backdropStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...panelBase, display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button onClick={() => setEditMode(false)} style={{ background: "none", border: "1px solid #1e1e1e", borderRadius: 6, color: "#666", fontSize: "var(--fz-sm)", cursor: "pointer", padding: "4px 10px" }}>← Назад</button>
          <span style={{ color: "#e0e0e0", fontSize: "var(--fz-body)", fontWeight: 700, flex: 1 }}>
            Список страв <span style={{ color: "#444", fontWeight: 400, fontSize: "var(--fz-sm)" }}>({dishes.length})</span>
          </span>
          <button
            onClick={() => { if (window.confirm("Скинути до стандартного списку?")) persist(DEFAULT_DISHES); }}
            style={{ background: "none", border: "1px solid #252525", borderRadius: 6, color: "#444", fontSize: "var(--fz-xs)", cursor: "pointer", padding: "4px 10px" }}
          >↺ Скинути</button>
        </div>

        {/* Dish list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
          {dishes.map(d => {
            const open = expandedId === d.id;
            return (
              <div key={d.id} style={{ borderBottom: "1px solid #111" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}>
                  <button onClick={() => setExpandedId(open ? null : d.id)} style={{
                    background: "none", border: "none", color: "#444", fontSize: "var(--fz-micro)",
                    cursor: "pointer", padding: 0, flexShrink: 0,
                    display: "inline-block",
                    transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s",
                  }}>▶</button>
                  <span style={{ flex: 1, color: "#bbb", fontSize: "var(--fz-sm)" }}>{d.name}</span>
                  <span style={{ color: "#333", fontSize: "var(--fz-xs)", flexShrink: 0 }}>{d.cal}</span>
                  <button onClick={() => removeDish(d.id)} style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: "#1a1a1a", border: "1px solid #252525",
                    color: "#555", fontSize: "var(--fz-body)", lineHeight: 1, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444430"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#252525"; }}
                  >×</button>
                </div>
                {open && (
                  <div style={{ padding: "0 20px 12px 42px" }}>
                    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px" }}>
                      <p style={{ color: "#888", fontSize: "var(--fz-xs)", margin: "0 0 8px", lineHeight: 1.7 }}>{d.recipe}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: "#34d399", fontSize: "var(--fz-xs)" }}>{d.cal}</span>
                        <span style={{ color: "#60a5fa", fontSize: "var(--fz-xs)" }}>{d.prot} білка</span>
                        {d.tags.map(tag => {
                          const f = FOOD_FILTERS.find(x => x.id === tag);
                          return f ? <span key={tag} style={{ fontSize: "var(--fz-micro)", color: f.color, background: f.color + "15", padding: "1px 6px", borderRadius: 3 }}>{f.emoji} {f.label}</span> : null;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add dish form */}
        <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
          <p style={{ color: "#444", fontSize: "var(--fz-xs)", margin: "0 0 8px", letterSpacing: 0.8, textTransform: "uppercase" }}>Нова страва</p>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Назва страви" style={{ ...INP, marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={newCal}  onChange={e => setNewCal(e.target.value)}  placeholder="~400 ккал" style={{ flex: 1, ...INP, width: "auto" }} />
            <input value={newProt} onChange={e => setNewProt(e.target.value)} placeholder="30г білка"  style={{ flex: 1, ...INP, width: "auto" }} />
          </div>
          <textarea value={newRecipe} onChange={e => setNewRecipe(e.target.value)} placeholder="Спосіб приготування..." rows={2}
            style={{ ...INP, resize: "vertical", marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {FOOD_FILTERS.map(f => {
              const on = newTags.has(f.id);
              return (
                <button key={f.id} onClick={() => toggleNewTag(f.id)} style={{
                  padding: "3px 9px", borderRadius: 12, fontSize: "var(--fz-xs)", cursor: "pointer",
                  border: `1px solid ${on ? f.color + "66" : "#252525"}`,
                  background: on ? f.color + "18" : "transparent",
                  color: on ? f.color : "#444",
                }}>{f.emoji} {f.label}</button>
              );
            })}
          </div>
          <button onClick={addDish} disabled={!newName.trim()} style={{
            width: "100%", padding: "9px 0", borderRadius: 8, fontSize: "var(--fz-sm)", fontWeight: 700,
            background: newName.trim() ? "rgba(139,92,246,0.18)" : "#111",
            border: `1px solid ${newName.trim() ? "rgba(139,92,246,0.35)" : "#1e1e1e"}`,
            color: newName.trim() ? "#a78bfa" : "#333",
            cursor: newName.trim() ? "pointer" : "not-allowed",
          }}>+ Додати страву</button>
        </div>
      </div>
    </div>
  );

  // ── Roulette mode ─────────────────────────────────────────────────────────────
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={backdropStyle}>
      <div style={{ ...panelBase, position: "relative", padding: "22px 26px 18px", display: "flex", flexDirection: "column", alignItems: "center", maxHeight: "96vh", overflowY: "auto" }}>

        {/* Header buttons */}
        <button onClick={() => setEditMode(true)} style={{
          position: "absolute", top: 14, right: 52,
          background: "#1a1a1a", border: "1px solid #252525",
          borderRadius: 6, color: "#555", fontSize: "var(--fz-xs)", cursor: "pointer", padding: "4px 10px",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
          onMouseLeave={e => (e.currentTarget.style.color = "#555")}
        >✎ Список</button>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          background: "none", border: "none",
          color: "#444", fontSize: "var(--fz-h2)", cursor: "pointer", lineHeight: 1, padding: 4,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
          onMouseLeave={e => (e.currentTarget.style.color = "#444")}
        >✕</button>

        <h2 style={{ color: "#fff", fontSize: "var(--fz-h2)", fontWeight: 700, margin: "0 0 2px" }}>🎲 Що будемо їсти?</h2>
        <p style={{ color: "#555", fontSize: "var(--fz-sm)", margin: "0 0 12px" }}>Рулетка страв для атлета-армрестлера</p>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, width: "100%", justifyContent: "center" }}>
          {FOOD_FILTERS.map(f => {
            const active = activeFilters.has(f.id);
            return (
              <button key={f.id} onClick={() => toggleFilter(f.id)} style={{
                padding: "4px 11px", borderRadius: 20, fontSize: "var(--fz-xs)", cursor: "pointer",
                border: `1px solid ${active ? f.color + "66" : "#252525"}`,
                background: active ? f.color + "18" : "transparent",
                color: active ? f.color : "#444",
                fontWeight: active ? 600 : 400, transition: "all 0.15s",
              }}>{f.emoji} {f.label}</button>
            );
          })}
          {activeFilters.size > 0 && (
            <button onClick={() => setActiveFilters(new Set())} style={{
              padding: "4px 10px", borderRadius: 20, fontSize: "var(--fz-xs)", cursor: "pointer",
              border: "1px solid #333", background: "transparent", color: "#555",
            }}>× Всі</button>
          )}
        </div>

        <p style={{ color: "#333", fontSize: "var(--fz-xs)", margin: "-4px 0 8px", alignSelf: "flex-end" }}>
          {filteredDishes.length} страв на колесі
        </p>

        {/* Wheel */}
        {filteredDishes.length > 0 ? (
          <canvas ref={canvasRef} width={CW} height={CH} style={{ borderRadius: 10, display: "block" }} />
        ) : (
          <div style={{
            width: CW, height: CH, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            border: "1px dashed #222", borderRadius: 10, color: "#333",
          }}>
            <span style={{ fontSize: "var(--fz-display)", marginBottom: 8 }}>🍽️</span>
            <span style={{ fontSize: "var(--fz-sm)" }}>Жодної страви не знайдено</span>
          </div>
        )}

        {/* Result */}
        <div style={{ minHeight: 70, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 0 0" }}>
          {result && !spinning ? (
            <div style={{ width: "100%", textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "var(--fz-body)", margin: "0 0 5px" }}>{result.name}</p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 8 }}>
                <span style={{ color: "#34d399", fontSize: "var(--fz-sm)", fontWeight: 600 }}>{result.cal}</span>
                <span style={{ color: "#60a5fa", fontSize: "var(--fz-sm)", fontWeight: 600 }}>{result.prot} білка</span>
              </div>
              {/* Recipe card */}
              <div style={{
                background: "#111", border: "1px solid #1e1e1e",
                borderRadius: 10, padding: "10px 14px", textAlign: "left", marginBottom: 8,
              }}>
                <span style={{ color: "#444", fontSize: "var(--fz-micro)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Спосіб приготування</span>
                <p style={{ color: "#999", fontSize: "var(--fz-sm)", margin: "5px 0 0", lineHeight: 1.65 }}>{result.recipe}</p>
              </div>
              <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                {result.tags.map(tag => {
                  const f = FOOD_FILTERS.find(x => x.id === tag);
                  return f ? (
                    <span key={tag} style={{ fontSize: "var(--fz-xs)", color: f.color, background: f.color + "15", border: `1px solid ${f.color}33`, padding: "1px 7px", borderRadius: 4 }}>
                      {f.emoji} {f.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ) : spinning ? (
            <p style={{ color: "#555", fontSize: "var(--fz-sm)" }}>Крутимо... 🎰</p>
          ) : (
            <p style={{ color: "#2a2a2a", fontSize: "var(--fz-sm)" }}>Натисни — і дізнаєшся!</p>
          )}
        </div>

        {/* Spin button */}
        <button onClick={spin} disabled={spinning || filteredDishes.length === 0} style={{
          width: "100%", padding: "13px 0", marginTop: 8,
          borderRadius: 12, border: "none",
          background: (spinning || filteredDishes.length === 0) ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color: filteredDishes.length === 0 ? "#333" : "#fff",
          fontWeight: 700, fontSize: "var(--fz-body)",
          cursor: (spinning || filteredDishes.length === 0) ? "not-allowed" : "pointer",
          boxShadow: spinning ? "none" : "0 0 24px rgba(124,58,237,0.35)",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { if (!spinning && filteredDishes.length > 0) e.currentTarget.style.boxShadow = "0 0 40px rgba(124,58,237,0.6)"; }}
          onMouseLeave={e => { if (!spinning) e.currentTarget.style.boxShadow = "0 0 24px rgba(124,58,237,0.35)"; }}
        >{spinning ? "🎰  Крутимо..." : "🎲  Крутити рулетку!"}</button>

        {result && !spinning && (
          <button onClick={spin} style={{
            width: "100%", padding: "9px 0", marginTop: 5,
            borderRadius: 12, border: "1px solid #1e1e1e",
            background: "none", color: "#444", fontSize: "var(--fz-sm)", cursor: "pointer",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >↺ Ще раз</button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const GW = 1640; // дорівнює --app-max
const GH = 900;

export default function GraphPage() {
  const router = useRouter();

  // Colors from settings
  const [graphColors] = useState(loadGraphColors);
  const ST = useMemo(() => buildST(graphColors), [graphColors]);

  const [hovered,    setHovered]    = useState<string | null>(null);
  const [roulette,   setRoulette]   = useState(false);
  const [showGroups, setShowGroups] = useState(true);

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [posOverrides, setPosOverrides] = useState<PosMap>(loadGraphPositions);
  const dragRef = useRef<{
    id: string; startMX: number; startMY: number;
    origX: number; origY: number; moved: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const displayNodes = useMemo(() =>
    NODES.map(n => {
      const ov = posOverrides[n.id];
      return ov ? { ...n, x: ov.x, y: ov.y } : n;
    }),
    [posOverrides]
  );

  const nmap = useMemo(() =>
    Object.fromEntries(displayNodes.map(n => [n.id, n])),
    [displayNodes]
  );

  const connSet = hovered
    ? new Set(EDGES.filter(e => e.a === hovered || e.b === hovered).flatMap(e => [e.a, e.b]))
    : null;

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const node = displayNodes.find(n => n.id === nodeId)!;
    dragRef.current = { id: nodeId, moved: false, startMX: e.clientX, startMY: e.clientY, origX: node.x, origY: node.y };
    setDraggingId(nodeId);
  }, [displayNodes]);

  const onContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const dx = e.clientX - d.startMX;
    const dy = e.clientY - d.startMY;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true;
    setPosOverrides(prev => ({ ...prev, [d.id]: { x: Math.max(0, d.origX + dx), y: Math.max(0, d.origY + dy) } }));
  }, []);

  const onContainerMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    if (dragRef.current.moved) setPosOverrides(prev => { saveGraphPositions(prev); return prev; });
    dragRef.current = null;
    setDraggingId(null);
  }, []);

  const resetPositions = useCallback(() => {
    setPosOverrides({});
    saveGraphPositions({});
  }, []);

  const handleClick = (n: GNode) => {
    if (dragRef.current?.moved) return;
    if (n.roulette) { setRoulette(true); return; }
    if (n.href) router.push(n.href);
  };

  return (
    <>
      {roulette && <RouletteModal onClose={() => setRoulette(false)} />}

      <div className="flex min-h-screen relative z-10">
        <Sidebar />

        <main
          className="flex-1 overflow-auto"
          style={{ background: "#080808", position: "relative", cursor: draggingId ? "grabbing" : "default" }}
          onMouseMove={onContainerMouseMove}
          onMouseUp={onContainerMouseUp}
          onMouseLeave={onContainerMouseUp}
        >
          {/* Dot grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          {/* Legend / toolbar bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 20,
            display: "flex", gap: 16, padding: "12px 24px",
            background: "linear-gradient(to bottom, rgba(8,8,8,0.97) 80%, transparent)",
            alignItems: "center", flexWrap: "wrap",
          }}>
            {(Object.entries(ST) as [Status, typeof ST.ready][]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: v.color,
                  boxShadow: `0 0 6px ${v.glow}`,
                }} />
                <span style={{ color: "#666", fontSize: "var(--fz-sm)" }}>{v.label}</span>
              </div>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {/* Groups toggle */}
              <button
                onClick={() => setShowGroups(v => !v)}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: "var(--fz-xs)", cursor: "pointer",
                  border: `1px solid ${showGroups ? "#ffffff30" : "#333"}`,
                  background: showGroups ? "rgba(255,255,255,0.06)" : "transparent",
                  color: showGroups ? "#aaa" : "#444",
                  transition: "all 0.15s",
                }}
              >⬡ Групи</button>

              {/* Reset positions */}
              <button
                onClick={resetPositions}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: "var(--fz-xs)", cursor: "pointer",
                  border: "1px solid #333", background: "transparent", color: "#444",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#555"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#333"; }}
              >↺ Скинути</button>

              <span style={{ color: "#282828", fontSize: "var(--fz-xs)" }}>Тягни · Клікни для переходу</span>
            </div>
          </div>

          {/* Graph canvas */}
          <div style={{
            position: "relative", width: GW, height: GH, margin: "0 auto",
            userSelect: draggingId ? "none" : "auto",
          }}>

            {/* SVG layer — groups + edges + dots */}
            <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }} width={GW} height={GH}>
              <defs>
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ── Group cloud borders ── */}
              {showGroups && GRAPH_GROUPS.map(group => {
                const bbox = groupBBox(group.members, nmap, 28);
                if (!bbox) return null;
                return (
                  <g key={group.id}>
                    {/* Soft fill */}
                    <rect x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h}
                      rx={26} ry={26}
                      fill={group.color + "07"}
                    />
                    {/* Dashed border */}
                    <rect x={bbox.x} y={bbox.y} width={bbox.w} height={bbox.h}
                      rx={26} ry={26}
                      fill="none"
                      stroke={group.color}
                      strokeWidth={1}
                      strokeOpacity={0.28}
                      strokeDasharray="9 7"
                    />
                    {/* Group label */}
                    <text
                      x={bbox.x + 18} y={bbox.y + 16}
                      fill={group.color} fillOpacity={0.45}
                      fontSize={9} fontWeight={700}
                      fontFamily="system-ui,-apple-system,sans-serif"
                      letterSpacing={1.8}
                    >
                      {group.label}
                    </text>
                  </g>
                );
              })}

              {/* ── Edges ── */}
              {EDGES.map((e, i) => {
                const fn = nmap[e.a]; const tn = nmap[e.b];
                if (!fn || !tn) return null;
                const f = nc(fn); const t = nc(tn);
                const active = !!(hovered && (e.a === hovered || e.b === hovered));
                const mx = (f.x + t.x) / 2 + (t.y - f.y) * 0.07;
                const my = (f.y + t.y) / 2 + (f.x - t.x) * 0.07;
                return (
                  <path key={i}
                    d={`M ${f.x} ${f.y} Q ${mx} ${my} ${t.x} ${t.y}`}
                    fill="none"
                    stroke={active ? "rgba(255,255,255,0.55)" : e.dash ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.16)"}
                    strokeWidth={active ? 1.8 : 1}
                    strokeDasharray={e.dash ? "5 8" : undefined}
                    filter={active ? "url(#glow)" : undefined}
                    style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
                  />
                );
              })}

              {/* ── Center dots ── */}
              {displayNodes.map(n => {
                const c = nc(n);
                const s = ST[n.status];
                const isH = hovered === n.id;
                return (
                  <circle key={n.id + "-c"} cx={c.x} cy={c.y} r={isH ? 4.5 : 2.5}
                    fill={s.color} opacity={isH ? 0.9 : 0.35}
                    style={{ transition: "all 0.15s", pointerEvents: "none" }}
                  />
                );
              })}
            </svg>

            {/* ── Node cards ── */}
            {displayNodes.map(n => {
              const s = ST[n.status];
              const isH   = hovered === n.id;
              const isC   = connSet ? connSet.has(n.id) : false;
              const dim   = !!(hovered && !isH && !isC);
              const isDrg = draggingId === n.id;
              const clickable = !!(n.href || n.roulette);

              return (
                <div
                  key={n.id}
                  onMouseEnter={() => !draggingId && setHovered(n.id)}
                  onMouseMove={e => { if (!draggingId) apply3D(e.currentTarget, e); }}
                  onMouseLeave={e => {
                    reset3D(e.currentTarget, false);
                    !draggingId && setHovered(null);
                  }}
                  onMouseDown={e => onNodeMouseDown(e, n.id)}
                  onClick={() => handleClick(n)}
                  style={{
                    position: "absolute",
                    left: n.x, top: n.y, width: n.w, height: n.h,
                    borderRadius: n.hub ? 18 : 13,
                    border: `1px solid ${isDrg ? s.color + "88" : s.border}`,
                    background: isDrg
                      ? s.color + "18"
                      : isH
                        ? `linear-gradient(135deg, ${s.bg.replace("0c", "18")}, ${s.bg})`
                        : s.bg,
                    boxShadow: isDrg
                      ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${s.glow}`
                      : isH
                        ? `0 0 30px ${s.glow}, 0 0 0 1px ${s.border}`
                        : `0 0 12px ${s.glow}`,
                    cursor: isDrg ? "grabbing" : clickable ? "pointer" : "grab",
                    opacity: dim ? 0.15 : 1,
                    transform: isDrg ? "scale(1.08)" : "",
                    transition: isDrg ? "box-shadow 0.1s, transform 0.1s" : "all 0.18s ease",
                    padding: "10px 13px",
                    display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
                    zIndex: isDrg ? 50 : isH ? 20 : 1,
                    userSelect: "none",
                  }}
                >
                  {n.hub ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "var(--fz-h1)" }}>{n.icon}</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: "var(--fz-body)", letterSpacing: "-0.3px" }}>{n.label}</div>
                        <div style={{ color: s.color, fontSize: "var(--fz-xs)", fontWeight: 600 }}>Платформа армрестлера</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ fontSize: "var(--fz-h2)", flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: dim ? "#333" : "#e5e5e5",
                          fontWeight: 600, fontSize: "var(--fz-sm)", lineHeight: 1.25,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {n.label}
                        </div>
                        <div style={{
                          color: isH ? "#777" : s.color,
                          fontSize: "var(--fz-xs)", marginTop: 3, fontWeight: isH ? 400 : 500,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {isH ? n.desc : s.label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
