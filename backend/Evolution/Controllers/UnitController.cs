using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.DTOs.Evolution;
using OverTheTop.Application.Interfaces;
using OverTheTop.Evolution.Services;

namespace OverTheTop.Evolution.Controllers;

[ApiController]
[Route("api/evolution")]
[AllowAnonymous]
public class UnitController(
    IUnitService        units,
    MapGeneratorService mapGen,
    AStarService        astar,
    ISimulationService  sim)
    : ControllerBase
{
    [HttpGet("storage")]
    public async Task<IActionResult> GetStorage([FromQuery] int seed)
        => Ok(await sim.GetStoragesAsync(seed));

    [HttpPost("speed")]
    public IActionResult SetSpeed(
        [FromBody]   SetSpeedDto           dto,
        [FromServices] SimulationSpeedService speed)
    {
        speed.Paused     = dto.Multiplier == 0;
        speed.IntervalMs = dto.Multiplier switch
        {
            4  => 250,
            16 => 62,
            _  => 1000,
        };
        return Ok(new { speed.Paused, speed.IntervalMs });
    }

    [HttpPost("units")]
    public async Task<IActionResult> Create([FromBody] CreateUnitDto dto)
        => Ok(await units.CreateAsync(dto));

    [HttpGet("units")]
    public async Task<IActionResult> GetByWorld([FromQuery] int seed)
        => Ok(await units.GetByWorldAsync(seed));

    [HttpPost("units/{id:guid}/task")]
    public async Task<IActionResult> AssignTask(Guid id, [FromBody] AssignTaskDto dto)
    {
        IReadOnlyList<PathPoint>? path = null;

        if (dto.TaskType != OverTheTop.Domain.Enums.UnitTaskType.Idle
            && dto.TargetX.HasValue && dto.TargetY.HasValue)
        {
            var unit = await units.GetByIdAsync(id);
            if (unit is null) return NotFound();

            var world = mapGen.Generate(unit.WorldSeed);
            var raw   = astar.FindPath(world.Tiles,
                MapGeneratorService.Width, MapGeneratorService.Height,
                unit.X, unit.Y, dto.TargetX.Value, dto.TargetY.Value);

            path = raw?.Select(p => new PathPoint(p.x, p.y)).ToList();
        }

        var result = await units.AssignTaskAsync(id, dto, path);
        return result is null ? NotFound() : Ok(result);
    }
}
