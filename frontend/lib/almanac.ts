// ─── Types ────────────────────────────────────────────────────────────────────

export type AlmanacType = "character" | "technique" | "event" | "concept";

export interface AlmanacRating {
  raw_power:    number; // Сира сила       1–10
  technique:    number; // Техніка          1–10
  consistency:  number; // Стабільність     1–10
  speed:        number; // Швидкість        1–10
  longevity:    number; // Довголіття       1–10
  titles:       number; // Титули           1–10
  peak:         number; // Пікова форма     1–10
}

export interface Anthropometry {
  height:       number;        // cm
  weight:       number;        // kg
  reach?:       number;        // cm (розмах рук)
  forearm_len?: number;        // cm (довжина передпліччя)
  bicep_circ?:  number;        // cm (обхват біцепсу)
  forearm_circ?:number;        // cm (обхват передпліччя)
  wrist_circ?:  number;        // cm (обхват зап'ястя)
  hand_span?:   number;        // cm (розмах кисті)
}

export interface StrengthData {
  grip?:  number; // kg (динамометр)
  pull?:  number; // kg (тяга за столом, оцінка)
  bench?: number; // kg (жим лежачи, оцінка)
  curl?:  number; // kg (згинання з гантеллю, оцінка)
  note?:  string;
}

export interface CharacterData {
  country:        string;
  flag:           string;
  born?:          number;
  active:         string;
  hand:           "right" | "left" | "both";
  primary_styles: string[];   // technique IDs
  bio:            string;
  signature?:     string;
  titles:         string[];
  world_titles:   number;
  anthropometry:  Anthropometry;
  strength:       StrengthData;
  rating:         AlmanacRating;
}

export interface TechniqueData {
  muscles:       string[];
  difficulty:    number; // 1–5
  power_req:     number; // 1–5
  technique_req: number; // 1–5
  description:   string;
  key_points:    string[];
  practitioners: string[]; // character IDs
}

export interface EventData {
  year:          number;
  location?:     string;
  category:      "history" | "competition" | "supermatch" | "media";
  participants?: string[];
  description:   string;
  outcome?:      string;
  significance:  string;
}

export interface ConceptData {
  description: string;
  members:     string[]; // related node IDs
  traits:      string[];
}

export interface AlmanacNode {
  id:        string;
  type:      AlmanacType;
  title:     string;
  subtitle?: string;
  summary:   string;
  tags:      string[];
  links:     string[]; // related node IDs
  x: number; y: number; w: number; h: number;
  // typed extras
  character?: CharacterData;
  technique?: TechniqueData;
  event?:     EventData;
  concept?:   ConceptData;
}

export interface AlmanacEdge {
  from:   string;
  to:     string;
  dash?:  boolean;
  label?: string;
}

// ─── Node color / shape by type ──────────────────────────────────────────────

export const TYPE_STYLE: Record<AlmanacType, { color: string; border: string; glow: string; bg: string; label: string }> = {
  character: { label:"Персонаж", color:"#8bff00",  border:"rgba(139,255,0,0.35)",   glow:"rgba(139,255,0,0.15)",   bg:"rgba(139,255,0,0.05)"  },
  technique: { label:"Техніка",  color:"#FF6B35",  border:"rgba(255,107,53,0.35)",  glow:"rgba(255,107,53,0.15)",  bg:"rgba(255,107,53,0.05)" },
  event:     { label:"Подія",    color:"#eab308",  border:"rgba(234,179,8,0.35)",   glow:"rgba(234,179,8,0.15)",   bg:"rgba(234,179,8,0.05)"  },
  concept:   { label:"Концепт",  color:"#e879f9",  border:"rgba(232,121,249,0.35)", glow:"rgba(232,121,249,0.15)", bg:"rgba(232,121,249,0.05)"},
};

// ─── Data ─────────────────────────────────────────────────────────────────────

