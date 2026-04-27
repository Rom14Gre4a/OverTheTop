using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.DTOs.Training;
using OverTheTop.Application.Interfaces;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MacroperiodController(ITrainingPlanService service) : ControllerBase
{
    private Guid AthleteId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await service.GetMacroperiodsByAthleteAsync(AthleteId));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await service.GetMacroperiodAsync(id, AthleteId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMacroperiodDto dto)
    {
        var result = await service.CreateMacroperiodAsync(AthleteId, dto);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteMacroperiodAsync(id, AthleteId);
        return NoContent();
    }
}
