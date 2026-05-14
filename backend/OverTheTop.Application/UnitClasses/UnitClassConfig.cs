using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.UnitClasses;

public sealed record UnitBaseStats(int MaxHp, int Strength, int Speed, int Endurance, int Iq);

public static class UnitClassConfig
{
    private static readonly Dictionary<UnitClass, UnitBaseStats> Stats = new()
    {
        [UnitClass.Gatherer] = new(80,  6,  8, 9,  7),
        [UnitClass.Builder]  = new(90,  8,  6, 10, 6),
        [UnitClass.Warrior]  = new(120, 10, 7, 8,  5),
        [UnitClass.Scout]    = new(70,  5,  10, 7, 9),
    };

    public static UnitBaseStats GetStats(UnitClass cls) => Stats[cls];

    public static string GetName(UnitClass cls) => cls switch
    {
        UnitClass.Gatherer => "Збирач",
        UnitClass.Builder  => "Будівник",
        UnitClass.Warrior  => "Воїн",
        UnitClass.Scout    => "Розвідник",
        _                  => cls.ToString(),
    };
}
