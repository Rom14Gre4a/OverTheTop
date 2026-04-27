using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class TournamentParticipant : BaseEntity
{
    public Guid TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;
    public Guid AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
    public WeightCategory WeightCategory { get; set; }
    public string Hand { get; set; } = string.Empty; // "Left" | "Right"
    public int? Place { get; set; }
}
