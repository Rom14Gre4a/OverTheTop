namespace OverTheTop.Application.Factions;

/// <summary>
/// Static configuration for all three factions.
/// ResourceKind: 0=Food 1=Wood 2=Stone 3=Energy 4=Gems 5=Oil 6=Ore
/// TileType:     0=Water 1=Land 2=Sand 3=Mountain 4=Forest
/// </summary>
public static class FactionRegistry
{
    public static readonly IReadOnlyList<FactionConfig> All =
    [
        new FactionConfig(
            Kind:        0,
            Name:        "Лісовики",
            Description: "Майстри лісу. Швидко збирають їжу та деревину, але погано видобувають каміння і руду.",
            Color:       "#2d8a3e",
            PreferredTiles: [4, 1],   // Forest, Land
            Bonuses:
            [
                new(1, "Дерево",    1.70),
                new(0, "Їжа",       1.40),
                new(4, "Самоцвіти", 1.20),
                new(2, "Камінь",    0.55),
                new(3, "Енергія",   0.60),
                new(6, "Руда",      0.50),
            ]
        ),

        new FactionConfig(
            Kind:        1,
            Name:        "Гірняки",
            Description: "Підкорювачі гір. Видобувають каміння, руду та енергію з неймовірною ефективністю.",
            Color:       "#8b6914",
            PreferredTiles: [3],      // Mountain
            Bonuses:
            [
                new(2, "Камінь",    1.80),
                new(6, "Руда",      1.70),
                new(3, "Енергія",   1.40),
                new(4, "Самоцвіти", 1.30),
                new(0, "Їжа",       0.50),
                new(1, "Дерево",    0.60),
            ]
        ),

        new FactionConfig(
            Kind:        2,
            Name:        "Морські",
            Description: "Торговці та рибалки. Процвітають на узбережжі, видобуваючи їжу та нафту.",
            Color:       "#1a5fa0",
            PreferredTiles: [2, 1],   // Sand, Land (coastal)
            Bonuses:
            [
                new(0, "Їжа",       1.70),
                new(5, "Нафта",     1.60),
                new(3, "Енергія",   1.30),
                new(6, "Руда",      0.50),
                new(2, "Камінь",    0.60),
                new(1, "Дерево",    0.65),
            ]
        ),
    ];

    public static readonly IReadOnlyDictionary<int, FactionConfig> ByKind =
        All.ToDictionary(f => f.Kind);
}
