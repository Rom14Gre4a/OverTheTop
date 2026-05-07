using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.DTOs.Settings;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController(IUserSettingsRepository settings) : ControllerBase
{
    private Guid AthleteId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var s = await settings.GetByAthleteIdAsync(AthleteId);
        if (s is null)
            return Ok(new UserSettingsDto { ThemeMode = "lime" });

        return Ok(new UserSettingsDto
        {
            ThemeMode        = s.ThemeMode,
            AccentColorsJson = s.AccentColorsJson,
            WallpaperUrl     = s.WallpaperUrl,
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UserSettingsDto dto)
    {
        var s = await settings.GetByAthleteIdAsync(AthleteId);

        if (s is null)
        {
            s = new UserSettings { AthleteId = AthleteId };
            await settings.AddAsync(s);
        }

        s.ThemeMode        = dto.ThemeMode;
        s.AccentColorsJson = dto.AccentColorsJson;
        s.WallpaperUrl     = dto.WallpaperUrl;

        settings.Update(s);
        await settings.SaveChangesAsync();

        return Ok(new UserSettingsDto
        {
            ThemeMode        = s.ThemeMode,
            AccentColorsJson = s.AccentColorsJson,
            WallpaperUrl     = s.WallpaperUrl,
        });
    }
}
