# Архітектура проекту

## Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | .NET 10 (C#), ASP.NET Core, Clean Architecture |
| ORM | Entity Framework Core |
| База даних | PostgreSQL 16 |
| Auth | JWT Bearer tokens |
| HTTP клієнт | Axios |
| State | React Context + TanStack Query (встановлено, не використовується) |
| Контейнери | Docker Compose (postgres + api + frontend) |

---

## Структура проекту

```
OverTheTop/
├── doc/                        ← документація (цей каталог)
├── frontend/                   ← Next.js застосунок
│   ├── app/                    ← сторінки (App Router)
│   │   ├── page.tsx            ← / (home)
│   │   ├── layout.tsx          ← root layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── training/
│   │   │   ├── page.tsx        ← список планів
│   │   │   └── new/page.tsx    ← 4-кроковий wizard
│   │   ├── tournaments/page.tsx
│   │   └── analytics/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeSwitcher.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       └── Modal.tsx
│   ├── context/
│   │   └── ThemeContext.tsx
│   └── lib/
│       ├── api.ts              ← Axios instance + interceptors
│       ├── auth.ts             ← register/login/token
│       ├── profile.ts          ← getProfile/updateProfile
│       ├── training.ts         ← macroperiod API + enums
│       ├── tournaments.ts      ← localStorage CRUD + офіційний календар
│       ├── types.ts            ← спільні TypeScript типи
│       └── theme.ts            ← ThemeMode type
│
└── backend/
    ├── OverTheTop.API/         ← Presentation layer
    │   ├── Controllers/
    │   │   ├── AuthController.cs
    │   │   ├── ExercisesController.cs
    │   │   ├── HealthController.cs
    │   │   ├── MacroperiodController.cs
    │   │   └── ProfileController.cs
    │   ├── Program.cs          ← DI, middleware, CORS, JWT
    │   └── appsettings.json
    ├── OverTheTop.Application/ ← Use cases, interfaces
    ├── OverTheTop.Domain/      ← Entities, Enums (чиста доменна логіка)
    │   ├── Entities/
    │   │   ├── BaseEntity.cs
    │   │   ├── Athlete.cs
    │   │   ├── Exercise.cs
    │   │   ├── Macroperiod.cs
    │   │   ├── Mesocycle.cs
    │   │   ├── DayTemplate.cs
    │   │   ├── TrainingBlock.cs
    │   │   ├── TrainingSession.cs
    │   │   ├── TrainingExercise.cs
    │   │   ├── Tournament.cs
    │   │   ├── TournamentParticipant.cs
    │   │   └── Match.cs
    │   └── Enums/
    │       ├── Gender.cs
    │       ├── ExerciseStyle.cs
    │       ├── ArmStyle.cs
    │       ├── MuscleGroup.cs
    │       ├── PeriodGoal.cs
    │       ├── TrainingMode.cs
    │       ├── PreferredHand.cs
    │       └── WeightCategory.cs
    └── OverTheTop.Infrastructure/ ← EF Core, DbContext, repositories
```

---

## Clean Architecture (бекенд)

```
API (Controllers)
    ↓ викликає
Application (Use Cases / Services)
    ↓ використовує інтерфейси
Domain (Entities, Enums) ← ядро, без залежностей
    ↑ реалізує інтерфейси
Infrastructure (EF Core, PostgreSQL)
```

---

## Auth flow

```
1. POST /api/auth/login → { token }
2. Фронт зберігає token в localStorage
3. Axios interceptor додає: Authorization: Bearer {token}
4. 401 → redirect на /login
```

---

## Змінні середовища

**Backend (appsettings.json / environment):**
```
ConnectionStrings__DefaultConnection = Host=...;Port=5432;Database=overthethop;...
Jwt__Key = (мін. 32 символи)
Jwt__Issuer = OverTheTop
Jwt__Audience = OverTheTopClient
Cors__AllowedOrigins = http://localhost:3000
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL = http://localhost:5000
```

---

## Конвенції коду

**Frontend:**
- Компоненти: PascalCase, `.tsx`
- Утиліти/API клієнти: camelCase, в `lib/`
- Стани: React hooks (useState, useEffect)
- Стилі: Tailwind utility classes, CSS vars для теми (`var(--color-accent)`)

**Backend:**
- Controllers: `[ApiController]`, `[Route("api/[controller]")]`
- Відповіді: `IActionResult` з `Ok()`, `BadRequest()`, `NotFound()`
- Auth: `[Authorize]` атрибут, `User.FindFirst(ClaimTypes.NameIdentifier)`
- Enums: int-based (зберігаються як числа в БД)
