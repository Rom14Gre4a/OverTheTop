using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Enums;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExercisesController(ITrainingPlanService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ExerciseStyle? style) =>
        Ok(await service.GetExercisesAsync(style, UserId));

    [HttpPost("{id:guid}/favorite")]
    public async Task<IActionResult> ToggleFavorite(Guid id)
    {
        var isFavorite = await service.ToggleFavoriteAsync(id, UserId);
        return Ok(new { isFavorite });
    }
}
