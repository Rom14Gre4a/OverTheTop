using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Training;

public class MacroperiodDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public PeriodGoal Goal { get; set; }
    public ExerciseStyle FocusStyle { get; set; }
    public DateOnly StartDate { get; set; }
    public int WeeksCount { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MesocycleDto> Mesocycles { get; set; } = [];
}

public class MesocycleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public TrainingMode Mode { get; set; }
    public int StartWeek { get; set; }
    public int DurationWeeks { get; set; }
    public string? Description { get; set; }
    public List<DayTemplateDto> DayTemplates { get; set; } = [];
}

public class DayTemplateDto
{
    public Guid Id { get; set; }
    public int DayOfWeek { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<TrainingBlockDto> Blocks { get; set; } = [];
}

public class TrainingBlockDto
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty;
    public int? IntensityPercent { get; set; }
    public int? RestSeconds { get; set; }
    public string? Notes { get; set; }
    public ExerciseDto Exercise { get; set; } = null!;
}
