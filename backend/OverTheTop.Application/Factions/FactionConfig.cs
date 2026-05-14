namespace OverTheTop.Application.Factions;

public sealed record FactionConfig(
    int    Kind,
    string Name,
    string Description,
    string Color,            // hex, e.g. "#2a7a34"
    int[]  PreferredTiles,   // TileType values used for spawn-point scoring
    IReadOnlyList<FactionBonus> Bonuses
);
