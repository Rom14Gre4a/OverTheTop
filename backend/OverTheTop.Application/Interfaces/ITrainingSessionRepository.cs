using OverTheTop.Domain.Entities;

namespace OverTheTop.Application.Interfaces;

public interface ITrainingSessionRepository : IRepository<TrainingSession>
{
    Task<IEnumerable<TrainingSession>> GetByAthleteIdAsync(Guid athleteId);
    Task<TrainingSession?> GetWithExercisesAsync(Guid sessionId);
}
