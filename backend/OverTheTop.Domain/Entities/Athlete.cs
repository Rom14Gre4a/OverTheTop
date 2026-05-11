using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Athlete : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Athlete;
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public double? Weight { get; set; }
    public WeightCategory? WeightCategory { get; set; }
    public PreferredHand? PreferredHand { get; set; }
    public ArmStyle? PreferredStyle { get; set; }
    public string? Country { get; set; }
    public string? Club { get; set; }

    public ICollection<TrainingSession>       TrainingSessions       { get; set; } = [];
    public ICollection<TournamentParticipant> TournamentParticipants { get; set; } = [];
    public ICollection<RefreshToken>          RefreshTokens          { get; set; } = [];
}