export const ALMANAC_NODES: AlmanacNode[] = [

  // ── Hub ───────────────────────────────────────────────────────────────────
  {
    id: "hub", type: "concept",
    title: "Армрестлінг", subtitle: "Спорт на силу й техніку",
    summary: "Центр знань платформи OverTheTop",
    tags: ["core"], links: [],
    x: 545, y: 385, w: 190, h: 82,
    concept: {
      description: "Армрестлінг — силовий спорт, де два суперники борються на руках за столом. Перемагає той, хто притиснув руку суперника до подушки.",
      members: [],
      traits: ["сила","техніка","психологія","вибухова робота"],
    },
  },

  // ── Characters ────────────────────────────────────────────────────────────
  {
    id: "brzenk", type: "character",
    title: "Джон Бренк", subtitle: "The Greatest · США",
    summary: "Найвеличніший армрестлер класичної ери, 10+ чемпіонатів світу",
    tags: ["legend","usa","toproll","kingsmove","right"],
    links: ["toproll","kingsmove","northam","ev1952"],
    x: 30, y: 50, w: 155, h: 60,
    character: {
      country:"США", flag:"🇺🇸", born:1964, active:"1982–2010", hand:"right",
      primary_styles:["toproll","kingsmove"],
      bio:"Джон Бренк — «The Greatest» класичного армрестлінгу. Десятки разів перемагав на чемпіонатах світу WAF, нищив суперників важчих на 30+ кг завдяки неперевершеній техніці та «King's Move». Еталон стабільності й технічної довершеності.",
      signature:"King's Move",
      titles:["WAF World Champion ×12","Petaluma World Champion ×8","Eagle Classic Champion"],
      world_titles:12,
      anthropometry:{ height:188, weight:92, reach:187, forearm_len:33, bicep_circ:45, forearm_circ:38, wrist_circ:18, hand_span:24 },
      strength:{ grip:88, pull:115, bench:180, curl:88, note:"Дані приблизні, пік ~1990-і" },
      rating:{ raw_power:7, technique:10, consistency:10, speed:9, longevity:10, titles:10, peak:9 },
    },
  },
  {
    id: "larratt", type: "character",
    title: "Девон Ларрат", subtitle: "No Limits · Канада",
    summary: "Найбільш довговічний чемпіон, ікона сучасного армрестлінгу",
    tags: ["legend","canada","hook","kingsmove","right","left"],
    links: ["hook","kingsmove","northam","evlv2012","evll2021","levan","voevoda"],
    x: 215, y: 50, w: 155, h: 60,
    character: {
      country:"Канада", flag:"🇨🇦", born:1975, active:"1999–досі", hand:"both",
      primary_styles:["hook","kingsmove"],
      bio:"Девон Ларрат — живий феномен армрестлінгу. Змагається у 48+ років, вигравши золото правою і лівою рукою на чемпіонатах світу. Еволюціонував від топролу до гаку, розробив унікальну систему тренувань і психологічний підхід. Його матчі з Леваном і Воєводою вважаються найгучнішими в історії спорту.",
      signature:"King's Move / Підготовча позиція",
      titles:["WAF World Champion ×8","Nemiroff Champion ×5","Super Match legend"],
      world_titles:8,
      anthropometry:{ height:196, weight:110, reach:198, forearm_len:36, bicep_circ:48, forearm_circ:40, wrist_circ:20, hand_span:26 },
      strength:{ grip:105, pull:140, bench:200, curl:100, note:"Виняткова довжина рук дає механічну перевагу" },
      rating:{ raw_power:8, technique:10, consistency:9, speed:8, longevity:10, titles:9, peak:9 },
    },
  },
  {
    id: "levan", type: "character",
    title: "Леван Сагінашвілі", subtitle: "The Table · Грузія",
    summary: "Найпотужніший армрестлер планети, абсолютний монстр правою рукою",
    tags: ["georgia","toproll","hook","right","power"],
    links: ["toproll","hook","georgian","evll2021","larratt"],
    x: 400, y: 50, w: 155, h: 60,
    character: {
      country:"Грузія", flag:"🇬🇪", born:1988, active:"2010–досі", hand:"right",
      primary_styles:["toproll","hook"],
      bio:"Леван Сагінашвілі — 'The Table'. Неймовірна природна сила у поєднанні з масою тіла ~148 кг. Правою рукою вважається практично непереможним на максимальних вагах. Переміг Ларрата у більшості матчів. Символ грузинської армрестлінгової школи.",
      signature:"Супернатуральний топрол",
      titles:["WAF World Champion ×5","Zloty Tur Champion ×4","Super Match vs Larratt 2021"],
      world_titles:5,
      anthropometry:{ height:190, weight:148, reach:190, forearm_len:37, bicep_circ:55, forearm_circ:45, wrist_circ:22, hand_span:28 },
      strength:{ grip:155, pull:200, bench:260, curl:130, note:"Можливо найсильніший хват в історії спорту" },
      rating:{ raw_power:10, technique:8, consistency:9, speed:7, longevity:6, titles:9, peak:10 },
    },
  },
  {
    id: "cyplenkov", type: "character",
    title: "Денис Циплєнков", subtitle: "The Hulk · Росія",
    summary: "Легендарні передпліччя ~50 см, абсолютна сила гаку",
    tags: ["russia","hook","right","power","forearms"],
    links: ["hook","russian"],
    x: 585, y: 50, w: 155, h: 60,
    character: {
      country:"Росія", flag:"🇷🇺", born:1981, active:"2004–2018", hand:"right",
      primary_styles:["hook"],
      bio:"Денис Циплєнков — 'The Hulk'. Культова фігура армрестлінгу завдяки фантастичним передпліччям (офіційно виміряні на 50+ см). Багаторазовий чемпіон WAF у важкій вазі. Сирою силою перевершував більшість суперників.",
      signature:"Масивний гак",
      titles:["WAF World Champion ×7","Nemiroff Champion ×5","Zloty Tur Champion ×4"],
      world_titles:7,
      anthropometry:{ height:184, weight:142, reach:183, forearm_len:34, bicep_circ:55, forearm_circ:50, wrist_circ:23, hand_span:27 },
      strength:{ grip:160, pull:180, bench:260, curl:125, note:"Обхват передпліч 50+ см підтверджено офіційно" },
      rating:{ raw_power:10, technique:7, consistency:7, speed:7, longevity:6, titles:8, peak:9 },
    },
  },
  {
    id: "pushkar", type: "character",
    title: "Андрій Пушкар", subtitle: "The Tornado · Україна",
    summary: "Найшвидший армрестлер — вибухова швидкість і техніка",
    tags: ["ukraine","toproll","hook","right","speed"],
    links: ["toproll","hook","ukrainian"],
    x: 770, y: 50, w: 155, h: 60,
    character: {
      country:"Україна", flag:"🇺🇦", born:1978, active:"2000–2016", hand:"right",
      primary_styles:["toproll","hook"],
      bio:"Андрій Пушкар — 'The Tornado'. Українська легенда армрестлінгу. Відрізнявся феноменальною швидкістю старту і технічністю. Переміг багатьох великих чемпіонів у своєму темпі. Герой Nemiroff World Cup.",
      signature:"Вибуховий старт",
      titles:["WAF World Champion ×6","Nemiroff Champion ×6","Zloty Tur Champion ×3"],
      world_titles:6,
      anthropometry:{ height:188, weight:98, reach:188, forearm_len:34, bicep_circ:47, forearm_circ:40, wrist_circ:18, hand_span:25 },
      strength:{ grip:95, pull:130, bench:195, curl:95, note:"Швидкість > сира сила" },
      rating:{ raw_power:8, technique:9, consistency:8, speed:10, longevity:8, titles:9, peak:9 },
    },
  },
  {
    id: "voevoda", type: "character",
    title: "Олексій Воєвода", subtitle: "Бобслей + армрестлінг · Росія",
    summary: "Дворазовий олімпійський медаліст і чемпіон світу з армрестлінгу",
    tags: ["russia","press","hook","right","athlete"],
    links: ["press","hook","russian","evlv2012","larratt"],
    x: 955, y: 50, w: 155, h: 60,
    character: {
      country:"Росія", flag:"🇷🇺", born:1980, active:"2000–2014", hand:"right",
      primary_styles:["press","hook"],
      bio:"Олексій Воєвода — унікальний атлет. Дворазовий олімпійський медаліст у бобслеї (Туринський 2006, Сочі 2014) і водночас багаторазовий чемпіон світу з армрестлінгу. Поєднання вибухової олімпійської атлетики і специфічної сили зробило його одним з найсильніших у важкій вазі.",
      signature:"Силовий пресинг",
      titles:["WAF World Champion ×5","Nemiroff Champion ×4","Olympic Gold Bob 2014"],
      world_titles:5,
      anthropometry:{ height:190, weight:115, reach:191, forearm_len:35, bicep_circ:50, forearm_circ:42, wrist_circ:20, hand_span:26 },
      strength:{ grip:120, pull:160, bench:230, curl:115, note:"Олімпійський рівень загальної атлетики" },
      rating:{ raw_power:9, technique:8, consistency:8, speed:8, longevity:7, titles:8, peak:9 },
    },
  },
  {
    id: "todd", type: "character",
    title: "Майкл Тодд", subtitle: "Venom · США",
    summary: "Майстер топролу, гострий і непередбачуваний стиль",
    tags: ["usa","toproll","right"],
    links: ["toproll","northam"],
    x: 105, y: 178, w: 148, h: 60,
    character: {
      country:"США", flag:"🇺🇸", born:1974, active:"1998–2015", hand:"right",
      primary_styles:["toproll"],
      bio:"Майкл Тодд, 'Venom' — один з найтехнічніших американських пуллерів. Спеціалізувався на гострому топролі, використовуючи пронацію зап'ястя і точне читання суперника.",
      signature:"Sharp Top Roll",
      titles:["WAF World Champion ×4","Nemiroff Champion ×3"],
      world_titles:4,
      anthropometry:{ height:183, weight:102, reach:182, forearm_len:32, bicep_circ:46, forearm_circ:38, wrist_circ:18, hand_span:24 },
      strength:{ grip:90, pull:125, bench:190, curl:90 },
      rating:{ raw_power:8, technique:9, consistency:8, speed:8, longevity:8, titles:8, peak:8 },
    },
  },
  {
    id: "bagent", type: "character",
    title: "Тревіс Бейджент", subtitle: "The Monster · США",
    summary: "130-кілограмовий силовик і шоумен армрестлінгу",
    tags: ["usa","press","hook","right","heavy"],
    links: ["press","hook","northam"],
    x: 858, y: 178, w: 155, h: 60,
    character: {
      country:"США", flag:"🇺🇸", born:1975, active:"2000–2015", hand:"right",
      primary_styles:["press","hook"],
      bio:"Тревіс Бейджент, 'The Monster' — 130 кг чистої армрестлінгової сили і харизми. Відомий яскравими виступами, гучними коментарями і важким тиском на суперника. Чемпіон WAF у надваговій категорії.",
      signature:"Тотальний силовий тиск",
      titles:["WAF World Champion ×4","American Nationals ×6"],
      world_titles:4,
      anthropometry:{ height:190, weight:130, reach:188, forearm_len:34, bicep_circ:52, forearm_circ:44, wrist_circ:21, hand_span:27 },
      strength:{ grip:115, pull:155, bench:240, curl:115 },
      rating:{ raw_power:9, technique:7, consistency:8, speed:7, longevity:7, titles:7, peak:8 },
    },
  },

  // ── Techniques ───────────────────────────────────────────────────────────
  {
    id: "toproll", type: "technique",
    title: "Топрол", subtitle: "Top Roll",
    summary: "Пронація зап'ястя з одночасним підтягуванням — найтехнічніший стиль",
    tags: ["technique","wrist","pronation","technical"],
    links: ["hub","kingsmove"],
    x: 25, y: 358, w: 148, h: 58,
    technique: {
      muscles:["Pronator teres","Brachioradialis","Extensor carpi radialis","Bicep brachii"],
      difficulty:3, power_req:3, technique_req:5,
      description:"Атлет пронує (повертає назовні) своє зап'ястя, одночасно підтягуючи руку суперника до свого плеча. Мета — зламати «кут» суперника і взяти контроль над його пальцями та зап'ястям.",
      key_points:["Зап'ястя повернуте назовні (пронація)","Тяга до власного плеча","Контроль указівним пальцем","Постійний рух вперед-вгору"],
      practitioners:["brzenk","levan","pushkar","todd"],
    },
  },
  {
    id: "hook", type: "technique",
    title: "Гак", subtitle: "Hook",
    summary: "Супінація зап'ястя — максимальна важільна сила",
    tags: ["technique","wrist","supination","power"],
    links: ["hub","backpressure"],
    x: 25, y: 446, w: 148, h: 58,
    technique: {
      muscles:["Bicep brachii","Brachialis","Wrist flexors","Pronator teres"],
      difficulty:4, power_req:5, technique_req:3,
      description:"Атлет згинає своє зап'ястя до себе (супінація/флексія), використовуючи зап'ястя як важіль. Лікоть залишається низько. Дає максимальну механічну перевагу при достатній силі.",
      key_points:["Зап'ястя зігнуте до себе","Лікоть прижатий низько","Ротація всієї руки від плеча","Спина як основна тягнуча сила"],
      practitioners:["larratt","levan","cyplenkov","pushkar","voevoda"],
    },
  },
  {
    id: "press", type: "technique",
    title: "Прес", subtitle: "Press / Shoulder Press",
    summary: "Силовий тиск плечем і грудьми — для масивних атлетів",
    tags: ["technique","shoulder","chest","power"],
    links: ["hub","tricep"],
    x: 25, y: 534, w: 148, h: 58,
    technique: {
      muscles:["Pectoralis major","Anterior deltoid","Tricep brachii","Serratus anterior"],
      difficulty:2, power_req:5, technique_req:2,
      description:"Пряме плечове притискання руки суперника до подушки з використанням маси тіла і потужності грудей. Ефективний при великій різниці у масі.",
      key_points:["Корпус нахилений над столом","Плечо ведуче","Маса тіла як додаткова сила","Пряма лінія від плеча до руки"],
      practitioners:["voevoda","bagent"],
    },
  },
  {
    id: "tricep", type: "technique",
    title: "Трайсеп Прес", subtitle: "Tricep / Over-the-Top",
    summary: "Боковий тиск трицепсом і плечем через верх",
    tags: ["technique","tricep","shoulder","over"],
    links: ["hub","press"],
    x: 25, y: 622, w: 148, h: 58,
    technique: {
      muscles:["Tricep brachii","Lateral deltoid","Wrist extensors"],
      difficulty:3, power_req:4, technique_req:3,
      description:"Атлет веде руку суперника збоку через верх, використовуючи трицепс і боковий пучок дельти. Дає перевагу при стартовому положенні вище за суперника.",
      key_points:["Стартова позиція вище","Відведення ліктя назовні","Бокова ротація","Збереження зап'ястя в нейтралі"],
      practitioners:["bagent","todd"],
    },
  },
  {
    id: "kingsmove", type: "technique",
    title: "King's Move", subtitle: "Перехід Бренка",
    summary: "Фірмовий перехід Джона Бренка: топрол → важільна позиція",
    tags: ["technique","transition","brzenk","advanced"],
    links: ["toproll","hook"],
    x: 215, y: 680, w: 155, h: 58,
    technique: {
      muscles:["Pronator teres","Bicep brachii","Wrist flexors","Forearm flexors"],
      difficulty:5, power_req:3, technique_req:5,
      description:"Підпис Джона Бренка. Миттєвий перехід з топролу у важільну позицію, яка фіксує руку суперника у невигідному куті. Вимагає досконалого читання ситуації і феноменальної координації.",
      key_points:["Починається як топрол","Різкий перехід у момент послаблення суперника","Фіксація кута","Фінальний тиск"],
      practitioners:["brzenk","larratt"],
    },
  },
  {
    id: "backpressure", type: "technique",
    title: "Зворотній тиск", subtitle: "Back Pressure",
    summary: "Тиск на руку суперника назад від себе — захисно-атакуюча техніка",
    tags: ["technique","wrist","defensive"],
    links: ["hook"],
    x: 215, y: 602, w: 155, h: 58,
    technique: {
      muscles:["Wrist extensors","Extensor carpi radialis","Brachioradialis"],
      difficulty:3, power_req:3, technique_req:4,
      description:"Зовні нагадує пасивний захист, але насправді атакує зап'ястя суперника, ведучи його руку від себе. Часто комбінується з гаком для зламу захисту.",
      key_points:["Тиск спрямований від себе","Зап'ястя в нейтральній позиції","Використовується при гаку суперника","Перехід у топрол або гак"],
      practitioners:["larratt","pushkar"],
    },
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    id: "ev1952", type: "event",
    title: "Перший турнір", subtitle: "Петалума, 1952",
    summary: "Білл Собранес організував перший офіційний турнір з армрестлінгу в Каліфорнії",
    tags: ["history","usa","origin","1952"],
    links: ["hub","northam"],
    x: 50, y: 805, w: 165, h: 58,
    event: {
      year:1952, location:"Петалума, Каліфорнія, США", category:"history",
      description:"Білл Собранес організував у барі Gilardi's Saloon перший офіційний зафіксований турнір з армрестлінгу. Це вважається точкою відліку сучасного організованого армрестлінгу.",
      significance:"Народження офіційного армрестлінгу як спорту",
    },
  },
  {
    id: "ev1987", type: "event",
    title: "Фільм 'Over the Top'", subtitle: "Голівуд, 1987",
    summary: "Голлівудський фільм з Сталлоне популяризував армрестлінг на весь світ",
    tags: ["media","history","stallone","1987","pop-culture"],
    links: ["hub","northam"],
    x: 255, y: 815, w: 158, h: 58,
    event: {
      year:1987, location:"США", category:"media",
      description:"Фільм Менаема Голана за участі Сільвестра Сталлоне познайомив мільйони глядачів по всьому світу з армрестлінгом. Назва нашої платформи OverTheTop — данина цьому фільму.",
      significance:"Глобальна популяризація армрестлінгу через масову культуру",
      outcome:"Стрімке зростання інтересу до спорту у 1987–1992",
    },
  },
  {
    id: "ev1995", type: "event",
    title: "Заснування WAF", subtitle: "1995",
    summary: "Створена Всесвітня федерація армрестлінгу — головний керівний орган",
    tags: ["history","WAF","federation","1995"],
    links: ["hub"],
    x: 453, y: 805, w: 155, h: 58,
    event: {
      year:1995, category:"history",
      description:"Заснована World Armwrestling Federation (WAF) — міжнародна організація, яка стандартизувала правила, вагові категорії і систему чемпіонатів світу. Донині є головним регулятором спорту.",
      significance:"Стандартизація правил і міжнародне визнання армрестлінгу",
    },
  },
  {
    id: "evlv2012", type: "event",
    title: "Ларрат vs Воєвода", subtitle: "Суперматч, 2012",
    summary: "Легендарний матч двох чемпіонів — «Матч сторіччя» свого часу",
    tags: ["supermatch","larratt","voevoda","2012","right"],
    links: ["supermatches","larratt","voevoda"],
    x: 648, y: 815, w: 178, h: 58,
    event: {
      year:2012, category:"supermatch",
      participants:["larratt","voevoda"],
      description:"Матч між Девоном Ларратом (Канада) і Олексієм Воєводою (Росія) — два чинних чемпіони у різних вагах. Вважався 'Матчем сторіччя' для свого часу. Відбувся кілька пін-серій.",
      outcome:"Воєвода переміг більшість серій правою рукою",
      significance:"Перший великий суперматч сучасної ери армрестлінгу",
    },
  },
  {
    id: "evll2021", type: "event",
    title: "Ларрат vs Леван", subtitle: "Суперматч, 2021",
    summary: "Найочікуваніший матч за всю сучасну історію — 46-річний vs 33-річний",
    tags: ["supermatch","larratt","levan","2021","right"],
    links: ["supermatches","larratt","levan"],
    x: 866, y: 805, w: 178, h: 58,
    event: {
      year:2021, location:"Онлайн-трансляція (понад 2 млн глядачів)", category:"supermatch",
      participants:["larratt","levan"],
      description:"Найочікуваніший матч сучасного армрестлінгу. 46-річний Ларрат проти 33-річного Левана Сагінашвілі. Леван виграв обидві серії правою рукою, але Ларрат виглядав набагато конкурентоспроможнішим ніж очікували.",
      outcome:"Леван переміг 2:0 правою рукою",
      significance:"Рекорд перегляду армрестлінгу онлайн, найкращий матч для промоції спорту",
    },
  },

  // ── Concepts ─────────────────────────────────────────────────────────────
  {
    id: "georgian", type: "concept",
    title: "Грузинська школа", subtitle: "Школа потужності",
    summary: "Відома надприродною масою і силою, лідер — Леван Сагінашвілі",
    tags: ["concept","georgia","power","school"],
    links: ["levan","hub"],
    x: 1060, y: 90, w: 162, h: 58,
    concept: {
      description:"Грузинська школа армрестлінгу відома культом сирої сили і великої маси тіла. Атлети традиційно набирають максимальну вагу без вагових обмежень і роблять ставку на переважаючий хват і тягу.",
      members:["levan"],
      traits:["максимальна маса","сира сила","гак і топрол","відкрита вага"],
    },
  },
  {
    id: "northam", type: "concept",
    title: "Північноамериканська школа", subtitle: "Технічний стиль",
    summary: "Акцент на техніці, топролі і психологічній грі",
    tags: ["concept","usa","canada","technical","school"],
    links: ["brzenk","larratt","todd","bagent","hub"],
    x: 1065, y: 218, w: 162, h: 58,
    concept: {
      description:"Американська і канадська школи роблять ставку на технічну різноманітність: топрол, King's Move, психологію. Брзенк і Ларрат — еталонні представники. Культура суперматчів народилась тут.",
      members:["brzenk","larratt","todd","bagent"],
      traits:["технічність","топрол","King's Move","суперматчі","довголіття"],
    },
  },
  {
    id: "supermatches", type: "concept",
    title: "Суперматчі", subtitle: "Super Matches",
    summary: "Формат особистих поєдинків топ-чемпіонів поза офіційними турнірами",
    tags: ["concept","format","entertainment","supermatch"],
    links: ["evlv2012","evll2021","hub"],
    x: 1065, y: 346, w: 162, h: 58,
    concept: {
      description:"Суперматч — поєдинок двох топ-атлетів поза форматом офіційного чемпіонату. Зазвичай декілька серій правою і лівою рукою. Формат популяризований Devon Larratt і Engin Terzi (промоутер). Генерує мільйони переглядів.",
      members:["larratt","levan","voevoda","evlv2012","evll2021"],
      traits:["прямий поєдинок","кілька серій","права і ліва","промоушн","мільйони переглядів"],
    },
  },
  {
    id: "ukrainian", type: "concept",
    title: "Українська школа", subtitle: "Школа швидкості",
    summary: "Вибухова швидкість і технічність — флагман Андрій Пушкар",
    tags: ["concept","ukraine","speed","school"],
    links: ["pushkar","hub"],
    x: 1065, y: 474, w: 162, h: 58,
    concept: {
      description:"Українська школа армрестлінгу базується на вибуховій швидкості старту, технічній різноманітності і відмінній підготовці. Андрій Пушкар 'The Tornado' — найяскравіший представник. Nemiroff World Cup — головний турнір.",
      members:["pushkar"],
      traits:["вибуховий старт","швидкість","техніка","Nemiroff Cup","різноманітність стилів"],
    },
  },
  {
    id: "russian", type: "concept",
    title: "Російська школа", subtitle: "Школа сили",
    summary: "Велика маса, сильний хват і прямолінійна потужність",
    tags: ["concept","russia","power","school"],
    links: ["cyplenkov","voevoda","hub"],
    x: 1065, y: 602, w: 162, h: 58,
    concept: {
      description:"Російська школа — це масштабна спортивна система з великою кількістю клубів. Представники відрізняються величезними передпліччями, міцним хватом і прямолінійною атакою. Циплєнков і Воєвода — флагмани.",
      members:["cyplenkov","voevoda"],
      traits:["велика маса","сильний хват","прямолінійна атака","гак","масова база"],
    },
  },

  // ── New Ukrainian & International Characters ──────────────────────────────
  {
    id: "zhokh", type: "character",
    title: "Олег Жох", subtitle: "Joker · Україна",
    summary: "Зірка YouTube і технічний майстер, унікальний стиль King's Move",
    tags: ["ukraine","toproll","kingsmove","right","youtube","modern"],
    links: ["toproll","kingsmove","ukrainian"],
    x: 1175, y: 50, w: 158, h: 60,
    character: {
      country:"Україна", flag:"🇺🇦", born:1988, active:"2006–досі", hand:"right",
      primary_styles:["toproll","kingsmove"],
      bio:"Олег Жох — один з найбільш впізнаваних сучасних рукоборців України. Відомий унікальним технічним стилем, неймовірним хватом і величезною популярністю в соціальних мережах. Його навчальні відео дивляться мільйони. Багаторазовий чемпіон України та призер чемпіонатів Європи.",
      signature:"Технічний King's Move",
      titles:["Чемпіон України ×8","Призер Чемпіонату Європи ×5","Учасник Nemiroff World Cup"],
      world_titles:0,
      anthropometry:{ height:185, weight:90, reach:185, forearm_len:33, bicep_circ:44, forearm_circ:37, wrist_circ:17, hand_span:24 },
      strength:{ grip:92, pull:120, bench:185, curl:88, note:"Виняткова якість хвату і контроль зап'ястя" },
      rating:{ raw_power:7, technique:9, consistency:8, speed:9, longevity:7, titles:6, peak:8 },
    },
  },
  {
    id: "mazurenko", type: "character",
    title: "Ігор Мазуренко", subtitle: "Засновник Nemiroff · Україна",
    summary: "Легенда організації спорту, засновник найбільшого турніру у світі",
    tags: ["ukraine","organizer","legend","nemiroff","promoter"],
    links: ["ukrainian","ev_nemiroff"],
    x: 1175, y: 160, w: 158, h: 60,
    character: {
      country:"Україна", flag:"🇺🇦", born:1968, active:"1990–2010", hand:"right",
      primary_styles:["toproll","hook"],
      bio:"Ігор Мазуренко — одна з ключових фігур світового армрестлінгу. Засновник і організатор Nemiroff World Cup — найбільшого і найпрестижнішого турніру в історії спорту. Сам активно змагався у 1990-х — 2000-х, вигравши кілька великих турнірів. Завдяки йому армрестлінг в Україні отримав масовий розвиток.",
      signature:"Nemiroff World Cup",
      titles:["Засновник Nemiroff World Cup","Переможець міжнародних турнірів","Амбасадор армрестлінгу України"],
      world_titles:1,
      anthropometry:{ height:182, weight:88, reach:182, forearm_len:32, bicep_circ:44, forearm_circ:37, wrist_circ:18, hand_span:23 },
      strength:{ grip:85, pull:110, bench:175, curl:82, note:"Дані приблизні, пік ~2000-і" },
      rating:{ raw_power:7, technique:8, consistency:8, speed:7, longevity:8, titles:7, peak:8 },
    },
  },
  {
    id: "babayev", type: "character",
    title: "Рустам Бабаєв", subtitle: "Азербайджан",
    summary: "Багаторазовий чемпіон світу, блискавичний старт і нищівний хват",
    tags: ["azerbaijan","hook","toproll","right","speed","modern"],
    links: ["hook","toproll"],
    x: 1360, y: 50, w: 155, h: 60,
    character: {
      country:"Азербайджан", flag:"🇦🇿", born:1986, active:"2005–досі", hand:"right",
      primary_styles:["hook","toproll"],
      bio:"Рустам Бабаєв — один з домінуючих чемпіонів сучасного армрестлінгу. Відомий неймовірно швидким стартом і потужним хватом. Bagatorazovy чемпіон WAF у своїй ваговій категорії. Здатний переходити між стилями залежно від суперника.",
      signature:"Блискавичний старт",
      titles:["WAF World Champion ×5","Nemiroff Champion ×3","ArmFight Champion"],
      world_titles:5,
      anthropometry:{ height:183, weight:95, reach:183, forearm_len:33, bicep_circ:46, forearm_circ:39, wrist_circ:18, hand_span:24 },
      strength:{ grip:100, pull:135, bench:195, curl:92, note:"Виняткова стартова швидкість" },
      rating:{ raw_power:8, technique:8, consistency:8, speed:10, longevity:7, titles:8, peak:9 },
    },
  },
  {
    id: "erdi", type: "character",
    title: "Ерді Курт", subtitle: "Туреччина",
    summary: "Новий голос сучасного армрестлінгу, феноменальна сила прессу",
    tags: ["turkey","press","hook","right","modern","rising"],
    links: ["press","hook"],
    x: 1360, y: 160, w: 155, h: 60,
    character: {
      country:"Туреччина", flag:"🇹🇷", born:1994, active:"2015–досі", hand:"right",
      primary_styles:["press","hook"],
      bio:"Ерді Курт — один з найсильніших важкоатлетів сучасного армрестлінгу. Представляє нове покоління турецьких спортсменів. Відзначається феноменальним силовим пресом і здатністю зупиняти будь-який старт суперника масою і тиском.",
      signature:"Абсолютний прес",
      titles:["WAF World Champion ×3","Чемпіон Туреччини ×6","EuroArm Medallist"],
      world_titles:3,
      anthropometry:{ height:188, weight:118, reach:188, forearm_len:35, bicep_circ:51, forearm_circ:42, wrist_circ:20, hand_span:26 },
      strength:{ grip:118, pull:155, bench:235, curl:110, note:"Дуже потужний прес, важкий старт" },
      rating:{ raw_power:9, technique:7, consistency:8, speed:7, longevity:5, titles:7, peak:8 },
    },
  },
  {
    id: "krasimir", type: "character",
    title: "Красімір Колев", subtitle: "Болгарія",
    summary: "Найбільш стабільний европейський чемпіон, ліва рука",
    tags: ["bulgaria","hook","left","europe","consistent"],
    links: ["hook"],
    x: 1175, y: 265, w: 155, h: 60,
    character: {
      country:"Болгарія", flag:"🇧🇬", born:1982, active:"2005–2020", hand:"left",
      primary_styles:["hook"],
      bio:"Красімір Колев — один з найстабільніших лівих пулерів Європи. Багаторазовий чемпіон Болгарії і призер чемпіонатів світу. Відрізнявся неймовірно міцним гаком і здатністю виступати стабільно на будь-якому рівні.",
      signature:"Лівосторонній гак",
      titles:["WAF World Champion ×3","Чемпіон Болгарії ×10","EuroArm Champion ×5"],
      world_titles:3,
      anthropometry:{ height:184, weight:96, reach:183, forearm_len:33, bicep_circ:46, forearm_circ:38, wrist_circ:18, hand_span:24 },
      strength:{ grip:95, pull:128, bench:190, curl:90, note:"Ліва рука — основна" },
      rating:{ raw_power:8, technique:8, consistency:9, speed:7, longevity:8, titles:7, peak:8 },
    },
  },

  // ── Recovery & Training Tips (Concepts) ───────────────────────────────────
  {
    id: "recovery", type: "concept",
    title: "Відновлення", subtitle: "Recovery Protocols",
    summary: "Протоколи відновлення після тренувань і змагань для рукоборців",
    tags: ["concept","recovery","rest","health","protocol"],
    links: ["hub","training_tips"],
    x: 1175, y: 380, w: 165, h: 60,
    concept: {
      description:"Відновлення — критичний компонент для рукоборців. Зап'ясток і передпліччя — зони підвищеного ризику. 48–72 год відпочинку між інтенсивними сесіями. Холодова терапія (10 хв) після важких тренувань знижує запалення. Розтяжка зап'ястя в обидва напрямки 3×30 сек. Масаж передпліч кулачком по 2 хв на кожну руку. Сон 8+ год — пік синтезу колагену для сухожиль.",
      members:[],
      traits:["48–72 год між сесіями","холодова терапія","розтяжка зап'ястя","масаж передпліч","сон 8+ год","профілактика тендиніту"],
    },
  },
  {
    id: "training_tips", type: "concept",
    title: "Тренувальні поради", subtitle: "Strength Tips",
    summary: "Ключові принципи побудови армрестлінгової сили і техніки",
    tags: ["concept","training","tips","strength","technique"],
    links: ["hub","recovery","nutrition"],
    x: 1175, y: 490, w: 165, h: 60,
    concept: {
      description:"Специфіка армрестлінгу: 80% роботи — специфічні рухи за столом, 20% — загальна фізична підготовка. Хват тренувати щодня (легкий) або 3×/тиждень (важкий). Пронація і супінація — основні рухи, ізолювати і тренувати окремо. Стол — найкраще обладнання: 30% тренування за столом з партнером. Не нехтувати м'язами-антагоністами (розгиначі пальців, м'язи-супінатори) — профілактика травм.",
      members:[],
      traits:["80% специфічна робота","щоденний хват","пронація/супінація ізольовано","30% за столом з партнером","тренуй антагоністи","поступове навантаження"],
    },
  },
  {
    id: "nutrition", type: "concept",
    title: "Харчування", subtitle: "Nutrition for Arm Wrestling",
    summary: "Протоколи харчування і добавки для рукоборців",
    tags: ["concept","nutrition","supplements","recovery","health"],
    links: ["hub","recovery"],
    x: 1175, y: 600, w: 165, h: 60,
    concept: {
      description:"Харчування рукоборця фокусується на сухожиллях і відновленні. Колаген + Вітамін C (за 30 хв до тренування) — науково підтверджена стратегія для зміцнення сухожиль. Протеїн 1.6–2.0 г/кг маси тіла. Creatine monohydrate 5 г/день підвищує силу у вибухових вправах. Магній перед сном — якість сну і м'язова релаксація. Омега-3 знижує запалення у суглобах.",
      members:[],
      traits:["колаген + вітамін C","протеїн 1.6–2.0 г/кг","creatine 5г/день","магній перед сном","омега-3 для суглобів","гідратація 2.5 л/день"],
    },
  },
  {
    id: "injury_prevention", type: "concept",
    title: "Профілактика травм", subtitle: "Injury Prevention",
    summary: "Як уникнути найпоширеніших травм у рукоборстві",
    tags: ["concept","injury","prevention","health","wrist","elbow"],
    links: ["hub","recovery","training_tips"],
    x: 1360, y: 380, w: 165, h: 60,
    concept: {
      description:"Найпоширеніші травми: тендиніт передпліччя (40%), розтягнення ліктя (25%), травма біцепсу (15%). Профілактика: ніколи не борись повністю холодним — 10 хв розминки мінімум. Не виходь за межі болю. Якщо чуєш тріск — зупинись. Зміцнюй м'язи-антагоністи. Не тренуй через гострий біль. Еластичні бинти — не лікування, а профілактика. При тендиніті — ексцентричні вправи, не повний спокій.",
      members:[],
      traits:["10 хв розминки обов'язково","не борись через біль","зміцнюй антагоністи","ексцентричні вправи при тендиніті","не ігноруй тріск","холодний компрес після"],
    },
  },

  // ── New Historical Events ─────────────────────────────────────────────────
  {
    id: "ev_lincoln", type: "event",
    title: "Авраам Лінкольн", subtitle: "Легенда, ~1830–1860-і",
    summary: "16-й президент США вважається одним з кращих рукоборців свого часу",
    tags: ["history","usa","lincoln","curiosity","19century"],
    links: ["hub","ev1952"],
    x: 1360, y: 490, w: 165, h: 60,
    event: {
      year:1850, location:"США, Іллінойс", category:"history",
      description:"Авраам Лінкольн, 16-й президент США, вважався одним з найкращих борців на руках свого часу. Зріст 193 см і надзвичайно довгі руки давали йому механічну перевагу. За легендою, він програв лише один раз за все своє молоде життя. Армрестлінг тоді був популярним розвагою на американських ярмарках.",
      outcome:"За легендою, лише одна поразка за все молоде життя",
      significance:"Найвідоміший нечемпіон в історії армрестлінгу — доказ масовості спорту",
    },
  },
  {
    id: "ev_nemiroff", type: "event",
    title: "Nemiroff World Cup", subtitle: "Перший, 1999",
    summary: "Засновано найпрестижніший турнір з армрестлінгу у світі — Nemiroff",
    tags: ["history","ukraine","nemiroff","tournament","mazurenko","1999"],
    links: ["hub","mazurenko","ukrainian"],
    x: 1360, y: 600, w: 165, h: 60,
    event: {
      year:1999, location:"Київ, Україна", category:"competition",
      participants:["mazurenko"],
      description:"Ігор Мазуренко заснував Nemiroff World Cup — турнір, який став еталоном армрестлінгу. Проходив у Києві за підтримки бренду Nemiroff. Зібрав топ-атлетів з усього світу і транслювався на телебаченні. Турнір підняв армрестлінг на рівень масового видовища.",
      outcome:"Турнір став щорічним, найпрестижнішим у світі",
      significance:"Трансформація армрестлінгу з нішевого спорту у видовищне змагання для широкої аудиторії",
    },
  },
  {
    id: "ev_youtube", type: "event",
    title: "YouTube-ера", subtitle: "2010+",
    summary: "Відео-контент перетворив армрестлінг на глобальний онлайн-феномен",
    tags: ["history","youtube","media","modern","online","2010"],
    links: ["hub","supermatches","zhokh"],
    x: 1360, y: 700, w: 165, h: 60,
    event: {
      year:2010, category:"media",
      description:"З 2010 року YouTube-канали армрестлерів (Devon Larratt, Oleg Zhokh, різні промоутери) почали збирати мільйони переглядів. Стиль arm wrestling challenge-відео, аналіз матчів, тренувальний контент — все це привернуло нову молоду аудиторію. До 2021 матч Ларрат-Леван набрав понад 50 млн переглядів.",
      outcome:"Десятки мільйонів нових глядачів і конкурентів",
      significance:"Найбільш значущий стрибок у популярності спорту після фільму 1987 року",
    },
  },

  // ── Interesting Facts ─────────────────────────────────────────────────────
  {
    id: "fact_physics", type: "concept",
    title: "Фізика армрестлінгу", subtitle: "Science of the Table",
    summary: "Механіка, кути й сила — чому техніка перемагає грубу силу",
    tags: ["concept","physics","science","mechanics","advantage"],
    links: ["hub","toproll","hook"],
    x: 1360, y: 800, w: 165, h: 60,
    concept: {
      description:"Армрестлінг — це битва важелів. Довший важіль (рука) = більший момент сили. Звідси перевага Ларрата (розмах 198 см). Оптимальний кут ліктя — 90°, при ньому м'язи розвивають максимальну силу. Топрол виграє по кутах: ламаючи зап'ястя суперника, він відключає його м'язи. Гак перемагає по імпульсу: чим ближче рука до тіла, тим сильніший. Старт часто вирішує все — перші 0.2 секунди задають кут, і невигідний кут майже не виправити силою.",
      members:[],
      traits:["боротьба важелів","кут ліктя 90° = максимум","розмах рук як перевага","перші 0.2 сек вирішують","ламання кута = відключення м'язів","близькість до тіла = сила гаку"],
    },
  },
  {
    id: "fact_records", type: "concept",
    title: "Рекорди та факти", subtitle: "Records & Curiosities",
    summary: "Найбільші передпліччя, найсильніший хват і найдовша кар'єра",
    tags: ["concept","records","facts","trivia","extremes"],
    links: ["hub","cyplenkov","levan","larratt"],
    x: 210, y: 800, w: 162, h: 60,
    concept: {
      description:"Рекорд передпліч: Денис Циплєнков — офіційно виміряні 50+ см обхват. Найсильніший хват: Леван Сагінашвілі — 155+ кг за динамометром (неофіційний рекорд серед армрестлерів). Найдовша кар'єра: Девон Ларрат — активно змагається у 48+ років на топ-рівні. Найбільш переглянутий матч: Ларрат vs Леван 2021 — 50+ млн переглядів на одному відео. Найбільший ваговий gap у матчі: Леван (~148 кг) vs легші суперники.",
      members:["cyplenkov","levan","larratt"],
      traits:["50+ см передпліччя — Циплєнков","155+ кг хват — Леван","48+ років активно — Ларрат","50 млн переглядів матч 2021","найбільший ваговий gap — Леван","1952 — перший офіційний турнір"],
    },
  },
];

