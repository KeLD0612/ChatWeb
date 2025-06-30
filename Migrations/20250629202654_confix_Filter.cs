using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webchat.Migrations
{
    /// <inheritdoc />
    public partial class confix_Filter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredGender",
                table: "DiscoverySettings");

            migrationBuilder.DropColumn(
                name: "ShowVerifiedOnly",
                table: "DiscoverySettings");

            migrationBuilder.AddColumn<DateTime>(
                name: "UnmatchedAt",
                table: "Matches",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnmatchedBy",
                table: "Matches",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnmatchedAt",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "UnmatchedBy",
                table: "Matches");

            migrationBuilder.AddColumn<string>(
                name: "PreferredGender",
                table: "DiscoverySettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ShowVerifiedOnly",
                table: "DiscoverySettings",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
