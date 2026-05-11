using OverTheTop.Domain.Enums;

namespace OverTheTop.Domain.Entities;

public class TileResource : BaseEntity
{
    public int          WorldSeed { get; set; }
    public int          X         { get; set; }
    public int          Y         { get; set; }
    public ResourceKind Kind      { get; set; }
    public int          Amount    { get; set; }
    public int          MaxAmount { get; set; }
}
