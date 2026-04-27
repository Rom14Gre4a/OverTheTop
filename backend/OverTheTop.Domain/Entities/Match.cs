using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Match : BaseEntity
{
    public Guid TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;
    public Guid AthleteOneId { get; set; }
    public Athlete AthleteOne { get; set; } = null!;
    public Guid AthleteTwoId { get; set; }
    public Athlete AthleteTwo { get; set; } = null!;
    public Guid? WinnerId { get; set; }
    public WeightCategory WeightCategory { get; set; }
    public string Hand { get; set; } = string.Empty;
    public int Round { get; set; }
    public string? WinMethod { get; set; } // "pin", "foul", "default"
}
