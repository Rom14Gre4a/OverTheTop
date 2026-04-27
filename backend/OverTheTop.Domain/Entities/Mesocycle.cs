using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Mesocycle : BaseEntity
{
    public Guid MacroperiodId { get; set; }
    public Macroperiod Macroperiod { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public TrainingMode Mode { get; set; }
    public int StartWeek { get; set; }
    public int DurationWeeks { get; set; }
    public string? Description { get; set; }

    public ICollection<DayTemplate> DayTemplates { get; set; } = [];
}
