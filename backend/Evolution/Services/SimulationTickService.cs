using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OverTheTop.Application.Interfaces;
using OverTheTop.Evolution.Hubs;

namespace OverTheTop.Evolution.Services;

public sealed class SimulationTickService(
    IServiceScopeFactory       scopeFactory,
    IHubContext<SimulationHub> hub,
    SimulationSpeedService     speed
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            int delay = speed.Paused ? 200 : speed.IntervalMs;
            try { await Task.Delay(delay, ct); } catch (OperationCanceledException) { break; }
            if (speed.Paused) continue;
            try { await TickAsync(); } catch { /* don't crash the host */ }
        }
    }

    private async Task TickAsync()
    {
        using var scope  = scopeFactory.CreateScope();
        var       sim    = scope.ServiceProvider.GetRequiredService<ISimulationService>();
        var       result = await sim.TickAsync();

        if (result.Moved.Count > 0)
            await hub.Clients.All.SendAsync("UnitsMoved", result.Moved);

        if (result.Died.Count > 0)
            await hub.Clients.All.SendAsync("UnitsDied", result.Died);

        if (result.StorageUpdates.Count > 0)
            await hub.Clients.All.SendAsync("StorageUpdated", result.StorageUpdates);

        if (result.ResourceUpdates.Count > 0)
            await hub.Clients.All.SendAsync("ResourceUpdated", result.ResourceUpdates);

        if (result.Born.Count > 0)
            await hub.Clients.All.SendAsync("UnitsSpawned", result.Born);
    }
}
