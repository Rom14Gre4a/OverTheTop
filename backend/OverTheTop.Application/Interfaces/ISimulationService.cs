using OverTheTop.Application.DTOs.Evolution;

namespace OverTheTop.Application.Interfaces;

public interface ISimulationService
{
    Task<TickResult>             TickAsync();
    Task<List<ColonyStorageDto>> GetStoragesAsync(int worldSeed);
}
