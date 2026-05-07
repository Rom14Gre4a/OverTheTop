using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.DTOs.Training;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Domain.Enums;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Services;

public class TrainingPlanService(AppDbContext db) : ITrainingPlanService
{
    public async Task<List<ExerciseDto>> GetExercisesAsync(ExerciseStyle? style = null, Guid? userId = null)
    {
        var q = db.Exercises.Where(e => e.IsLibrary);
        if (style.HasValue) q = q.Where(e => e.Style == style.Value);
        var exercises = await q.OrderBy(e => e.Style).ThenBy(e => e.Name).ToListAsync();

        var favorites = userId.HasValue
            ? (await db.FavoriteExercises
                .Where(f => f.UserId == userId.Value)
                .Select(f => f.ExerciseId)
                .ToListAsync()).ToHashSet()
            : new HashSet<Guid>();

        return exercises.Select(e => MapExercise(e, favorites.Contains(e.Id))).ToList();
    }

    public async Task<bool> ToggleFavoriteAsync(Guid exerciseId, Guid userId)
    {
        var existing = await db.FavoriteExercises
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ExerciseId == exerciseId);
        if (existing is not null)
        {
            db.FavoriteExercises.Remove(existing);
            await db.SaveChangesAsync();
            return false;
        }
        db.FavoriteExercises.Add(new UserFavoriteExercise { UserId = userId, ExerciseId = exerciseId });
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<MacroperiodDto>> GetMacroperiodsByAthleteAsync(Guid athleteId)
    {
        var list = await db.Macroperiods
            .Include(m => m.Mesocycles)
                .ThenInclude(ms => ms.DayTemplates)
            .Where(m => m.AthleteId == athleteId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return list.Select(m => new MacroperiodDto
        {
            Id = m.Id, Name = m.Name, Goal = m.Goal, FocusStyle = m.FocusStyle,
            StartDate = m.StartDate, WeeksCount = m.WeeksCount,
            Description = m.Description, CreatedAt = m.CreatedAt,
            Mesocycles = m.Mesocycles.OrderBy(ms => ms.StartWeek).Select(ms => new MesocycleDto
            {
                Id = ms.Id, Name = ms.Name, Mode = ms.Mode,
                StartWeek = ms.StartWeek, DurationWeeks = ms.DurationWeeks,
                DayTemplates = ms.DayTemplates.OrderBy(dt => dt.DayOfWeek).Select(dt => new DayTemplateDto
                {
                    DayOfWeek = dt.DayOfWeek, Name = dt.Name, Blocks = []
                }).ToList()
            }).ToList()
        }).ToList();
    }

    public async Task<MacroperiodDto?> GetMacroperiodAsync(Guid id, Guid athleteId)
    {
        var m = await db.Macroperiods
            .Include(x => x.Mesocycles)
                .ThenInclude(ms => ms.DayTemplates)
                    .ThenInclude(dt => dt.Blocks)
                        .ThenInclude(b => b.Exercise)
            .FirstOrDefaultAsync(x => x.Id == id && x.AthleteId == athleteId);

        return m is null ? null : MapMacroperiod(m);
    }

    public async Task<MacroperiodDto> CreateMacroperiodAsync(Guid athleteId, CreateMacroperiodDto dto)
    {
        var macro = new Macroperiod
        {
            AthleteId   = athleteId,
            Name        = dto.Name,
            Goal        = dto.Goal,
            FocusStyle  = dto.FocusStyle,
            StartDate   = dto.StartDate,
            WeeksCount  = dto.WeeksCount,
            Description = dto.Description,
            Mesocycles  = dto.Mesocycles.Select(ms => new Mesocycle
            {
                Name          = ms.Name,
                Mode          = ms.Mode,
                StartWeek     = ms.StartWeek,
                DurationWeeks = ms.DurationWeeks,
                Description   = ms.Description,
                DayTemplates  = ms.DayTemplates.Select(dt => new DayTemplate
                {
                    DayOfWeek = dt.DayOfWeek,
                    Name      = dt.Name,
                    Blocks    = dt.Blocks.Select(b => new TrainingBlock
                    {
                        ExerciseId       = b.ExerciseId,
                        Order            = b.Order,
                        Sets             = b.Sets,
                        Reps             = b.Reps,
                        IntensityPercent = b.IntensityPercent,
                        RestSeconds      = b.RestSeconds,
                        Notes            = b.Notes
                    }).ToList()
                }).ToList()
            }).ToList()
        };

        db.Macroperiods.Add(macro);
        await db.SaveChangesAsync();

        return (await GetMacroperiodAsync(macro.Id, athleteId))!;
    }

    public async Task DeleteMacroperiodAsync(Guid id, Guid athleteId)
    {
        var m = await db.Macroperiods.FirstOrDefaultAsync(x => x.Id == id && x.AthleteId == athleteId);
        if (m is not null) { db.Macroperiods.Remove(m); await db.SaveChangesAsync(); }
    }

    private static MacroperiodDto MapMacroperiod(Macroperiod m) => new()
    {
        Id = m.Id, Name = m.Name, Goal = m.Goal, FocusStyle = m.FocusStyle,
        StartDate = m.StartDate, WeeksCount = m.WeeksCount,
        Description = m.Description, CreatedAt = m.CreatedAt,
        Mesocycles = m.Mesocycles.OrderBy(ms => ms.StartWeek).Select(ms => new MesocycleDto
        {
            Id = ms.Id, Name = ms.Name, Mode = ms.Mode,
            StartWeek = ms.StartWeek, DurationWeeks = ms.DurationWeeks,
            Description = ms.Description,
            DayTemplates = ms.DayTemplates.OrderBy(dt => dt.DayOfWeek).Select(dt => new DayTemplateDto
            {
                Id = dt.Id, DayOfWeek = dt.DayOfWeek, Name = dt.Name,
                Blocks = dt.Blocks.OrderBy(b => b.Order).Select(b => new TrainingBlockDto
                {
                    Id = b.Id, Order = b.Order, Sets = b.Sets, Reps = b.Reps,
                    IntensityPercent = b.IntensityPercent, RestSeconds = b.RestSeconds,
                    Notes = b.Notes, Exercise = MapExercise(b.Exercise)
                }).ToList()
            }).ToList()
        }).ToList()
    };

    private static ExerciseDto MapExercise(Exercise e, bool isFavorite = false) => new()
    {
        Id = e.Id, Name = e.Name, NameEn = e.NameEn,
        Description = e.Description, Tips = e.Tips,
        Style = e.Style, MuscleGroup = e.MuscleGroup,
        TierRank = e.TierRank, IsFavorite = isFavorite
    };
}
