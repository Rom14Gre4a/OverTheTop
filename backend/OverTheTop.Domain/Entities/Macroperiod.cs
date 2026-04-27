using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Macroperiod : BaseEntity
{
    public Guid AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public PeriodGoal Goal { get; set; }
    public ExerciseStyle FocusStyle { get; set; }
    public DateOnly StartDate { get; set; }
    public int WeeksCount { get; set; }
    public string? Description { get; set; }

    public ICollection<Mesocycle> Mesocycles { get; set; } = [];
}