// ─── Edges ────────────────────────────────────────────────────────────────────

export const ALMANAC_EDGES: AlmanacEdge[] = [
  // Hub → core
  { from:"hub",        to:"toproll" },
  { from:"hub",        to:"hook" },
  { from:"hub",        to:"press" },
  { from:"hub",        to:"ev1952",    dash:true },
  { from:"hub",        to:"georgian",  dash:true },
  { from:"hub",        to:"northam",   dash:true },
  { from:"hub",        to:"supermatches" },
  { from:"hub",        to:"ukrainian", dash:true },
  { from:"hub",        to:"russian",   dash:true },

  // Characters → techniques
  { from:"brzenk",    to:"toproll",      label:"використовує" },
  { from:"brzenk",    to:"kingsmove",    label:"підпис" },
  { from:"larratt",   to:"hook",         label:"використовує" },
  { from:"larratt",   to:"kingsmove",    label:"використовує" },
  { from:"levan",     to:"toproll",      label:"використовує" },
  { from:"levan",     to:"hook",         label:"використовує" },
  { from:"cyplenkov", to:"hook",         label:"використовує" },
  { from:"voevoda",   to:"press",        label:"використовує" },
  { from:"voevoda",   to:"hook",         label:"використовує" },
  { from:"pushkar",   to:"toproll",      label:"використовує" },
  { from:"pushkar",   to:"hook",         label:"використовує" },
  { from:"todd",      to:"toproll",      label:"використовує" },
  { from:"bagent",    to:"press",        label:"використовує" },
  { from:"bagent",    to:"hook",         label:"використовує" },

  // Characters → country concepts
  { from:"brzenk",    to:"northam",      dash:true },
  { from:"larratt",   to:"northam",      dash:true },
  { from:"todd",      to:"northam",      dash:true },
  { from:"bagent",    to:"northam",      dash:true },
  { from:"levan",     to:"georgian",     dash:true },
  { from:"voevoda",   to:"russian",      dash:true },
  { from:"cyplenkov", to:"russian",      dash:true },
  { from:"pushkar",   to:"ukrainian",    dash:true },

  // Characters → events
  { from:"larratt",   to:"evlv2012",     dash:true },
  { from:"voevoda",   to:"evlv2012",     dash:true },
  { from:"larratt",   to:"evll2021",     dash:true },
  { from:"levan",     to:"evll2021",     dash:true },

  // Rivalry
  { from:"larratt",   to:"levan",        dash:true, label:"суперник" },
  { from:"larratt",   to:"voevoda",      dash:true, label:"суперник" },

  // Technique relationships
  { from:"kingsmove", to:"toproll",      dash:true },
  { from:"kingsmove", to:"hook",         dash:true },
  { from:"backpressure", to:"hook",      dash:true },
  { from:"tricep",    to:"press",        dash:true },

  // Events → concepts
  { from:"evlv2012",  to:"supermatches", dash:true },
  { from:"evll2021",  to:"supermatches", dash:true },
  { from:"ev1952",    to:"northam",      dash:true },
  { from:"ev1987",    to:"hub",          dash:true },
  { from:"ev1995",    to:"hub",          dash:true },

  // New characters → techniques
  { from:"zhokh",      to:"toproll",      label:"використовує" },
  { from:"zhokh",      to:"kingsmove",    label:"використовує" },
  { from:"babayev",    to:"hook",         label:"використовує" },
  { from:"babayev",    to:"toproll",      label:"використовує" },
  { from:"erdi",       to:"press",        label:"використовує" },
  { from:"erdi",       to:"hook",         label:"використовує" },
  { from:"krasimir",   to:"hook",         label:"використовує" },

  // New characters → schools
  { from:"zhokh",      to:"ukrainian",    dash:true },
  { from:"mazurenko",  to:"ukrainian",    dash:true },

  // New characters → events
  { from:"mazurenko",  to:"ev_nemiroff",  dash:true },

  // Recovery/tips
  { from:"training_tips", to:"recovery",  dash:true },
  { from:"nutrition",     to:"recovery",  dash:true },
  { from:"injury_prevention", to:"recovery", dash:true },
  { from:"injury_prevention", to:"training_tips", dash:true },

  // Facts/events
  { from:"ev_lincoln",  to:"ev1952",      dash:true },
  { from:"ev_youtube",  to:"supermatches",dash:true },
  { from:"ev_nemiroff", to:"ev1995",      dash:true },
  { from:"fact_records", to:"cyplenkov",  dash:true },
  { from:"fact_records", to:"levan",      dash:true },
  { from:"fact_records", to:"larratt",    dash:true },
  { from:"fact_physics", to:"toproll",    dash:true },
  { from:"fact_physics", to:"hook",       dash:true },
];
