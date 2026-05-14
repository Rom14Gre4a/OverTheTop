using System.Collections.Concurrent;
using OverTheTop.Evolution.Models;

namespace OverTheTop.Evolution.Services;

public sealed class MapGeneratorService
{
    public const int Width  = 140;
    public const int Height = 100;

    private readonly ConcurrentDictionary<int, WorldMap> _cache = new();

    public WorldMap Generate(int seed = 42) => _cache.GetOrAdd(seed, GenerateCore);

    private WorldMap GenerateCore(int seed)
    {
        var rng   = new Random(seed);
        var tiles = new TileType[Width * Height];

        // ── Main island ──────────────────────────────────────────────────────
        // Smaller base radius, but higher baseline → більше суші в середньому
        // і гарантовано вільні кутки для окремих островів
        double cx = Width  / 2.0;
        double cy = Height / 2.0;
        double rx = Width  * 0.36;   // 50.4 тайли
        double ry = Height * 0.34;   // 34 тайли

        // 18 bumps → дуже складна берегова лінія з фіордами
        var mainBumps = MakeBumps(rng, 18,
            freqMin: 1.0, freqMax: 7.0,
            ampMin:  0.04, ampMax: 0.16);

        // ── Corner islands ────────────────────────────────────────────────────
        // Верхній-лівий (більший) і нижній-правий (менший)
        // Нормалізована відстань від центру ~1.65 → гарантовано відокремлені
        (double cx, double cy, double rx, double ry, int bseed)[] islets =
        [
            // Лівий куток — більший острів
            (19.0, 13.0, 17.0, 13.0, seed + 7919),
            // Правий куток — менший острів
            (121.0, 87.0, 11.0,  8.0, seed + 3571),
        ];

        var isletBumps = islets.Select(il =>
        {
            var r2 = new Random(il.bseed);
            return MakeBumps(r2, 12,
                freqMin: 2.0, freqMax: 6.0,
                ampMin:  0.07, ampMax: 0.24);
        }).ToArray();

        // ── Rasterise ─────────────────────────────────────────────────────────
        for (int y = 0; y < Height; y++)
        {
            for (int x = 0; x < Width; x++)
            {
                // Main island: baseline 1.12 → більше суші без збільшення радіуса
                bool land = IsLand(x, y, cx, cy, rx, ry, mainBumps,
                                   baseline: 1.12, seed, noiseAmp: 0.12);

                for (int i = 0; i < islets.Length && !land; i++)
                    land = IsLand(x, y,
                                  islets[i].cx, islets[i].cy,
                                  islets[i].rx, islets[i].ry,
                                  isletBumps[i],
                                  baseline: 1.0, islets[i].bseed, noiseAmp: 0.20);

                tiles[y * Width + x] = land ? TileType.Land : TileType.Water;
            }
        }

        // ── Post-process: sand / mountain / forest ────────────────────────────
        for (int y = 0; y < Height; y++)
        {
            for (int x = 0; x < Width; x++)
            {
                int idx = y * Width + x;
                if (tiles[idx] != TileType.Land) continue;

                // Sand — any 8-neighbour is water
                bool nearWater = false;
                for (int ny = y - 1; ny <= y + 1 && !nearWater; ny++)
                    for (int nx = x - 1; nx <= x + 1 && !nearWater; nx++)
                        if (nx >= 0 && nx < Width && ny >= 0 && ny < Height && (nx != x || ny != y))
                            nearWater = tiles[ny * Width + nx] == TileType.Water;

                if (nearWater) { tiles[idx] = TileType.Sand; continue; }

                // Mountain — smooth noise clusters (radius 4)
                double elev = SmoothNoise(x, y, seed + 7919, 4);
                if (elev > 0.528) { tiles[idx] = TileType.Mountain; continue; }

                // Forest — smooth noise clusters (radius 3)
                double fore = SmoothNoise(x, y, seed + 3571, 3);
                if (fore > 0.514) tiles[idx] = TileType.Forest;
            }
        }

        return new WorldMap { Width = Width, Height = Height, Seed = seed, Tiles = tiles };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static (double freq, double amp, double phase)[] MakeBumps(
        Random rng, int count,
        double freqMin, double freqMax,
        double ampMin,  double ampMax) =>
        Enumerable.Range(0, count).Select(_ => (
            freq : rng.NextDouble() * (freqMax - freqMin) + freqMin,
            amp  : rng.NextDouble() * (ampMax  - ampMin)  + ampMin,
            phase: rng.NextDouble() * Math.PI * 2
        )).ToArray();

    private static bool IsLand(
        int x, int y,
        double cx, double cy,
        double rx, double ry,
        (double freq, double amp, double phase)[] bumps,
        double baseline,
        int noiseSeed, double noiseAmp)
    {
        double dx    = (x + 0.5 - cx) / rx;
        double dy    = (y + 0.5 - cy) / ry;
        double dist  = Math.Sqrt(dx * dx + dy * dy);
        double angle = Math.Atan2(dy, dx);

        double boundary = baseline;
        foreach (var b in bumps)
            boundary += b.amp * Math.Sin(b.freq * angle + b.phase);

        double noise = Noise(x, y, noiseSeed) * noiseAmp * 2 - noiseAmp;
        return dist < boundary + noise;
    }

    private static double Noise(int x, int y, int seed)
    {
        unchecked
        {
            int n = x * 374761393 + y * 668265263 + seed * 1013904223;
            n = (n ^ (n >> 13)) * 1274126177;
            return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0;
        }
    }

    private static double SmoothNoise(int x, int y, int seed, int radius)
    {
        double sum = 0;
        int    count = 0;
        for (int dy = -radius; dy <= radius; dy++)
            for (int dx = -radius; dx <= radius; dx++)
            {
                sum += Noise(x + dx, y + dy, seed);
                count++;
            }
        return sum / count;
    }
}
