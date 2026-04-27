using OverTheTop.Domain.Entities;

namespace OverTheTop.Application.Interfaces;

public interface ITournamentRepository : IRepository<Tournament>
{
    Task<Tournament?> GetWithParticipantsAsync(Guid tournamentId);
    Task<IEnumerable<Tournament>> GetUpcomingAsync();
}
