using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitTaskFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TargetX",
                table: "Units",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetY",
                table: "Units",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Task",
                table: "Units",
                type: "smallint",
                nullable: false,
                defaultValue: (byte)0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetX",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "TargetY",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Task",
                table: "Units");
        }
    }
}
