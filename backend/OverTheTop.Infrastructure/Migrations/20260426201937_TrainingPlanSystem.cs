using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TrainingPlanSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Tips = table.Column<string>(type: "text", nullable: true),
                    Style = table.Column<int>(type: "integer", nullable: false),
                    MuscleGroup = table.Column<int>(type: "integer", nullable: false),
                    IsLibrary = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Macroperiods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AthleteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Goal = table.Column<int>(type: "integer", nullable: false),
                    FocusStyle = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    WeeksCount = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Macroperiods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Macroperiods_Athletes_AthleteId",
                        column: x => x.AthleteId,
                        principalTable: "Athletes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Mesocycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MacroperiodId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    StartWeek = table.Column<int>(type: "integer", nullable: false),
                    DurationWeeks = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mesocycles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mesocycles_Macroperiods_MacroperiodId",
                        column: x => x.MacroperiodId,
                        principalTable: "Macroperiods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DayTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MesocycleId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayTemplates_Mesocycles_MesocycleId",
                        column: x => x.MesocycleId,
                        principalTable: "Mesocycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingBlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DayTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Sets = table.Column<int>(type: "integer", nullable: false),
                    Reps = table.Column<string>(type: "text", nullable: false),
                    IntensityPercent = table.Column<int>(type: "integer", nullable: true),
                    RestSeconds = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingBlocks_DayTemplates_DayTemplateId",
                        column: x => x.DayTemplateId,
                        principalTable: "DayTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrainingBlocks_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Exercises",
                columns: new[] { "Id", "CreatedAt", "Description", "IsLibrary", "MuscleGroup", "Name", "NameEn", "Style", "Tips", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("e1000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Повільне обертання зап'ястка досередини з гантеллю або лямкою. Основний рух топ-ролу.", true, 0, "Пронація зап'ястка", "Wrist Pronation", 0, "Тримай лікоть нерухомо. Фокус на крайній точці пронації.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тяга лямки або блоку лише силою пальців без участі зап'ястка.", true, 1, "Тяга пальцями", "Finger Pull", 0, "Не стискай в кулак — тяни кінчиками. Зміцнює захват для відкату пальців суперника.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розгинання зап'ястка назад з опором — фінальна фаза руху топ-ролу.", true, 0, "Скрут зап'ястка назовні", "Wrist Roll Out", 0, "Зосередься на повільному ексцентрику. Не перекидай зап'ясток.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Утримання супінованого зап'ястка з лямкою на блоці під різними кутами.", true, 0, "Кубок", "Cup Exercise", 1, "Стискай максимально і утримуй. Ключова вправа для фінальної позиції хука.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Обертання зап'ястка назовні з опором — основний рух хука.", true, 0, "Супінація зап'ястка", "Wrist Supination", 1, "Поєднуй з тягою ліктя всередину для повної симуляції хука.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тяга блоку з лямкою в супінованому положенні — максимальна симуляція хука.", true, 1, "Тяга ременя на хук", "Hook Strap Pull", 1, "Тримай зап'ясток зігнутим до себе під час тяги.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Рух плечем назад і всередину — повернення з програшної позиції хука.", true, 4, "Задній удар", "Back Attack", 1, "Поєднуй з ротацією корпуса. Відпрацюй повільно — деталь рятує матч.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Бічний тиск плечем уперед і вниз — основний рух прес-стилю.", true, 4, "Хід короля", "King's Move", 2, "Плече веде рух, рука лише утримує. Пресуй усім корпусом.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Натиск вниз зовнішньою частиною руки — доповнення до ходу короля.", true, 3, "Тиск трицепсом", "Tricep Press", 2, "Рука пряма, лікоть ззовні. Натискай через усю руку вниз до столу.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тиск руки вбік від себе з опором блоку або партнера.", true, 4, "Бічний тиск", "Side Pressure", 2, "Тренуй обидві сторони рівномірно. Зміцнює позицію при пресі.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Класичне згинання зап'ястка зі штангою або гантеллю долонею вгору.", true, 0, "Згинання зап'ястка", "Wrist Curl", 3, "Повний діапазон — від повного розгинання до максимального згинання.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000012"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Згинання зап'ястка долонею вниз — розгиначі зап'ястка.", true, 0, "Зворотнє згинання", "Reverse Wrist Curl", 3, "Часто ігнорують, але критично для балансу і профілактики травм.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000013"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Підйом гантелі нейтральним хватом — плечово-променевий м'яз.", true, 2, "Молотковий підйом", "Hammer Curl", 3, "Головний рух для сили тяги. Тримай лікоть нерухомо.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000014"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Намотування ваги на ролик обертанням зап'ясток — загальна сила передпліччя.", true, 1, "Ролик для зап'ястка", "Wrist Roller", 3, "Роби обидва напрямки: намотування і розмотування.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000015"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тяга горизонтального блоку збоку до себе — симуляція загального руху за столом.", true, 1, "Тяга блоку збоку", "Cable Side Pull", 3, "Стань боком до блоку, тягни через усю руку. Підбери висоту блоку під свій стіл.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000016"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розгинання пальців проти опору резинки або спеціального тренажера.", true, 1, "Розгинання пальців", "Finger Extension", 3, "Баланс м'язів пальців — профілактика тендинітів і травм.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000017"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Вертикальна або горизонтальна тяга з лямкою без участі пальців — ізоляція передпліччя.", true, 1, "Тяга лямкою", "Strap Pull", 3, "Зафіксуй зап'ясток у нейтралі. Тягни тільки передпліччям.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000018"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тяга зі штангою або блоком з упором ліктем — ізоляція ліктьового згинача.", true, 2, "Ліктьова тяга", "Elbow Curl", 3, "Рух повільний і контрольований. Критично для втримання позиції за столом.", null },
                    { new Guid("e1000000-0000-0000-0000-000000000019"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Стискання гумового м'яча або еспандера — комплексна міцність захвату.", true, 6, "Захват кулі", "Ball Grip", 3, "Тренуй на витривалість (30+ стискань) та на максимум (3-5 сек утримання).", null },
                    { new Guid("e1000000-0000-0000-0000-000000000020"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Обертання всього передпліччя з пронацією від плеча — підключення великих м'язів.", true, 4, "Пронаційне обертання", "Pronation Rotation", 0, "Рухається все передпліччя, а не лише зап'ясток. Для потужного топ-ролу.", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DayTemplates_MesocycleId",
                table: "DayTemplates",
                column: "MesocycleId");

            migrationBuilder.CreateIndex(
                name: "IX_Macroperiods_AthleteId",
                table: "Macroperiods",
                column: "AthleteId");

            migrationBuilder.CreateIndex(
                name: "IX_Mesocycles_MacroperiodId",
                table: "Mesocycles",
                column: "MacroperiodId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingBlocks_DayTemplateId",
                table: "TrainingBlocks",
                column: "DayTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingBlocks_ExerciseId",
                table: "TrainingBlocks",
                column: "ExerciseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainingBlocks");

            migrationBuilder.DropTable(
                name: "DayTemplates");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "Mesocycles");

            migrationBuilder.DropTable(
                name: "Macroperiods");
        }
    }
}
