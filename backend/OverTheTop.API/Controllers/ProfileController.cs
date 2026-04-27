using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OverTheTop.Application.DTOs.Auth;
using OverTheTop.Application.Interfaces;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController(IAthleteRepository athletes) : ControllerBase
{
    private Guid AthleteId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var athlete = await athletes.GetByIdAsync(AthleteId);
        if (athlete is null) return NotFound();

        return Ok(new AthleteProfileDto
        {
            Id            = athlete.Id,
            FirstName     = athlete.FirstName,
            LastName      = athlete.LastName,
            Email         = athlete.Email,
            DateOfBirth   = athlete.DateOfBirth,
            Gender        = athlete.Gender,
            Weight        = athlete.Weight,
            WeightCategory = athlete.WeightCategory,
            PreferredHand = athlete.PreferredHand,
            PreferredStyle = athlete.PreferredStyle,
            Country       = athlete.Country,
            Club          = athlete.Club,
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileDto dto)
    {
        var athlete = await athletes.GetByIdAsync(AthleteId);
        if (athlete is null) return NotFound();

        athlete.FirstName     = dto.FirstName;
        athlete.LastName      = dto.LastName;
        athlete.DateOfBirth   = dto.DateOfBirth;
        athlete.Gender        = dto.Gender;
        athlete.Weight        = dto.Weight;
        athlete.WeightCategory = dto.WeightCategory;
        athlete.PreferredHand = dto.PreferredHand;
        athlete.PreferredStyle = dto.PreferredStyle;
        athlete.Country       = dto.Country;
        athlete.Club          = dto.Club;

        athletes.Update(athlete);
        await athletes.SaveChangesAsync();

        return Ok(new AthleteProfileDto
        {
            Id            = athlete.Id,
            FirstName     = athlete.FirstName,
            LastName      = athlete.LastName,
            Email         = athlete.Email,
            DateOfBirth   = athlete.DateOfBirth,
            Gender        = athlete.Gender,
            Weight        = athlete.Weight,
            WeightCategory = athlete.WeightCategory,
            PreferredHand = athlete.PreferredHand,
            PreferredStyle = athlete.PreferredStyle,
            Country       = athlete.Country,
            Club          = athlete.Club,
        });
    }
}
