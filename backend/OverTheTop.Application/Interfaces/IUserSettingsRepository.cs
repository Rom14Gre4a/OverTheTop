using OverTheTop.Domain.Entities;

namespace OverTheTop.Application.Interfaces;

public interface IUserSettingsRepository : IRepository<UserSettings>
{
    Task<UserSettings?> GetByAthleteIdAsync(Guid athleteId);
}
