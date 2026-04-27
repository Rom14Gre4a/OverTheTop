using System.ComponentModel.DataAnnotations;
using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Training;

public class CreateMacroperiodDto
{
    [Required] public string Name { get; set; } = string.Empty;
    public PeriodGoal Goal { get; set; }
    public ExerciseStyle FocusStyle { get; set; }
    [Required] public DateOnly StartDate { get; set; }
    [Range(1, 52)] public int WeeksCount { get; set; }
    public string? Description { get; set; }
    public List<CreateMesocycleDto> Mesocycles { get; set; } = [];
}

public class CreateMesocycleDto
{
    [Required] public string Name { get; set; } = string.Empty;
    public TrainingMode Mode { get; set; }
    public int StartWeek { get; set; }
    public int DurationWeeks { get; set; }
    public string? Description { get; set; }
    public List<CreateDayTemplateDto> DayTemplates { get; set; } = [];
}

public class CreateDayTemplateDto
{
    [Range(1, 7)] public int DayOfWeek { get; set; }
    [Required] public string Name { get; set; } = string.Empty;
    public List<CreateTrainingBlockDto> Blocks { get; set; } = [];
}

public class CreateTrainingBlockDto
{
    public Guid ExerciseId { get; set; }
    public int Order { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty;
    public int? IntensityPercent { get; set; }
    public int? RestSeconds { get; set; }
    public string? Notes { get; set; }
}
