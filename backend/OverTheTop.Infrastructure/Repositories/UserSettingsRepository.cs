using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Repositories;

public class UserSettingsRepository(AppDbContext context)
    : BaseRepository<UserSettings>(context), IUserSettingsRepository
{
    public async Task<UserSettings?> GetByAthleteIdAsync(Guid athleteId) =>
        await DbSet.FirstOrDefaultAsync(s => s.AthleteId == athleteId);
}
