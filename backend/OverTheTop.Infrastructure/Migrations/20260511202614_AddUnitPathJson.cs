using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OverTheTop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitPathJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PathJson",
                table: "Units",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PathJson",
                table: "Units");
        }
    }
}
