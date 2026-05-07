# OverTheTop — Документація проекту

> Платформа для армрестлерів: планування тренувань, турніри, аналітика прогресу.

## Структура документації

| Файл | Зміст |
|------|-------|
| [architecture.md](architecture.md) | Архітектура, стек, структура папок |
| [features.md](features.md) | Що реалізовано і що заплановано (головний орієнтир) |
| [api.md](api.md) | Всі API ендпоінти (поточні + заплановані) |
| [db-schema.md](db-schema.md) | Схема бази даних, сутності, зв'язки |
| [roadmap.md](roadmap.md) | Дорожня карта по фазах з пріоритетами |
| [frontend-pages.md](frontend-pages.md) | Всі сторінки фронту, стан, компоненти |

## Швидкий старт

```bash
# Backend (.NET 10)
cd backend/OverTheTop.API
dotnet run
# → http://localhost:5000

# Frontend (Next.js 16)
cd frontend
npm run dev
# → http://localhost:3000

# База даних (PostgreSQL через Docker)
docker compose up postgres
# → localhost:5432 / DB: overthethop / User: postgres / Pass: postgres
```

## Поточний стан проекту

**Фаза:** MVP — базова інфраструктура готова, core loop (журнал тренувань) у розробці.

**Готово:** Auth, профіль, планування (macroperiod), бібліотека вправ, турніри (localStorage), аналітика (мок).

**В роботі:** TrainingSession API + реальний журнал тренувань.
