using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class Unit : BaseEntity
{
    public int          WorldSeed  { get; set; }
    public int          ColonyKind { get; set; }
    public UnitClass    Class      { get; set; }
    public int          X          { get; set; }
    public int          Y          { get; set; }
    public int          Hp         { get; set; }
    public int          MaxHp      { get; set; }
    public int          Strength   { get; set; }
    public int          Speed      { get; set; }
    public int          Endurance  { get; set; }
    public int          Iq         { get; set; }
    public float        Hunger     { get; set; } = 0f;
    public float        Fatigue    { get; set; } = 0f;
    public float        Morale     { get; set; } = 100f;
    public UnitTaskType Task       { get; set; } = UnitTaskType.Idle;
    public int?         TargetX    { get; set; }
    public int?         TargetY    { get; set; }
    public string?      PathJson   { get; set; }
}
