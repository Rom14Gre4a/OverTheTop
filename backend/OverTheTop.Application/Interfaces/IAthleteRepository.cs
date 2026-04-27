using OverTheTop.Domain.Entities;

namespace OverTheTop.Application.Interfaces;

public interface IAthleteRepository : IRepository<Athlete>
{
    Task<Athlete?> GetByEmailAsync(string email);
}
