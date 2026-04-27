using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Ok(new
        {
            status = canConnect ? "healthy" : "db_unreachable",
            database = canConnect ? "connected" : "disconnected",
            timestamp = DateTime.UtcNow
        });
    }
}
