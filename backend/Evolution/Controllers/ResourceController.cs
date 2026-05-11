using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.Interfaces;
using OverTheTop.Application.SpawnRules;
using OverTheTop.Evolution.Services;

namespace OverTheTop.Evolution.Controllers;

[ApiController]
[Route("api/evolution")]
[AllowAnonymous]
public class ResourceController(MapGeneratorService mapGen, IEvolutionResourceService resources)
    : ControllerBase
{
    [HttpGet("resources")]
    public async Task<IActionResult> GetResources([FromQuery] int seed = 42)
    {
        var map   = mapGen.Generate(seed);
        var tiles = map.Tiles.Select(t => (int)t).ToArray();
        var result = await resources.GetOrGenerateAsync(seed, tiles, map.Width, map.Height);
        return Ok(result);
    }

    [HttpGet("spawn-rules")]
    public IActionResult GetSpawnRules() => Ok(SpawnRuleConfig.Rules);
}
