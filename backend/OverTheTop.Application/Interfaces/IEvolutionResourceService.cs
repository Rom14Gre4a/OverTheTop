using OverTheTop.Application.DTOs.Evolution;

namespace OverTheTop.Application.Interfaces;

public interface IEvolutionResourceService
{
    Task<List<TileResourceDto>> GetOrGenerateAsync(int seed, int[] tiles, int width, int height);
}
