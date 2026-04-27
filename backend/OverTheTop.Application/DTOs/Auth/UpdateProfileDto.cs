using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Auth;

public class UpdateProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public double? Weight { get; set; }
    public WeightCategory? WeightCategory { get; set; }
    public PreferredHand? PreferredHand { get; set; }
    public ArmStyle? PreferredStyle { get; set; }
    public string? Country { get; set; }
    public string? Club { get; set; }
}
