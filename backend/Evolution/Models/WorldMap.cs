namespace OverTheTop.Evolution.Models;

public sealed class WorldMap
{
    public int Width  { get; init; }
    public int Height { get; init; }
    public int Seed   { get; init; }
    public TileType[] Tiles { get; init; } = [];

    public TileType Get(int x, int y) => Tiles[y * Width + x];
}
