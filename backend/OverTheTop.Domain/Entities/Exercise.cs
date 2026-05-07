using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Exercise : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Tips { get; set; }
    public ExerciseStyle Style { get; set; }
    public MuscleGroup MuscleGroup { get; set; }
    public bool IsLibrary { get; set; } = true;
    public string? TierRank { get; set; }
}
