namespace OverTheTop.Application.SpawnRules;

/// <summary>
/// Authoritative spawn table for all tile → resource mappings.
/// Rules for the same TileType are sorted by Priority (ascending).
/// The generator tries each rule in order; first roll that succeeds wins (one resource per tile).
/// TileType:     0=Water  1=Land  2=Sand  3=Mountain  4=Forest
/// ResourceKind: 0=Food   1=Wood  2=Stone 3=Energy
/// </summary>
public static class SpawnRuleConfig
{
    public static readonly IReadOnlyList<SpawnRule> Rules =
    [
        // Land  → food
        new(TileType: 1, TileName: "Суша",  ResourceKind: 0, ResourceName: "Їжа",    Priority: 1, Chance: 0.35, AmountMin: 40, AmountMax: 100),

        // Forest → wood (dominant), small food from berries
        new(TileType: 4, TileName: "Ліс",   ResourceKind: 1, ResourceName: "Дерево", Priority: 1, Chance: 0.55, AmountMin: 40, AmountMax: 100),
        new(TileType: 4, TileName: "Ліс",   ResourceKind: 0, ResourceName: "Їжа",    Priority: 2, Chance: 0.12, AmountMin: 20, AmountMax:  60),

        // Mountain → rare energy, common stone
        new(TileType: 3, TileName: "Гори",  ResourceKind: 3, ResourceName: "Енергія",Priority: 1, Chance: 0.06, AmountMin: 30, AmountMax:  80),
        new(TileType: 3, TileName: "Гори",  ResourceKind: 2, ResourceName: "Камінь", Priority: 2, Chance: 0.46, AmountMin: 40, AmountMax: 100),

        // Sand → scarce food (shellfish, seaweed)
        new(TileType: 2, TileName: "Пісок", ResourceKind: 0, ResourceName: "Їжа",    Priority: 1, Chance: 0.08, AmountMin: 10, AmountMax:  40),
    ];

    /// <summary>Rules grouped by TileType and sorted by Priority, ready for the generator.</summary>
    public static readonly IReadOnlyDictionary<int, IReadOnlyList<SpawnRule>> ByTile =
        Rules
            .GroupBy(r => r.TileType)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<SpawnRule>)g.OrderBy(r => r.Priority).ToList());
}
