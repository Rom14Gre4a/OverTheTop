using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Training;

public class ExerciseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Tips { get; set; }
    public ExerciseStyle Style { get; set; }
    public MuscleGroup MuscleGroup { get; set; }
    public string? TierRank { get; set; }
    public bool IsFavorite { get; set; }
}
