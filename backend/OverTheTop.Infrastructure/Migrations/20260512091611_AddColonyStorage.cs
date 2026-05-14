using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddColonyStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ColonyStorages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldSeed = table.Column<int>(type: "integer", nullable: false),
                    ColonyKind = table.Column<int>(type: "integer", nullable: false),
                    Food = table.Column<int>(type: "integer", nullable: false),
                    Wood = table.Column<int>(type: "integer", nullable: false),
                    Stone = table.Column<int>(type: "integer", nullable: false),
                    Energy = table.Column<int>(type: "integer", nullable: false),
                    Gems = table.Column<int>(type: "integer", nullable: false),
                    Oil = table.Column<int>(type: "integer", nullable: false),
                    Ore = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColonyStorages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ColonyStorages_WorldSeed_ColonyKind",
                table: "ColonyStorages",
                columns: new[] { "WorldSeed", "ColonyKind" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ColonyStorages");
        }
    }
}
