using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldSeed = table.Column<int>(type: "integer", nullable: false),
                    ColonyKind = table.Column<int>(type: "integer", nullable: false),
                    Class = table.Column<byte>(type: "smallint", nullable: false),
                    X = table.Column<int>(type: "integer", nullable: false),
                    Y = table.Column<int>(type: "integer", nullable: false),
                    Hp = table.Column<int>(type: "integer", nullable: false),
                    MaxHp = table.Column<int>(type: "integer", nullable: false),
                    Strength = table.Column<int>(type: "integer", nullable: false),
                    Speed = table.Column<int>(type: "integer", nullable: false),
                    Endurance = table.Column<int>(type: "integer", nullable: false),
                    Iq = table.Column<int>(type: "integer", nullable: false),
                    Hunger = table.Column<float>(type: "real", nullable: false),
                    Fatigue = table.Column<float>(type: "real", nullable: false),
                    Morale = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Units");
        }
    }
}
