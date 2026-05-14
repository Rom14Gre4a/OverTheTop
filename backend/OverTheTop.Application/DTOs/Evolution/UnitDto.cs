using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.DTOs.Evolution;

public record CreateUnitDto(
    int       WorldSeed,
    int       ColonyKind,
    UnitClass Class,
    int       X,
    int       Y
);

public record AssignTaskDto(
    UnitTaskType TaskType,
    int?         TargetX,
    int?         TargetY
);

public record UnitDto(
    Guid         Id,
    int          WorldSeed,
    int          ColonyKind,
    UnitClass    Class,
    string       ClassName,
    int          X,
    int          Y,
    int          Hp,
    int          MaxHp,
    int          Strength,
    int          Speed,
    int          Endurance,
    int          Iq,
    float        Hunger,
    float        Fatigue,
    float        Morale,
    UnitTaskType Task,
    int?         TargetX,
    int?         TargetY
);
