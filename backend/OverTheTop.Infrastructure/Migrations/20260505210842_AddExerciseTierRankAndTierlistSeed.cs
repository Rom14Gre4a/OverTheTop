using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseTierRankAndTierlistSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TierRank",
                table: "Exercises",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000001"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000002"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000003"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000004"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000005"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000006"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000007"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000008"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000009"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000010"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000011"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000012"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000013"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000014"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000015"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000016"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000017"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000018"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000019"),
                column: "TierRank",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000020"),
                column: "TierRank",
                value: null);

            migrationBuilder.InsertData(
                table: "Exercises",
                columns: new[] { "Id", "CreatedAt", "Description", "IsLibrary", "MuscleGroup", "Name", "NameEn", "Style", "TierRank", "Tips", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("e2000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Найефективніший спосіб розвинути специфічну силу хвату для гаку. Тренує внутрішній обертальний момент зап'ястя.", true, 6, "Ручка на лямках", "", 1, "S", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Конусна ручка на підшипниках ідеально імітує позицію хвату в гаку, дозволяючи ізольовано навантажити потрібні структури.", true, 6, "Ручка на підшипниках (конусна)", "", 1, "S", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Циліндричний варіант для різних фаз хвату. Особливо ефективний для розвитку статичної витривалості.", true, 6, "Ручка на підшипниках (циліндрична)", "", 1, "S", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Функціональна тяга, що максимально відтворює механіку руки у гаку. Тренує весь кінематичний ланцюг.", true, 6, "Стягування з верхнього/середнього блоку", "", 1, "S", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розвиває силу пальців і хвату в специфічній позиції. Незамінний інструмент для гаку.", true, 6, "Кисть ручкою з розширювачем", "", 1, "S", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Широкий хват змінює кут навантаження та підключає медіальну голову біцепса — ключову для утримання гаку.", true, 6, "Біцепс стоячи кривий гриф (широкий хват)", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Нижня частина амплітуди (0-90°) прицільно вантажить довгу голову біцепса у слабкій точці.", true, 6, "Біцепс сидячи часткова амплітуда", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ізолює біцепс і виключає читинг. Розвиває пікову силу на початку скорочення — саме там де потрібно в гаку.", true, 6, "Біцепс в коті / лавка Скотта", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Антагоніст біцепса. Збалансований розвиток трицепса дозволяє стабілізувати лікоть у позиції гаку.", true, 6, "Тріцепс загально", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розвиває задню дельту і ромбоподібні — важливі для утримання плеча назад у позиції гаку.", true, 6, "Горизонтальна тяга блоку", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Унілатеральний варіант тяги дозволяє включити більше обертання тулуба та пропрацювати дисбаланси.", true, 6, "Тяга блоку кожною рукою", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000012"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Специфічне тренування позиції за столом. Тренує м'язи, що утримують руку під кутом гаку.", true, 6, "Боковуха за столом", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000013"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Внутрішні ротатори плеча є ключовими в гаку. Цільова робота із стрічкою або блоком.", true, 6, "Ротація плеча", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000014"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ексцентрична фаза з великим діаметром ручки будує сухожильну силу хвату — те, що дає реальний гак.", true, 6, "Ексцентрична ручка (великий діаметр, відкритий хват)", "", 1, "A", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000015"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Базовий грудний жим дає загальну масу, але відносно слабко специфічний для гаку. Корисний для загального силового фундаменту.", true, 6, "Жим лежачи (гак)", "", 1, "B", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000016"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розвиває трицепс і нижні грудні. Хороший допоміжний рух для загальної маси верхньої частини тіла.", true, 6, "Бруси (гак)", "", 1, "B", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000017"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ізольований рух для грудних. Забезпечує розтягнення і гіпертрофію, але не специфічний для гаку.", true, 6, "Розводи гантелями", "", 1, "B", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000018"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Специфічна вправа — тиснеш рукою по столу, тренуючи грудні у нетиповій площині. Середня ефективність для гаку.", true, 6, "Грудні за столом", "", 1, "B", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000019"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ізометричне утримання позиції гаку. Розвиває стабілізацію, але без динамічної сили.", true, 6, "Статика за столом (гак)", "", 1, "B", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000020"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Супінація під час підйому активує корокобрахіаліс. Корисно, але менш специфічно ніж пронаційний гак.", true, 6, "Біцепс стоячи гантелею з супінацією", "", 1, "C", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000021"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Тренує рух, протилежний гаку. Корисно для балансу, але прямий ефект на гак — невеликий.", true, 6, "Супінація ручкою або лямкою", "", 1, "C", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000022"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Схоже на лавку Скотта, але за столом. Непогана ізоляція, однак кут навантаження менш оптимальний.", true, 6, "Біцепс за столом", "", 1, "C", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000023"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Традиційне згинання кисті зі штангою. Вправа загальна і не специфічна для хвату у гаку. Слабкий перенос.", true, 6, "Кисть штангою або гантелею (гак)", "", 1, "D", null, null },
                    { new Guid("e2000000-0000-0000-0000-000000000024"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Поєднання повної супінації з боковим рухом — протилежна механіка від гаку. Може формувати неправильні патерни.", true, 6, "Зв'язка (повна супінація + бокова)", "", 1, "F", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Найбільш наближена до реальної боротьби верхом. Реалістично навантажує замочок, який стає обмежуючим фактором.", true, 6, "Натяжка з середнього блоку за столом", "", 0, "S", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок ставимо на рівні очей, рух починається з вирівняної кисті до бокового валика з рівномірною пронацією. Для досвідчених.", true, 6, "Пронація в атакуючому положенні (блок на рівні очей)", "", 0, "S", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Найкраща вправа для боротьби верхом. Відтворює ключовий стартовий рух з фокусом на пронацію. Технічно складна.", true, 6, "Зриви через пронацію за столом", "", 0, "S", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок повище, фокус на верхній частині кисті — вказівний та середній пальці. Не супінуємо руку. Дає контроль кисті на центрі.", true, 6, "Кисть з ручками (циліндрична / конусна)", "", 0, "S", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Пальці — основа контролю захвату. Поставив захват зручно і утримав пальцями — більша половина роботи до перемоги.", true, 6, "Вправа на пальці з ексцентричною ручкою", "", 0, "S", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Базова вправа армреслінгу. Виконання: динамічне або статичне з фіксованим кутом. Обов'язкова вправа.", true, 6, "Натяжка за столом з нижнього блоку", "", 0, "A", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Лямка зміщена ближче до долоні — більш наближене до реальної боротьби. Часто саме замочок визначає переможця.", true, 6, "Замочок за столом (лямка до долоні)", "", 0, "A", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок ставиться вище, рука трішки пронована, короткий рух починається саме з кисті. Специфічний варіант для верху.", true, 6, "Ручка на лямках (для верху)", "", 0, "A", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Робити в повну амплітуду для максимального розвитку м'яза. Базова і технічно проста, легко відслідковувати прогрес.", true, 6, "Біцепс з молотковим хватом", "", 0, "A", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Базова вправа, яку варто робити кожному початківцю. Для досвідчених атлетів — менш ефективна.", true, 6, "Пронація знизу за столом (захисна пронація)", "", 0, "B", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Дуже специфічна вправа, мінімальний рух. Для спортсменів з роками досвіду може вивести пронацію на новий рівень.", true, 6, "Атакуюча пронація — стиль Романа Синейка", "", 0, "B", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000012"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Класика, через яку проходить кожен армреслер. Вправа на пронацію, а не на підйом. Технічно складна, потрібно відчути.", true, 6, "Прокрут вільною вагою", "", 0, "B", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000013"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Паралельний хват ближчий до позиції боротьби верхом. Можна робити статично в куті з додатковою вагою.", true, 6, "Підтягування паралельним хватом", "", 0, "B", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000014"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Гарна вправа, особливо для боротьби верхом. Мінус: біль при виконанні — основний стримуючий фактор прогресу.", true, 6, "Замочок за столом через пальці", "", 0, "B", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000015"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Важко утримати контроль — вага з'їжджає і навантаження переходить на плечі. Легко замінюється іншою вправою.", true, 6, "Натяжка вільною вагою", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000016"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Рука впирається у стіл, ізольована пронація вільною вагою. Перенос на стіл — мінімальний за відчуттям.", true, 6, "Ізольована пронація за столом", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000017"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Мало переноситься на стіл, не базова для верху. Прогрес відслідкувати майже неможливо.", true, 6, "Замочок вільною вагою у динаміці", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000018"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Лікоть впертий у підлокітник, тонка ручка ближче до фаланг пальців. При обмеженому часі — класична кисть ефективніша.", true, 6, "Кисть ізольована за столом", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000019"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Технічно проста, популярна далеко поза армреслінгом. Не є необхідною специфічно для верху.", true, 6, "Біцепс зворотним хватом", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000020"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Спина рідко є обмежуючим фактором в армреслінгу. Виконувати без допоміжних лямок.", true, 6, "Тяга верхнього блоку до грудей", "", 0, "C", null, null },
                    { new Guid("e3000000-0000-0000-0000-000000000021"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Найгірша вправа для верху. Підходить ЛИШЕ як розминка. З великими вагами навантаження на зап'ястя невиправдане.", true, 6, "Атакуюча пронація у повну амплітуду", "", 0, "F", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Пряме тренування пресуючого руху за столом. Найспецифічніша вправа для стилю прес.", true, 6, "Жим за столом (бокова сила)", "", 2, "S", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розгинання ліктя з одночасною ротацією — імітує механіку пресу. Вищий рівень специфічності ніж звичайний трицепс.", true, 6, "Тріцепс блок зі зовнішньою ротацією", "", 2, "S", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Специфічна вправа для стилю прес. Тренує движок притискання руки до себе і донизу.", true, 6, "Прес ліктем донизу (elbow drop)", "", 2, "S", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Вузький хват переносить акцент на трицепс та грудні — основні двигуни пресу.", true, 6, "Жим лежачи (вузький хват)", "", 2, "A", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ізоляція трицепса. Будує масу і силу головного пресуючого м'яза.", true, 6, "Тріцепс на блоці (пряма ручка)", "", 2, "A", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Довга голова трицепса отримує максимальне розтягнення. Ефективна вправа для розвитку маси трицепса.", true, 6, "Французький жим (EZ-гриф)", "", 2, "A", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Передня дельта і трицепс — обидва беруть участь у пресі. Жим стоячи розвиває вибухову силу жиму.", true, 6, "Жим від плеча стоячи", "", 2, "A", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Поперечна тяга через тіло тренує внутрішнє обертання та пресування — специфічно для цього стилю.", true, 6, "Бокова тяга блоку (cross-body)", "", 2, "A", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Класичний жим. Будує базову силу грудних і трицепса. Хороший фундамент, але менш специфічний.", true, 6, "Жим лежачи (середній хват)", "", 2, "B", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000010"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Нахил вперед залучає більше грудних. Ефективна вправа для загального пресуючого м'язового масиву.", true, 6, "Бруси з нахилом вперед", "", 2, "B", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000011"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Стягування лопаток важливо для стабілізації при пресі. Тяга до грудей з ромбоподібним фокусом.", true, 6, "Ромбоподібні (rhomboid row)", "", 2, "B", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000012"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Передні дельти — активні учасники пресового руху. Ізольована робота дає відчутний ефект.", true, 6, "Передня дельта (гантеля/блок)", "", 2, "B", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000013"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ротаційний жим плечима. Залучає більше м'язів, але специфічність для пресу — середня.", true, 6, "Жим Арнольда", "", 2, "C", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000014"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Широкий хват підтягування залучає грудні і широкі — розвиток загального масиву тіла.", true, 6, "Підтягування широким хватом", "", 2, "C", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000015"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Горизонтальний жим на блоці. Помірна специфічність для пресу — кут навантаження дещо відрізняється.", true, 6, "Горизонтальний жим (cable chest press)", "", 2, "C", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000016"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Широкі і дрібні грудні. Непогана вправа для обсягу, але слабкий перенос на механіку пресу.", true, 6, "Пулловер гантелею", "", 2, "D", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000017"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Трапеція. Мінімальна специфічність для стилю прес.", true, 6, "Шраги зі штангою", "", 2, "D", null, null },
                    { new Guid("e4000000-0000-0000-0000-000000000018"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Розгиначі спини. Не специфічні для пресу. Загальна вправа без перенесення на техніку пресу.", true, 6, "Гіперекстензія", "", 2, "F", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000012"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000013"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000014"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000015"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000016"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000017"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000018"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000019"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000020"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000021"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000022"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000023"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e2000000-0000-0000-0000-000000000024"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000012"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000013"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000014"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000015"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000016"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000017"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000018"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000019"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000020"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000021"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000012"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000013"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000014"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000015"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000016"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000017"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("e4000000-0000-0000-0000-000000000018"));

            migrationBuilder.DropColumn(
                name: "TierRank",
                table: "Exercises");
        }
    }
}
