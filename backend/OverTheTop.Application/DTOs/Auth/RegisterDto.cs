using System.ComponentModel.DataAnnotations;
using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Auth;

public class RegisterDto
{
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public double? Weight { get; set; }
    public WeightCategory? WeightCategory { get; set; }
    public PreferredHand? PreferredHand { get; set; }
    public ArmStyle? PreferredStyle { get; set; }
    public string? Country { get; set; }
    public string? Club { get; set; }
}
