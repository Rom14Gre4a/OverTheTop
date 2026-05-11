namespace OverTheTop.Application.SpawnRules;

/// <summary>
/// One entry in the spawn table: which resource appears on a tile type,
/// with what probability and in what quantity range.
/// Rules for the same TileType are tried in Priority order — first match wins.
/// </summary>
public sealed record SpawnRule(
    int    TileType,
    string TileName,
    int    ResourceKind,
    string ResourceName,
    int    Priority,
    double Chance,
    int    AmountMin,
    int    AmountMax
);
