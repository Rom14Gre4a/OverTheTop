namespace OverTheTop.Evolution.Services;

public sealed class SimulationSpeedService
{
    public int  IntervalMs { get; set; } = 1000;
    public bool Paused     { get; set; } = false;
    public int  TickCount  { get; set; } = 0;
}
