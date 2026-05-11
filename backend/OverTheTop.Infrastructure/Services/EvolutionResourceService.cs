using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.DTOs.Evolution;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Domain.Enums;
using OverTheTop.Application.SpawnRules;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Services;

public class EvolutionResourceService(AppDbContext db) : IEvolutionResourceService
{
    public async Task<List<TileResourceDto>> GetOrGenerateAsync(
        int seed, int[] tiles, int width, int height)
    {
        var existing = await db.TileResources
            .Where(r => r.WorldSeed == seed)
            .ToListAsync();

        if (existing.Count > 0)
            return existing.Select(Map).ToList();

        var rng       = new Random(seed ^ 0x6E45_A3B1);
        var resources = new List<TileResource>();

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int tileType = tiles[y * width + x];

                if (!SpawnRuleConfig.ByTile.TryGetValue(tileType, out var rules))
                    continue;

                // Try each rule in priority order — first match wins (one resource per tile)
                foreach (var rule in rules)
                {
                    if (rng.NextDouble() >= rule.Chance) continue;

                    int amount = rule.AmountMin
                        + (int)(rng.NextDouble() * (rule.AmountMax - rule.AmountMin + 1));

                    resources.Add(new TileResource
                    {
                        WorldSeed = seed,
                        X         = x,
                        Y         = y,
                        Kind      = (ResourceKind)rule.ResourceKind,
                        Amount    = amount,
                        MaxAmount = amount,
                    });
                    break;
                }
            }
        }

        db.TileResources.AddRange(resources);
        await db.SaveChangesAsync();

        return resources.Select(Map).ToList();
    }

    private static TileResourceDto Map(TileResource r) =>
        new(r.Id, r.X, r.Y, (int)r.Kind, r.Amount, r.MaxAmount);
}
