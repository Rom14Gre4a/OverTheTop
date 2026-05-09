using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.DTOs.Training;
using OverTheTop.Application.Interfaces;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/records")]
[Authorize]
public class RecordsController(ITrainingPlanService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await service.GetRecordsAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create(CreatePersonalRecordDto dto) =>
        Ok(await service.CreateRecordAsync(UserId, dto));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteRecordAsync(id, UserId);
        return NoContent();
    }
}
