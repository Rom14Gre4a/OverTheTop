namespace OverTheTop.Domain.Entities;

public class ColonyStorage : BaseEntity
{
    public int WorldSeed  { get; set; }
    public int ColonyKind { get; set; }
    public int Food       { get; set; }
    public int Wood       { get; set; }
    public int Stone      { get; set; }
    public int Energy     { get; set; }
    public int Gems       { get; set; }
    public int Oil        { get; set; }
    public int Ore        { get; set; }
}
