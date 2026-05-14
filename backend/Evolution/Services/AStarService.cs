using OverTheTop.Evolution.Models;

namespace OverTheTop.Evolution.Services;

public sealed class AStarService
{
    private static readonly float[] TileWeight =
    [
        float.PositiveInfinity, // Water
        1.0f,                   // Land
        1.5f,                   // Sand
        3.0f,                   // Mountain
        1.5f,                   // Forest
    ];

    // 8-directional neighbours (dx, dy, base-cost multiplier)
    private static readonly (int dx, int dy, float cost)[] Dirs =
    [
        ( 1,  0, 1.0f), (-1,  0, 1.0f), ( 0,  1, 1.0f), ( 0, -1, 1.0f),
        ( 1,  1, 1.414f), ( 1, -1, 1.414f), (-1,  1, 1.414f), (-1, -1, 1.414f),
    ];

    public List<(int x, int y)>? FindPath(
        TileType[] tiles, int mapW, int mapH,
        int fromX, int fromY, int toX, int toY)
    {
        if (!InBounds(fromX, fromY, mapW, mapH) || !InBounds(toX, toY, mapW, mapH))
            return null;

        if (float.IsInfinity(Weight(tiles, toX, toY, mapW)))
            return null;

        var gScore = new Dictionary<int, float>();
        var prev   = new Dictionary<int, int>();
        var open   = new PriorityQueue<int, float>();

        int startIdx = fromY * mapW + fromX;
        int goalIdx  = toY   * mapW + toX;

        gScore[startIdx] = 0f;
        open.Enqueue(startIdx, 0f);

        while (open.Count > 0)
        {
            int cur = open.Dequeue();
            if (cur == goalIdx)
                return Reconstruct(prev, goalIdx, mapW);

            int cx = cur % mapW, cy = cur / mapW;

            foreach (var (dx, dy, stepCost) in Dirs)
            {
                int nx = cx + dx, ny = cy + dy;
                if (!InBounds(nx, ny, mapW, mapH)) continue;

                float w = Weight(tiles, nx, ny, mapW);
                if (float.IsInfinity(w)) continue;

                int nIdx    = ny * mapW + nx;
                float tentG = gScore[cur] + stepCost * w;

                if (!gScore.TryGetValue(nIdx, out float existing) || tentG < existing)
                {
                    gScore[nIdx] = tentG;
                    prev[nIdx]   = cur;
                    float h = MathF.Abs(nx - toX) + MathF.Abs(ny - toY);
                    open.Enqueue(nIdx, tentG + h);
                }
            }
        }

        return null;
    }

    private static List<(int x, int y)> Reconstruct(
        Dictionary<int, int> prev, int goal, int mapW)
    {
        var path = new List<(int, int)>();
        for (int cur = goal; prev.ContainsKey(cur); cur = prev[cur])
            path.Add((cur % mapW, cur / mapW));
        path.Reverse();
        return path;
    }

    private static float Weight(TileType[] tiles, int x, int y, int mapW)
        => TileWeight[(int)tiles[y * mapW + x]];

    private static bool InBounds(int x, int y, int w, int h)
        => x >= 0 && x < w && y >= 0 && y < h;
}
