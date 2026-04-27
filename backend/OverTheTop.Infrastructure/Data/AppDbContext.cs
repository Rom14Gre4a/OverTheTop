using Microsoft.EntityFrameworkCore;
using OverTheTop.Domain.Entities;
using OverTheTop.Domain.Enums;

namespace OverTheTop.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Athlete> Athletes => Set<Athlete>();
    public DbSet<TrainingSession> TrainingSessions => Set<TrainingSession>();
    public DbSet<TrainingExercise> TrainingExercises => Set<TrainingExercise>();
    public DbSet<Tournament> Tournaments => Set<Tournament>();
    public DbSet<TournamentParticipant> TournamentParticipants => Set<TournamentParticipant>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Macroperiod> Macroperiods => Set<Macroperiod>();
    public DbSet<Mesocycle> Mesocycles => Set<Mesocycle>();
    public DbSet<DayTemplate> DayTemplates => Set<DayTemplate>();
    public DbSet<TrainingBlock> TrainingBlocks => Set<TrainingBlock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        SeedExercises(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }

    private static void SeedExercises(ModelBuilder mb)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        mb.Entity<Exercise>().HasData(
            E("e1000000-0000-0000-0000-000000000001", "Пронація зап'ястка", "Wrist Pronation",
              ExerciseStyle.TopRoll, MuscleGroup.Wrist,
              "Повільне обертання зап'ястка досередини з гантеллю або лямкою. Основний рух топ-ролу.",
              "Тримай лікоть нерухомо. Фокус на крайній точці пронації.", now),

            E("e1000000-0000-0000-0000-000000000002", "Тяга пальцями", "Finger Pull",
              ExerciseStyle.TopRoll, MuscleGroup.Forearm,
              "Тяга лямки або блоку лише силою пальців без участі зап'ястка.",
              "Не стискай в кулак — тяни кінчиками. Зміцнює захват для відкату пальців суперника.", now),

            E("e1000000-0000-0000-0000-000000000003", "Скрут зап'ястка назовні", "Wrist Roll Out",
              ExerciseStyle.TopRoll, MuscleGroup.Wrist,
              "Розгинання зап'ястка назад з опором — фінальна фаза руху топ-ролу.",
              "Зосередься на повільному ексцентрику. Не перекидай зап'ясток.", now),

            E("e1000000-0000-0000-0000-000000000004", "Кубок", "Cup Exercise",
              ExerciseStyle.Hook, MuscleGroup.Wrist,
              "Утримання супінованого зап'ястка з лямкою на блоці під різними кутами.",
              "Стискай максимально і утримуй. Ключова вправа для фінальної позиції хука.", now),

            E("e1000000-0000-0000-0000-000000000005", "Супінація зап'ястка", "Wrist Supination",
              ExerciseStyle.Hook, MuscleGroup.Wrist,
              "Обертання зап'ястка назовні з опором — основний рух хука.",
              "Поєднуй з тягою ліктя всередину для повної симуляції хука.", now),

            E("e1000000-0000-0000-0000-000000000006", "Тяга ременя на хук", "Hook Strap Pull",
              ExerciseStyle.Hook, MuscleGroup.Forearm,
              "Тяга блоку з лямкою в супінованому положенні — максимальна симуляція хука.",
              "Тримай зап'ясток зігнутим до себе під час тяги.", now),

            E("e1000000-0000-0000-0000-000000000007", "Задній удар", "Back Attack",
              ExerciseStyle.Hook, MuscleGroup.Shoulder,
              "Рух плечем назад і всередину — повернення з програшної позиції хука.",
              "Поєднуй з ротацією корпуса. Відпрацюй повільно — деталь рятує матч.", now),

            E("e1000000-0000-0000-0000-000000000008", "Хід короля", "King's Move",
              ExerciseStyle.Press, MuscleGroup.Shoulder,
              "Бічний тиск плечем уперед і вниз — основний рух прес-стилю.",
              "Плече веде рух, рука лише утримує. Пресуй усім корпусом.", now),

            E("e1000000-0000-0000-0000-000000000009", "Тиск трицепсом", "Tricep Press",
              ExerciseStyle.Press, MuscleGroup.Tricep,
              "Натиск вниз зовнішньою частиною руки — доповнення до ходу короля.",
              "Рука пряма, лікоть ззовні. Натискай через усю руку вниз до столу.", now),

            E("e1000000-0000-0000-0000-000000000010", "Бічний тиск", "Side Pressure",
              ExerciseStyle.Press, MuscleGroup.Shoulder,
              "Тиск руки вбік від себе з опором блоку або партнера.",
              "Тренуй обидві сторони рівномірно. Зміцнює позицію при пресі.", now),

            E("e1000000-0000-0000-0000-000000000011", "Згинання зап'ястка", "Wrist Curl",
              ExerciseStyle.General, MuscleGroup.Wrist,
              "Класичне згинання зап'ястка зі штангою або гантеллю долонею вгору.",
              "Повний діапазон — від повного розгинання до максимального згинання.", now),

            E("e1000000-0000-0000-0000-000000000012", "Зворотнє згинання", "Reverse Wrist Curl",
              ExerciseStyle.General, MuscleGroup.Wrist,
              "Згинання зап'ястка долонею вниз — розгиначі зап'ястка.",
              "Часто ігнорують, але критично для балансу і профілактики травм.", now),

            E("e1000000-0000-0000-0000-000000000013", "Молотковий підйом", "Hammer Curl",
              ExerciseStyle.General, MuscleGroup.Bicep,
              "Підйом гантелі нейтральним хватом — плечово-променевий м'яз.",
              "Головний рух для сили тяги. Тримай лікоть нерухомо.", now),

            E("e1000000-0000-0000-0000-000000000014", "Ролик для зап'ястка", "Wrist Roller",
              ExerciseStyle.General, MuscleGroup.Forearm,
              "Намотування ваги на ролик обертанням зап'ясток — загальна сила передпліччя.",
              "Роби обидва напрямки: намотування і розмотування.", now),

            E("e1000000-0000-0000-0000-000000000015", "Тяга блоку збоку", "Cable Side Pull",
              ExerciseStyle.General, MuscleGroup.Forearm,
              "Тяга горизонтального блоку збоку до себе — симуляція загального руху за столом.",
              "Стань боком до блоку, тягни через усю руку. Підбери висоту блоку під свій стіл.", now),

            E("e1000000-0000-0000-0000-000000000016", "Розгинання пальців", "Finger Extension",
              ExerciseStyle.General, MuscleGroup.Forearm,
              "Розгинання пальців проти опору резинки або спеціального тренажера.",
              "Баланс м'язів пальців — профілактика тендинітів і травм.", now),

            E("e1000000-0000-0000-0000-000000000017", "Тяга лямкою", "Strap Pull",
              ExerciseStyle.General, MuscleGroup.Forearm,
              "Вертикальна або горизонтальна тяга з лямкою без участі пальців — ізоляція передпліччя.",
              "Зафіксуй зап'ясток у нейтралі. Тягни тільки передпліччям.", now),

            E("e1000000-0000-0000-0000-000000000018", "Ліктьова тяга", "Elbow Curl",
              ExerciseStyle.General, MuscleGroup.Bicep,
              "Тяга зі штангою або блоком з упором ліктем — ізоляція ліктьового згинача.",
              "Рух повільний і контрольований. Критично для втримання позиції за столом.", now),

            E("e1000000-0000-0000-0000-000000000019", "Захват кулі", "Ball Grip",
              ExerciseStyle.General, MuscleGroup.General,
              "Стискання гумового м'яча або еспандера — комплексна міцність захвату.",
              "Тренуй на витривалість (30+ стискань) та на максимум (3-5 сек утримання).", now),

            E("e1000000-0000-0000-0000-000000000020", "Пронаційне обертання", "Pronation Rotation",
              ExerciseStyle.TopRoll, MuscleGroup.Shoulder,
              "Обертання всього передпліччя з пронацією від плеча — підключення великих м'язів.",
              "Рухається все передпліччя, а не лише зап'ясток. Для потужного топ-ролу.", now)
        );
    }

    private static Exercise E(string id, string name, string nameEn,
        ExerciseStyle style, MuscleGroup muscle, string desc, string tips, DateTime now) => new()
    {
        Id          = Guid.Parse(id),
        Name        = name,
        NameEn      = nameEn,
        Style       = style,
        MuscleGroup = muscle,
        Description = desc,
        Tips        = tips,
        IsLibrary   = true,
        CreatedAt   = now,
    };
}
