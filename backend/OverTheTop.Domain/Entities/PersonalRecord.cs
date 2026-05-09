namespace OverTheTop.Domain.Entities;

public class PersonalRecord : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public float WeightKg { get; set; }
    public int Reps { get; set; }
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
}
