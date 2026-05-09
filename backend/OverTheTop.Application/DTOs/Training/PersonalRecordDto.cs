using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Training;

public class PersonalRecordDto
{
    public Guid Id { get; set; }
    public Guid ExerciseId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public ExerciseStyle Style { get; set; }
    public MuscleGroup MuscleGroup { get; set; }
    public float WeightKg { get; set; }
    public int Reps { get; set; }
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePersonalRecordDto
{
    public Guid ExerciseId { get; set; }
    public float WeightKg { get; set; }
    public int Reps { get; set; }
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
}
