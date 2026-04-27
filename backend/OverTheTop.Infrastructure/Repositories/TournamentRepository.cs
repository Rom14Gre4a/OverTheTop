using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Repositories;

public class TournamentRepository(AppDbContext context) : BaseRepository<Tournament>(context), ITournamentRepository
{
    public async Task<Tournament?> GetWithParticipantsAsync(Guid tournamentId) =>
        await DbSet.Include(t => t.Participants)
                   .ThenInclude(p => p.Athlete)
                   .FirstOrDefaultAsync(t => t.Id == tournamentId);

    public async Task<IEnumerable<Tournament>> GetUpcomingAsync() =>
        await DbSet.Where(t => t.Date >= DateOnly.FromDateTime(DateTime.UtcNow))
                   .OrderBy(t => t.Date)
                   .ToListAsync();
}
