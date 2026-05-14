using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.Factions;
using OverTheTop.Evolution.Services;

namespace OverTheTop.Evolution.Controllers;

[ApiController]
[Route("api/evolution")]
[AllowAnonymous]
public class FactionController(MapGeneratorService mapGen, ColonyStartService colonyStart)
    : ControllerBase
{
    [HttpGet("factions")]
    public IActionResult GetFactions() => Ok(FactionRegistry.All);

    [HttpGet("colony-start")]
    public IActionResult GetColonyStart([FromQuery] int seed = 42)
    {
        var map    = mapGen.Generate(seed);
        var tiles  = map.Tiles.Select(t => (int)t).ToArray();
        var result = colonyStart.Compute(seed, tiles, map.Width, map.Height);
        return Ok(result);
    }
}
