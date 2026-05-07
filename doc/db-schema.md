# Database Schema

DB: PostgreSQL 16 | ORM: Entity Framework Core | Назва БД: `overthethop`

> Статуси: ✅ Entity існує в Domain | 📋 Заплановано додати

---

## Діаграма зв'язків

```
Athlete ──┬── TrainingSession ── TrainingExercise
          ├── Macroperiod ── Mesocycle ── DayTemplate ── TrainingBlock ── Exercise
          ├── TournamentParticipant ── Tournament ── Match
          ├── WeightLog (📋)
          └── RecoveryLog (📋)
```

---

## Таблиці

### `athletes` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| first_name | varchar | — | |
| last_name | varchar | — | |
| email | varchar | UNIQUE | |
| password_hash | varchar | — | bcrypt |
| date_of_birth | date | — | |
| gender | int | — | 0=Male, 1=Female |
| weight | decimal(5,2) | — | кг |
| weight_category | int | — | enum (0–8) |
| preferred_hand | int | — | 0=Left, 1=Right, 2=Both |
| preferred_style | int | — | 0=TopRoll…4=Universal |
| country | varchar | NULL | |
| club | varchar | NULL | |
| created_at | timestamptz | — | |
| updated_at | timestamptz | NULL | |

### `exercises` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| name | varchar | — | Українська назва |
| name_en | varchar | — | Англійська назва |
| description | text | NULL | |
| tips | text | NULL | |
| style | int | — | 0=TopRoll…3=General |
| muscle_group | int | — | 0=Wrist…6=General |
| is_library | bool | — | default true |
| created_at | timestamptz | — | |

### `macroperiods` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| athlete_id | uuid | FK→athletes | |
| name | varchar | — | |
| goal | int | — | 0=Competition…5=Rehabilitation |
| focus_style | int | — | |
| start_date | date | — | |
| weeks_count | int | — | |
| description | text | NULL | |
| created_at | timestamptz | — | |

### `mesocycles` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| macroperiod_id | uuid | FK→macroperiods | CASCADE DELETE |
| name | varchar | — | |
| mode | int | — | 0=Strength…6=Deload |
| start_week | int | — | |
| duration_weeks | int | — | |
| description | text | NULL | |
| created_at | timestamptz | — | |

### `day_templates` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| mesocycle_id | uuid | FK→mesocycles | CASCADE DELETE |
| day_of_week | int | — | 1=Пн … 7=Нд |
| name | varchar | — | |
| created_at | timestamptz | — | |

### `training_blocks` ✅

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| day_template_id | uuid | FK→day_templates | CASCADE DELETE |
| exercise_id | uuid | FK→exercises | |
| order | int | — | порядок у тренуванні |
| sets | int | — | |
| reps | varchar | — | "8", "8-12", "max" |
| intensity_percent | int | NULL | % від 1RM |
| rest_seconds | int | NULL | |
| notes | text | NULL | |

### `training_sessions` ✅ (entity) / 📋 (міграція + API)

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| athlete_id | uuid | FK→athletes | |
| date | date | — | |
| duration_minutes | int | NULL | |
| notes | text | NULL | |
| day_template_id | uuid | NULL, FK→day_templates | за яким шаблоном |
| feeling | int | NULL | 1–5, суб'єктивна оцінка |
| created_at | timestamptz | — | |

### `training_exercises` ✅ (entity) / 📋 (міграція + API)

> Поточна модель: плоска (один рядок = вправа). Потрібно переробити на підходи.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| session_id | uuid | FK→training_sessions | CASCADE DELETE |
| exercise_id | uuid | NULL, FK→exercises | NULL якщо кастомна |
| name | varchar | — | назва вправи |
| order | int | — | |
| created_at | timestamptz | — | |

### `exercise_sets` 📋 (нова таблиця)

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| training_exercise_id | uuid | FK→training_exercises | CASCADE DELETE |
| set_number | int | — | номер підходу |
| reps | int | — | кількість повторів |
| weight_kg | decimal(5,2) | NULL | |
| is_personal_record | bool | — | default false |
| notes | text | NULL | |

### `weight_logs` 📋

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| athlete_id | uuid | FK→athletes | |
| date | date | — | |
| weight_kg | decimal(5,2) | — | |
| notes | text | NULL | |

### `recovery_logs` 📋

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| athlete_id | uuid | FK→athletes | |
| date | date | — | |
| sleep_hours | decimal(3,1) | NULL | |
| recovery_score | int | NULL | 1–10 |
| stress_level | int | NULL | 1–10 |
| pain_points | text[] | NULL | ["shoulder", "wrist"] |
| notes | text | NULL | |

### `tournaments` ✅ (entity) / 📋 (API)

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| id | uuid | PK | |
| name | varchar | — | |
| date | date | — | |
| end_date | date | NULL | |
| location | varchar | NULL | |
| city | varchar | NULL | |
| country | varchar | NULL | |
| description | text | NULL | |
| created_at | timestamptz | — | |

### `tournament_participants` ✅ (entity)

| Поле | Тип | Nullable |
|------|-----|----------|
| id | uuid | PK |
| tournament_id | uuid | FK |
| athlete_id | uuid | FK |
| weight_category | int | — |
| hand | varchar | — |
| place | int | NULL |

### `matches` ✅ (entity)

| Поле | Тип | Nullable |
|------|-----|----------|
| id | uuid | PK |
| tournament_id | uuid | FK |
| athlete_one_id | uuid | FK |
| athlete_two_id | uuid | FK |
| winner_id | uuid | NULL |
| weight_category | int | — |
| hand | varchar | — |
| round | int | — |
| win_method | varchar | NULL |

---

## Enum значення

```
Gender:         0=Male, 1=Female
ExerciseStyle:  0=TopRoll, 1=Hook, 2=Press, 3=General
ArmStyle:       0=TopRoll, 1=Hook, 2=Press, 3=Tricep, 4=Universal
MuscleGroup:    0=Wrist, 1=Forearm, 2=Bicep, 3=Tricep, 4=Shoulder, 5=Back, 6=General
PeriodGoal:     0=Competition, 1=Offseason, 2=Strength, 3=Volume, 4=Technique, 5=Rehabilitation
TrainingMode:   0=Strength, 1=Volume, 2=Endurance, 3=Power, 4=Technique, 5=Competition, 6=Deload
PreferredHand:  0=Left, 1=Right, 2=Both
WeightCategory: 0=Under60, 1=Under65, 2=Under70, 3=Under75, 4=Under80,
                5=Under90, 6=Under100, 7=Over100, 8=OpenWeight
```
