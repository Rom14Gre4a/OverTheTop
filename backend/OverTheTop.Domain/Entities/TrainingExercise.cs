namespace OverTheTop.Domain.Entities;

public class TrainingExercise : BaseEntity
{
    public Guid SessionId { get; set; }
    public TrainingSession Session { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public double? WeightKg { get; set; }
    public string? Notes { get; set; }
}
