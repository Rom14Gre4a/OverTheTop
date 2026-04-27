using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Repositories;

public class AthleteRepository(AppDbContext context) : BaseRepository<Athlete>(context), IAthleteRepository
{
    public async Task<Athlete?> GetByEmailAsync(string email) =>
        await DbSet.FirstOrDefaultAsync(a => a.Email == email);
}
