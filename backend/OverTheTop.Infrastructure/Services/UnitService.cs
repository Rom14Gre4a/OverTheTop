using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.DTOs.Evolution;
using OverTheTop.Application.Interfaces;
using OverTheTop.Application.UnitClasses;
using OverTheTop.Domain.Entities;
using OverTheTop.Domain.Enums;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Services;

public sealed class UnitService(AppDbContext db) : IUnitService
{
    public async Task<UnitDto> CreateAsync(CreateUnitDto dto)
    {
        var stats = UnitClassConfig.GetStats(dto.Class);
        var unit = new Unit
        {
            WorldSeed  = dto.WorldSeed,
            ColonyKind = dto.ColonyKind,
            Class      = dto.Class,
            X          = dto.X,
            Y          = dto.Y,
            Hp         = stats.MaxHp,
            MaxHp      = stats.MaxHp,
            Strength   = stats.Strength,
            Speed      = stats.Speed,
            Endurance  = stats.Endurance,
            Iq         = stats.Iq,
        };
        db.Units.Add(unit);
        await db.SaveChangesAsync();
        return ToDto(unit);
    }

    public async Task<UnitDto?> GetByIdAsync(Guid id)
    {
        var u = await db.Units.FindAsync(id);
        return u is null ? null : ToDto(u);
    }

    public async Task<List<UnitDto>> GetByWorldAsync(int worldSeed)
    {
        var list = await db.Units
            .Where(u => u.WorldSeed == worldSeed)
            .ToListAsync();
        return list.Select(ToDto).ToList();
    }

    public async Task<AssignTaskResponseDto?> AssignTaskAsync(
        Guid id, AssignTaskDto dto, IReadOnlyList<PathPoint>? path = null)
    {
        var unit = await db.Units.FindAsync(id);
        if (unit is null) return null;

        unit.Task     = dto.TaskType;
        unit.TargetX  = dto.TargetX;
        unit.TargetY  = dto.TargetY;
        unit.PathJson = path is { Count: > 0 }
            ? JsonSerializer.Serialize(path)
            : null;

        await db.SaveChangesAsync();
        return new AssignTaskResponseDto(ToDto(unit), path);
    }

    private static UnitDto ToDto(Unit u) => new(
        u.Id, u.WorldSeed, u.ColonyKind, u.Class,
        UnitClassConfig.GetName(u.Class),
        u.X, u.Y, u.Hp, u.MaxHp, u.Strength, u.Speed, u.Endurance, u.Iq,
        u.Hunger, u.Fatigue, u.Morale,
        u.Task, u.TargetX, u.TargetY
    );
}
