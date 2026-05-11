using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Evolution.Services;

namespace OverTheTop.Evolution.Controllers;

[ApiController]
[Route("api/evolution")]
[AllowAnonymous]
public class EvolutionController(MapGeneratorService mapGen) : ControllerBase
{
    [HttpGet("map")]
    public IActionResult GetMap([FromQuery] int seed = 42)
    {
        var map = mapGen.Generate(seed);
        return Ok(new
        {
            width  = map.Width,
            height = map.Height,
            seed   = map.Seed,
            tiles  = map.Tiles.Select(t => (int)t).ToArray(),
        });
    }
}
