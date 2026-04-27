using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Enums;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExercisesController(ITrainingPlanService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ExerciseStyle? style) =>
        Ok(await service.GetExercisesAsync(style));
}
