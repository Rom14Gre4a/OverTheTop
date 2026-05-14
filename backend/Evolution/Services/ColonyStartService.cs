using System.Collections.Concurrent;
using OverTheTop.Application.DTOs.Evolution;
using OverTheTop.Application.Factions;

namespace OverTheTop.Evolution.Services;

public sealed class ColonyStartService
{
    private const int MinSpawnDist   = 20;
    private const int ScoreRadius    = 6;
    private const int SearchRadius   = 2;  // adjacency search for buildings

    private readonly ConcurrentDictionary<int, IReadOnlyList<ColonyStartDto>> _cache = new();

    public IReadOnlyList<ColonyStartDto> Compute(int seed, int[] tiles, int width, int height) =>
        _cache.GetOrAdd(seed, _ => ComputeCore(seed, tiles, width, height));

    private static IReadOnlyList<ColonyStartDto> ComputeCore(int seed, int[] tiles, int width, int height)
    {
        var placed = new List<(int x, int y)>();
        var result = new List<ColonyStartDto>();

        foreach (var faction in FactionRegistry.All)
        {
            var (sx, sy) = FindSpawnPoint(
                seed ^ (faction.Kind * 0x6E45A3),
                tiles, width, height,
                faction.PreferredTiles, placed);

            placed.Add((sx, sy));

            var buildings = PlaceBuildings(sx, sy, tiles, width, height);
            result.Add(new ColonyStartDto(
                Kind:        faction.Kind,
                Name:        faction.Name,
                Description: faction.Description,
                Color:       faction.Color,
                Bonuses:     faction.Bonuses,
                SpawnX:      sx,
                SpawnY:      sy,
                Buildings:   buildings));
        }

        return result;
    }

    // ── Spawn point selection ─────────────────────────────────────────────────

    private static (int x, int y) FindSpawnPoint(
        int seed, int[] tiles, int width, int height,
        int[] preferredTiles, List<(int x, int y)> taken)
    {
        // Try with decreasing minimum distance until a placement is found
        foreach (int minDist in new[] { MinSpawnDist, 15, 10, 5, 1 })
        {
            var best = TryFindSpawn(seed, tiles, width, height, preferredTiles, taken, minDist);
            if (best.HasValue) return best.Value;
        }

        // Absolute fallback — first non-water tile
        for (int y = 1; y < height - 1; y++)
            for (int x = 1; x < width - 1; x++)
                if (tiles[y * width + x] != 0) return (x, y);

        return (width / 2, height / 2);
    }

    private static (int x, int y)? TryFindSpawn(
        int seed, int[] tiles, int width, int height,
        int[] preferred, List<(int x, int y)> taken, int minDist)
    {
        var rng = new Random(seed ^ (minDist * 0x6B43_A1C7));

        double bestScore = double.MinValue;
        (int x, int y)? best = null;

        // Sample a subset for performance on large maps
        for (int y = 2; y < height - 2; y++)
        {
            for (int x = 2; x < width - 2; x++)
            {
                if (tiles[y * width + x] == 0) continue;  // skip water

                // Must be at least minDist from every already-placed spawn
                bool tooClose = taken.Any(t => ChebyshevDist(x, y, t.x, t.y) < minDist);
                if (tooClose) continue;

                double score = ScoreTile(x, y, tiles, width, height, preferred)
                             + rng.NextDouble() * 8.0;   // small jitter for variety

                if (score > bestScore) { bestScore = score; best = (x, y); }
            }
        }

        return best;
    }

    private static double ScoreTile(
        int cx, int cy, int[] tiles, int width, int height, int[] preferred)
    {
        double score = 0;
        for (int dy = -ScoreRadius; dy <= ScoreRadius; dy++)
            for (int dx = -ScoreRadius; dx <= ScoreRadius; dx++)
            {
                int nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (preferred.Contains(tiles[ny * width + nx])) score++;
            }
        return score;
    }

    // ── Building placement ────────────────────────────────────────────────────

    private static IReadOnlyList<BuildingDto> PlaceBuildings(
        int spawnX, int spawnY, int[] tiles, int width, int height)
    {
        var buildings = new List<BuildingDto>();
        var occupied  = new HashSet<(int, int)> { (spawnX, spawnY) };

        buildings.Add(new BuildingDto("hq", spawnX, spawnY));

        var warehouse = FindAdjacent(spawnX, spawnY, tiles, width, height, occupied);
        occupied.Add(warehouse);
        buildings.Add(new BuildingDto("warehouse", warehouse.x, warehouse.y));

        var campfire = FindAdjacent(spawnX, spawnY, tiles, width, height, occupied);
        buildings.Add(new BuildingDto("campfire", campfire.x, campfire.y));

        return buildings;
    }

    private static (int x, int y) FindAdjacent(
        int cx, int cy, int[] tiles, int width, int height,
        HashSet<(int, int)> occupied)
    {
        // Spiral outward from (cx, cy), clockwise: right→down→left→up
        (int dx, int dy)[] dirs = [(1,0),(0,1),(-1,0),(0,-1),(2,0),(0,2),(-2,0),(0,-2),(1,1),(-1,1),(1,-1),(-1,-1)];

        foreach (var (dx, dy) in dirs)
        {
            int nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (tiles[ny * width + nx] == 0) continue;   // water
            if (occupied.Contains((nx, ny))) continue;
            return (nx, ny);
        }

        return (cx, cy); // fallback: same tile (shouldn't happen on large maps)
    }

    private static int ChebyshevDist(int ax, int ay, int bx, int by) =>
        Math.Max(Math.Abs(ax - bx), Math.Abs(ay - by));
}
