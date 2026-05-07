# API Reference

Base URL: `http://localhost:5000`

> Статуси: ✅ Реалізовано | 📋 Заплановано

---

## AUTH `/api/auth`

| Метод | Endpoint | Auth | Статус | Тіло запиту |
|-------|----------|------|--------|-------------|
| POST | `/api/auth/register` | — | ✅ | `{ firstName, lastName, email, password, dateOfBirth, gender, weight, weightCategory, preferredHand, preferredStyle, country?, club? }` |
| POST | `/api/auth/login` | — | ✅ | `{ email, password }` |

**Відповідь (AuthResponse):**
```json
{
  "token": "jwt...",
  "athlete": { "id", "firstName", "lastName", "email", "weight", "weightCategory", "preferredHand", "preferredStyle" }
}
```

---

## ПРОФІЛЬ `/api/profile`

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/profile` | Bearer | ✅ |
| PUT | `/api/profile` | Bearer | ✅ |

**PUT тіло:** `{ firstName, lastName, dateOfBirth, gender, weight, weightCategory, preferredHand, preferredStyle, country?, club? }`

---

## ВПРАВИ `/api/exercises`

| Метод | Endpoint | Auth | Статус | Query |
|-------|----------|------|--------|-------|
| GET | `/api/exercises` | — | ✅ | `?style=TopRoll\|Hook\|Press\|General` |

**Exercise об'єкт:** `{ id, name, nameEn, description, tips, style, muscleGroup, isLibrary }`

---

## ТРЕНУВАЛЬНІ ПЛАНИ `/api/macroperiod`

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/macroperiod` | Bearer | ✅ |
| GET | `/api/macroperiod/{id}` | Bearer | ✅ |
| POST | `/api/macroperiod` | Bearer | ✅ |
| DELETE | `/api/macroperiod/{id}` | Bearer | ✅ |
| PUT | `/api/macroperiod/{id}` | Bearer | 📋 |

**POST тіло:**
```json
{
  "name": "string",
  "goal": "Competition|Offseason|Strength|Volume|Technique|Rehabilitation",
  "focusStyle": "TopRoll|Hook|Press|General",
  "startDate": "2026-01-01",
  "weeksCount": 12,
  "description": "string?",
  "mesocycles": [
    {
      "name": "string",
      "mode": "Strength|Volume|Endurance|Power|Technique|Competition|Deload",
      "startWeek": 1,
      "durationWeeks": 4,
      "dayTemplates": [
        {
          "dayOfWeek": 1,
          "name": "string",
          "trainingBlocks": [
            {
              "exerciseId": "guid",
              "order": 1,
              "sets": 4,
              "reps": "8-12",
              "intensityPercent": 75,
              "restSeconds": 120,
              "notes": "string?"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## ЖУРНАЛ ТРЕНУВАНЬ `/api/sessions` 📋

> Бекенд не реалізований. Domain entities існують: `TrainingSession`, `TrainingExercise`.

| Метод | Endpoint | Auth | Статус | Опис |
|-------|----------|------|--------|------|
| GET | `/api/sessions` | Bearer | 📋 | Список сесій (з пагінацією) |
| GET | `/api/sessions/{id}` | Bearer | 📋 | Одна сесія з вправами |
| POST | `/api/sessions` | Bearer | 📋 | Створити сесію |
| PUT | `/api/sessions/{id}` | Bearer | 📋 | Оновити сесію |
| DELETE | `/api/sessions/{id}` | Bearer | 📋 | Видалити сесію |

**Планований POST тіло:**
```json
{
  "date": "2026-04-30",
  "durationMinutes": 90,
  "notes": "string?",
  "dayTemplateId": "guid?",
  "exercises": [
    {
      "exerciseId": "guid?",
      "name": "string",
      "sets": [
        { "reps": 8, "weightKg": 50.0, "notes": "string?" }
      ]
    }
  ]
}
```

**Планована відповідь:**
```json
{
  "id": "guid",
  "date": "2026-04-30",
  "durationMinutes": 90,
  "notes": "string?",
  "exercises": [
    {
      "id": "guid",
      "name": "string",
      "sets": [ { "reps": 8, "weightKg": 50.0, "isPersonalRecord": true } ]
    }
  ]
}
```

---

## АНАЛІТИКА `/api/analytics` 📋

| Метод | Endpoint | Auth | Статус | Опис |
|-------|----------|------|--------|------|
| GET | `/api/analytics/volume` | Bearer | 📋 | Об'єм по тижнях |
| GET | `/api/analytics/weight-history` | Bearer | 📋 | Історія ваги тіла |
| GET | `/api/analytics/personal-records` | Bearer | 📋 | PR по всіх вправах |
| GET | `/api/analytics/muscle-groups` | Bearer | 📋 | Розподіл по групах |
| GET | `/api/analytics/exercise/{name}/history` | Bearer | 📋 | Прогрес по вправі |

---

## ВАГА ТІЛА `/api/weight-log` 📋

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/weight-log` | Bearer | 📋 |
| POST | `/api/weight-log` | Bearer | 📋 |
| DELETE | `/api/weight-log/{id}` | Bearer | 📋 |

**POST тіло:** `{ "date": "2026-04-30", "weightKg": 79.5, "notes": "string?" }`

---

## ТУРНІРИ `/api/tournaments` 📋

> Зараз зберігаються в localStorage на фронті.

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/tournaments` | Bearer | 📋 |
| POST | `/api/tournaments` | Bearer | 📋 |
| PUT | `/api/tournaments/{id}` | Bearer | 📋 |
| DELETE | `/api/tournaments/{id}` | Bearer | 📋 |
| POST | `/api/tournaments/{id}/matches` | Bearer | 📋 |
| GET | `/api/tournaments/{id}/matches` | Bearer | 📋 |

---

## RECOVERY LOG `/api/recovery` 📋

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/recovery` | Bearer | 📋 |
| POST | `/api/recovery` | Bearer | 📋 |

**POST тіло:** `{ "date": "2026-04-30", "sleepHours": 7.5, "recoveryScore": 8, "stressLevel": 3, "painPoints": ["shoulder", "wrist"] }`

---

## HEALTH `/api/health`

| Метод | Endpoint | Auth | Статус |
|-------|----------|------|--------|
| GET | `/api/health` | — | ✅ |
