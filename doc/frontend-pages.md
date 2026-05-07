# Frontend — Сторінки і компоненти

## Статуси: ✅ Готово | 🚧 В роботі | 📋 Заплановано

---

## Сторінки

### `/` — Home ✅
Лендінг з hero і 3 картками (Training / Tournaments / Analytics). CTA: Login, Register.

### `/login` ✅
Форма email + пароль. Помилка при невірних даних. Redirect → `/dashboard`.

### `/register` ✅
3-кроковий wizard:
1. Ім'я, прізвище, email, пароль
2. Стать, дата народження, вага, категорія, країна, клуб
3. Рука (Left/Right/Both), стиль (TopRoll/Hook/Press/Tricep/Universal)

### `/dashboard` ✅🚧
Статичні плейсхолдери. Потрібно:
- 📋 Реальна статистика (тренування/місяць, streak)
- 📋 Наступне тренування за планом
- 📋 Останній PR
- 📋 Кнопка "Почати тренування сьогодні"

### `/profile` ✅
Перегляд + редагування профілю. Всі поля через модалку.

### `/training` ✅
Список macroperiods. Картки з деталями. Delete. CTA "Створити план".

### `/training/new` ✅
4-кроковий wizard: план → мезоцикли → дні → вправи.

### `/training/log` 📋
Список всіх тренувальних сесій (дата, тривалість, вправи). Фільтр по даті.

### `/training/log/new` 📋
Логування сесії:
- Вибір дати
- Підтягнути вправи з dayTemplate (якщо є план)
- Для кожної вправи: список підходів (set_number, reps, weightKg)
- Таймер відпочинку
- Автомітка PR

### `/training/log/[id]` 📋
Детальна сесія: всі вправи, підходи, мітки PR, нотатки.

### `/today` 📋
Головна сторінка щоденного check-in:
- Який день за планом (за активним macroperiod)
- Список вправ на сьогодні
- Кнопка "Почати тренування"
- Check-in самопочуття (сон, відновлення, стрес)
- Нотатка дня

### `/records` 📋
Особисті рекорди:
- Таблиця: вправа → найкращий результат → дата
- Фільтр по стилю / м'язовій групі

### `/tournaments` ✅
Список з фільтрами, countdown, пріоритети A/B/C, офіційний календар.

### `/analytics` ✅🚧
6 вкладок з UI (мок-дані). Потрібно підключити реальні дані після Фази 3.

Вкладки:
- **Огляд** — 📋 реальний об'єм тренувань, розподіл м'язів
- **Тренування** — 📋 реальний прогрес
- **Дієта** — 📋 реальний графік ваги
- **Фарма** — 💡 може залишитись як інфо-довідник
- **Відновлення** — 📋 реальний recovery score
- **Реабілітація** — 💡 статичний довідник ок

---

## Компоненти

### Layout

**`Sidebar`** ✅
Фіксований лівий navbar. Посилання: Dashboard / Training / Tournaments / Analytics / Profile. ThemeSwitcher. Logout.
- 📋 Collapse на мобільних → нижній navbar

**`ThemeSwitcher`** ✅
Перемикач orange / lime / yellow. Зберігає в localStorage.

### UI kit

| Компонент | Статус | Props |
|-----------|--------|-------|
| `Button` | ✅ | variant (primary/secondary/ghost/danger), size (sm/md/lg), glow |
| `Card` | ✅ | strong, className |
| `Input` | ✅ | label, type, value, onChange, placeholder, error |
| `Select` | ✅ | label, value, onChange |
| `Badge` | ✅ | variant (accent/success/warning/danger/neutral) |
| `Modal` | ✅ | open, onClose, title |

### Потрібно додати

| Компонент | Де використовується |
|-----------|---------------------|
| `LineChart` 📋 | Графік ваги, прогрес вправи, recovery |
| `BarChart` 📋 | Об'єм тренувань по тижнях |
| `SetLogger` 📋 | Рядок підходу (reps + weight + PR badge) |
| `RestTimer` 📋 | Таймер між підходами |
| `Spinner` 📋 | Loading state |
| `Toast` 📋 | Notifications (PR, помилки) |
| `BottomNav` 📋 | Мобільний navbar |
| `PRBadge` 📋 | Золота мітка особистого рекорду |

---

## Lib / API клієнти

| Файл | Статус | Що робить |
|------|--------|-----------|
| `lib/api.ts` | ✅ | Axios instance + Bearer interceptor + 401 redirect |
| `lib/auth.ts` | ✅ | register, login, saveToken, getToken, logout |
| `lib/profile.ts` | ✅ | getProfile, updateProfile + label maps |
| `lib/training.ts` | ✅ | macroperiod CRUD + enums + autoSuggestMesocycles |
| `lib/tournaments.ts` | ✅ | localStorage CRUD + офіційний календар 2026 |
| `lib/types.ts` | ✅ | AthleteProfile, AuthResponse, enums |
| `lib/theme.ts` | ✅ | ThemeMode type |
| `lib/sessions.ts` | 📋 | CRUD журналу тренувань |
| `lib/analytics.ts` | 📋 | запити до /api/analytics/* |
| `lib/weightLog.ts` | 📋 | CRUD логу ваги тіла |
| `lib/recovery.ts` | 📋 | CRUD щоденного check-in |

---

## Context / State

| Контекст | Статус | Зміст |
|----------|--------|-------|
| `ThemeContext` | ✅ | theme: orange/lime/yellow, setTheme |
| `AuthContext` | 📋 | поточний атлет, isLoading, logout |
| `SessionContext` | 📋 | активна тренувальна сесія (для таймера) |
