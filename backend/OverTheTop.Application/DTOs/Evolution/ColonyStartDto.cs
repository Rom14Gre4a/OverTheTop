using OverTheTop.Application.Factions;

namespace OverTheTop.Application.DTOs.Evolution;

public sealed record BuildingDto(
    string Type,   // "hq" | "warehouse" | "campfire"
    int    X,
    int    Y
);

public sealed record ColonyStartDto(
    int    Kind,
    string Name,
    string Description,
    string Color,
    IReadOnlyList<FactionBonus> Bonuses,
    int    SpawnX,
    int    SpawnY,
    IReadOnlyList<BuildingDto> Buildings
);
