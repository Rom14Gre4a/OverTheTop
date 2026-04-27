using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Tournament : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? Location { get; set; }
    public string? Country { get; set; }
    public string? Description { get; set; }

    public ICollection<TournamentParticipant> Participants { get; set; } = [];
    public ICollection<Match> Matches { get; set; } = [];
}
