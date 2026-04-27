namespace OverTheTop.Domain.Entities;

public class TrainingBlock : BaseEntity
{
    public Guid DayTemplateId { get; set; }
    public DayTemplate DayTemplate { get; set; } = null!;
    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int Order { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty; // "5", "8-12", "max"
    public int? IntensityPercent { get; set; }
    public int? RestSeconds { get; set; }
    public string? Notes { get; set; }
}
