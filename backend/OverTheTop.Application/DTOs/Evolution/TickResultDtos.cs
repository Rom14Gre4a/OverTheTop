namespace OverTheTop.Application.DTOs.Evolution;

public record UnitMovedDto(Guid Id, int X, int Y, int Task);

public record ResourceUpdateDto(int WorldSeed, int X, int Y, int NewAmount, int Kind = 0, int MaxAmount = 0);

public record ColonyStorageDto(
    int WorldSeed, int ColonyKind,
    int Food, int Wood, int Stone, int Energy, int Gems, int Oil, int Ore);

public record SetSpeedDto(int Multiplier);

public record TickResult(
    IReadOnlyList<UnitMovedDto>      Moved,
    IReadOnlyList<Guid>              Died,
    IReadOnlyList<ColonyStorageDto>  StorageUpdates,
    IReadOnlyList<ResourceUpdateDto> ResourceUpdates,
    IReadOnlyList<UnitDto>           Born)
{
    public static readonly TickResult Empty = new([], [], [], [], []);
}
