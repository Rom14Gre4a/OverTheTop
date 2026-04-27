using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Repositories;

public class TrainingSessionRepository(AppDbContext context) : BaseRepository<TrainingSession>(context), ITrainingSessionRepository
{
    public async Task<IEnumerable<TrainingSession>> GetByAthleteIdAsync(Guid athleteId) =>
        await DbSet.Where(s => s.AthleteId == athleteId)
                   .OrderByDescending(s => s.Date)
                   .ToListAsync();

    public async Task<TrainingSession?> GetWithExercisesAsync(Guid sessionId) =>
        await DbSet.Include(s => s.Exercises)
                   .FirstOrDefaultAsync(s => s.Id == sessionId);
}
