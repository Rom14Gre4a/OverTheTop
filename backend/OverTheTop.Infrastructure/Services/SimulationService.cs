using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OverTheTop.Application.DTOs.Evolution;
using OverTheTop.Application.Interfaces;
using OverTheTop.Application.UnitClasses;
using OverTheTop.Domain.Entities;
using OverTheTop.Domain.Enums;
using OverTheTop.Evolution.Models;
using OverTheTop.Evolution.Services;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Services;

public sealed class SimulationService(
    AppDbContext           db,
    MapGeneratorService    mapGen,
    AStarService           astar,
    ColonyStartService     colonyStart,
    SimulationSpeedService speed
) : ISimulationService
{
    public async Task<TickResult> TickAsync()
    {
        speed.TickCount++;

        var allUnits = await db.Units.ToListAsync();
        if (allUnits.Count == 0) return TickResult.Empty;

        var seeds = allUnits.Select(u => u.WorldSeed).Distinct().ToList();

        var resourceMap = (await db.TileResources
            .Where(r => seeds.Contains(r.WorldSeed))
            .ToListAsync())
            .ToDictionary(r => (r.WorldSeed, r.X, r.Y));

        var storageMap = (await db.ColonyStorages
            .Where(s => seeds.Contains(s.WorldSeed))
            .ToListAsync())
            .ToDictionary(s => (s.WorldSeed, s.ColonyKind));

        var movedMap     = new Dictionary<Guid, UnitMovedDto>();
        var died         = new List<Guid>();
        var modifiedRes  = new HashSet<TileResource>();
        var depletedRes  = new List<ResourceUpdateDto>();
        var modifiedStor = new HashSet<ColonyStorage>();

        // ── Phase 1: Move ──────────────────────────────────────────────────────
        foreach (var unit in allUnits.Where(u => u.PathJson != null))
        {
            var path = JsonSerializer.Deserialize<List<PathPoint>>(unit.PathJson!);
            if (path is null or { Count: 0 }) { unit.PathJson = null; continue; }

            unit.X = path[0].X;
            unit.Y = path[0].Y;
            path.RemoveAt(0);

            unit.PathJson = path.Count > 0 ? JsonSerializer.Serialize(path) : null;
            if (path.Count == 0 && unit.Task == UnitTaskType.Patrol)
                unit.Task = UnitTaskType.Idle;

            movedMap[unit.Id] = new UnitMovedDto(unit.Id, unit.X, unit.Y, (int)unit.Task);
        }

        // ── Phase 2: Gather ────────────────────────────────────────────────────
        foreach (var unit in allUnits.Where(u =>
            u.Task    == UnitTaskType.Gather && u.PathJson == null &&
            u.TargetX.HasValue && u.TargetY.HasValue &&
            u.X == u.TargetX   && u.Y == u.TargetY))
        {
            var key = (unit.WorldSeed, unit.TargetX!.Value, unit.TargetY!.Value);
            if (!resourceMap.TryGetValue(key, out var res) || res.Amount <= 0)
            {
                unit.Task = UnitTaskType.Idle; unit.TargetX = null; unit.TargetY = null;
                continue;
            }

            int rate     = 5 + unit.Endurance / 3;
            int gathered = Math.Min(rate, res.Amount);
            res.Amount  -= gathered;

            if (res.Amount <= 0)
            {
                res.Amount = 0;
                depletedRes.Add(new ResourceUpdateDto(res.WorldSeed, res.X, res.Y, 0, (int)res.Kind, res.MaxAmount));
                unit.Task = UnitTaskType.Idle; unit.TargetX = null; unit.TargetY = null;
            }
            else
            {
                modifiedRes.Add(res);
            }

            var storKey = (unit.WorldSeed, unit.ColonyKind);
            if (!storageMap.TryGetValue(storKey, out var stor))
            {
                stor = new ColonyStorage { WorldSeed = unit.WorldSeed, ColonyKind = unit.ColonyKind };
                db.ColonyStorages.Add(stor);
                storageMap[storKey] = stor;
            }
            AddToStorage(stor, res.Kind, gathered);
            modifiedStor.Add(stor);
        }

        // ── Phase 3: Combat ────────────────────────────────────────────────────
        foreach (var attacker in allUnits.Where(u =>
            u.Task == UnitTaskType.Attack && u.PathJson == null))
        {
            var target = allUnits
                .Where(u => u.Id          != attacker.Id
                         && u.WorldSeed   == attacker.WorldSeed
                         && u.ColonyKind  != attacker.ColonyKind
                         && u.Hp         >  0
                         && Math.Abs(u.X - attacker.X) <= 2
                         && Math.Abs(u.Y - attacker.Y) <= 2)
                .MinBy(u => Math.Abs(u.X - attacker.X) + Math.Abs(u.Y - attacker.Y));

            if (target is null) continue;

            int dmg   = (int)(attacker.Strength * (0.7 + Random.Shared.NextDouble() * 0.6));
            target.Hp = Math.Max(0, target.Hp - dmg);
            movedMap.TryAdd(target.Id,
                new UnitMovedDto(target.Id, target.X, target.Y, (int)target.Task));
        }

        // ── Phase 4: Hunger ────────────────────────────────────────────────────
        foreach (var unit in allUnits)
        {
            unit.Hunger += 0.2f;
            if (unit.Hunger >= 90f)
                unit.Hp = Math.Max(0, unit.Hp - (int)(unit.Strength * 0.3f));
            if (unit.Hp <= 0)
                died.Add(unit.Id);
        }

        // ── Phase 5: Remove dead ───────────────────────────────────────────────
        if (died.Count > 0)
        {
            var deadSet = died.ToHashSet();
            db.Units.RemoveRange(allUnits.Where(u => deadSet.Contains(u.Id)));
        }

        await db.SaveChangesAsync();

        // ── Phase 6: Auto-assign idle ──────────────────────────────────────────
        await AutoAssignAsync(resourceMap);

        // ── Phase 7: Resource regeneration (every 30 ticks) ───────────────────
        var regenUpdates = new List<ResourceUpdateDto>();
        if (speed.TickCount % 30 == 0)
        {
            var depleted = await db.TileResources
                .Where(r => seeds.Contains(r.WorldSeed) && r.Amount == 0 && r.MaxAmount > 0)
                .ToListAsync();

            foreach (var res in depleted)
            {
                res.Amount = Math.Min(res.MaxAmount, Math.Max(1, res.MaxAmount / 5));
                regenUpdates.Add(new ResourceUpdateDto(
                    res.WorldSeed, res.X, res.Y, res.Amount, (int)res.Kind, res.MaxAmount));
            }
            if (depleted.Count > 0) await db.SaveChangesAsync();
        }

        // ── Phase 8: Birth (every 10 ticks) ───────────────────────────────────
        var born = new List<UnitDto>();
        if (speed.TickCount % 10 == 0)
            born = await BirthAsync(allUnits, died, storageMap, modifiedStor);

        return new TickResult(
            [.. movedMap.Values],
            died,
            [.. modifiedStor.Select(ToStorageDto)],
            [.. modifiedRes.Select(r =>
                new ResourceUpdateDto(r.WorldSeed, r.X, r.Y, r.Amount, (int)r.Kind, r.MaxAmount)),
             .. depletedRes,
             .. regenUpdates],
            born
        );
    }

    public async Task<List<ColonyStorageDto>> GetStoragesAsync(int worldSeed)
    {
        var list = await db.ColonyStorages.Where(s => s.WorldSeed == worldSeed).ToListAsync();
        return list.Select(ToStorageDto).ToList();
    }

    // ── Birth ──────────────────────────────────────────────────────────────────

    private async Task<List<UnitDto>> BirthAsync(
        List<Unit>                                              allUnits,
        List<Guid>                                              diedThisTick,
        Dictionary<(int WorldSeed, int ColonyKind), ColonyStorage> storageMap,
        HashSet<ColonyStorage>                                  modifiedStor)
    {
        const int MaxPerColony = 15;
        const int FoodCost     = 50;

        var born    = new List<UnitDto>();
        var diedSet = diedThisTick.ToHashSet();

        var countMap = allUnits
            .Where(u => !diedSet.Contains(u.Id))
            .GroupBy(u => (u.WorldSeed, u.ColonyKind))
            .ToDictionary(g => g.Key, g => g.Count());

        // Cache int[] tiles per seed (ColonyStartService caches by seed too)
        var tileCache = new Dictionary<int, int[]>();
        int[] GetTiles(int seed)
        {
            if (!tileCache.TryGetValue(seed, out var t))
                tileCache[seed] = t = mapGen.Generate(seed).Tiles.Select(x => (int)x).ToArray();
            return t;
        }

        foreach (var kvp in storageMap)
        {
            var (seed, colonyKind) = kvp.Key;
            var stor = kvp.Value;

            int count = countMap.GetValueOrDefault((seed, colonyKind), 0);
            if (count >= MaxPerColony || stor.Food < FoodCost) continue;

            var infos = colonyStart.Compute(
                seed, GetTiles(seed), MapGeneratorService.Width, MapGeneratorService.Height);
            var info  = infos.FirstOrDefault(c => c.Kind == colonyKind);

            int spawnX = info?.SpawnX ?? MapGeneratorService.Width  / 2;
            int spawnY = info?.SpawnY ?? MapGeneratorService.Height / 2;

            var cls   = PickClass();
            var stats = UnitClassConfig.GetStats(cls);
            var unit  = new Unit
            {
                WorldSeed  = seed,
                ColonyKind = colonyKind,
                Class      = cls,
                X          = spawnX,
                Y          = spawnY,
                Hp         = stats.MaxHp,
                MaxHp      = stats.MaxHp,
                Strength   = stats.Strength,
                Speed      = stats.Speed,
                Endurance  = stats.Endurance,
                Iq         = stats.Iq,
            };
            db.Units.Add(unit);

            stor.Food -= FoodCost;
            modifiedStor.Add(stor);
            born.Add(ToUnitDto(unit));
        }

        if (born.Count > 0) await db.SaveChangesAsync();
        return born;
    }

    private static UnitClass PickClass() => Random.Shared.NextDouble() switch
    {
        < 0.40 => UnitClass.Gatherer,
        < 0.70 => UnitClass.Warrior,
        < 0.90 => UnitClass.Builder,
        _      => UnitClass.Scout,
    };

    private static UnitDto ToUnitDto(Unit u) => new(
        u.Id, u.WorldSeed, u.ColonyKind, u.Class,
        UnitClassConfig.GetName(u.Class),
        u.X, u.Y, u.Hp, u.MaxHp, u.Strength, u.Speed, u.Endurance, u.Iq,
        u.Hunger, u.Fatigue, u.Morale, u.Task, u.TargetX, u.TargetY);

    // ── Auto-assign ────────────────────────────────────────────────────────────

    private async Task AutoAssignAsync(
        Dictionary<(int seed, int x, int y), TileResource> resourceMap)
    {
        var all  = await db.Units.ToListAsync();
        var idle = all.Where(u => u.Task == UnitTaskType.Idle).ToList();
        if (idle.Count == 0) return;

        var seeds  = idle.Select(u => u.WorldSeed).Distinct();
        var worlds = seeds.ToDictionary(s => s, mapGen.Generate);
        bool any   = false;

        foreach (var unit in idle)
        {
            var world = worlds[unit.WorldSeed];
            bool assigned = unit.Class switch
            {
                UnitClass.Gatherer => TryAssignGather(unit, world, resourceMap),
                UnitClass.Warrior  => TryAssignAttack(unit, world, all),
                UnitClass.Scout    => TryAssignPatrol(unit, world),
                _                  => false,
            };
            if (assigned) any = true;
        }

        if (any) await db.SaveChangesAsync();
    }

    private bool TryAssignGather(Unit unit, WorldMap world,
        Dictionary<(int seed, int x, int y), TileResource> resourceMap)
    {
        var nearest = resourceMap.Values
            .Where(r => r.WorldSeed == unit.WorldSeed && r.Amount > 0)
            .MinBy(r => Math.Abs(r.X - unit.X) + Math.Abs(r.Y - unit.Y));
        if (nearest is null) return false;

        var raw = astar.FindPath(world.Tiles,
            MapGeneratorService.Width, MapGeneratorService.Height,
            unit.X, unit.Y, nearest.X, nearest.Y);
        if (raw is null) return false;

        unit.Task     = UnitTaskType.Gather;
        unit.TargetX  = nearest.X;
        unit.TargetY  = nearest.Y;
        unit.PathJson = raw.Count > 0 ? SerializePath(raw) : null;
        return true;
    }

    private bool TryAssignAttack(Unit unit, WorldMap world, List<Unit> all)
    {
        var enemy = all
            .Where(u => u.WorldSeed == unit.WorldSeed && u.ColonyKind != unit.ColonyKind)
            .MinBy(u => Math.Abs(u.X - unit.X) + Math.Abs(u.Y - unit.Y));
        if (enemy is null) return false;

        var raw = astar.FindPath(world.Tiles,
            MapGeneratorService.Width, MapGeneratorService.Height,
            unit.X, unit.Y, enemy.X, enemy.Y);
        if (raw is null) return false;

        unit.Task     = UnitTaskType.Attack;
        unit.TargetX  = enemy.X;
        unit.TargetY  = enemy.Y;
        unit.PathJson = raw.Count > 0 ? SerializePath(raw) : null;
        return true;
    }

    private bool TryAssignPatrol(Unit unit, WorldMap world)
    {
        for (int i = 0; i < 20; i++)
        {
            int tx = Random.Shared.Next(MapGeneratorService.Width);
            int ty = Random.Shared.Next(MapGeneratorService.Height);
            if (world.Tiles[ty * MapGeneratorService.Width + tx] == TileType.Water) continue;

            var raw = astar.FindPath(world.Tiles,
                MapGeneratorService.Width, MapGeneratorService.Height,
                unit.X, unit.Y, tx, ty);
            if (raw is null || raw.Count == 0) continue;

            unit.Task     = UnitTaskType.Patrol;
            unit.TargetX  = tx;
            unit.TargetY  = ty;
            unit.PathJson = SerializePath(raw);
            return true;
        }
        return false;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static void AddToStorage(ColonyStorage s, ResourceKind kind, int amount)
    {
        switch (kind)
        {
            case ResourceKind.Food:   s.Food   += amount; break;
            case ResourceKind.Wood:   s.Wood   += amount; break;
            case ResourceKind.Stone:  s.Stone  += amount; break;
            case ResourceKind.Energy: s.Energy += amount; break;
            case ResourceKind.Gems:   s.Gems   += amount; break;
            case ResourceKind.Oil:    s.Oil    += amount; break;
            case ResourceKind.Ore:    s.Ore    += amount; break;
        }
    }

    private static string SerializePath(List<(int x, int y)> raw) =>
        JsonSerializer.Serialize(raw.Select(p => new PathPoint(p.x, p.y)).ToList());

    private static ColonyStorageDto ToStorageDto(ColonyStorage s) =>
        new(s.WorldSeed, s.ColonyKind,
            s.Food, s.Wood, s.Stone, s.Energy, s.Gems, s.Oil, s.Ore);
}
