namespace OverTheTop.Domain.Entities;

public class DayTemplate : BaseEntity
{
    public Guid MesocycleId { get; set; }
    public Mesocycle Mesocycle { get; set; } = null!;
    public int DayOfWeek { get; set; } // 1=Mon ... 7=Sun
    public string Name { get; set; } = string.Empty;

    public ICollection<TrainingBlock> Blocks { get; set; } = [];
}
