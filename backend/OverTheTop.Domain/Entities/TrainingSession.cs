namespace OverTheTop.Domain.Entities;

public class TrainingSession : BaseEntity
{
    public Guid AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
    public int? DurationMinutes { get; set; }

    public ICollection<TrainingExercise> Exercises { get; set; } = [];
}
