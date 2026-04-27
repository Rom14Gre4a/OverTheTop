using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OverTheTop.Application.DTOs.Auth;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;

namespace OverTheTop.Infrastructure.Services;

public class AuthService(IAthleteRepository athleteRepo, IConfiguration config) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await athleteRepo.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email вже використовується.");

        var athlete = new Athlete
        {
            FirstName    = dto.FirstName,
            LastName     = dto.LastName,
            Email        = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            DateOfBirth  = dto.DateOfBirth,
            Gender       = dto.Gender,
            Weight       = dto.Weight,
            WeightCategory  = dto.WeightCategory,
            PreferredHand   = dto.PreferredHand,
            PreferredStyle  = dto.PreferredStyle,
            Country      = dto.Country,
            Club         = dto.Club
        };

        await athleteRepo.AddAsync(athlete);
        await athleteRepo.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token   = GenerateToken(athlete),
            Athlete = MapToProfile(athlete)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var athlete = await athleteRepo.GetByEmailAsync(dto.Email)
            ?? throw new UnauthorizedAccessException("Невірний email або пароль.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, athlete.PasswordHash))
            throw new UnauthorizedAccessException("Невірний email або пароль.");

        return new AuthResponseDto
        {
            Token   = GenerateToken(athlete),
            Athlete = MapToProfile(athlete)
        };
    }

    private string GenerateToken(Athlete athlete)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, athlete.Id.ToString()),
            new Claim(ClaimTypes.Email, athlete.Email),
            new Claim(ClaimTypes.GivenName, athlete.FirstName)
        };

        var expires = DateTime.UtcNow.AddMinutes(
            double.Parse(config["Jwt:ExpiresInMinutes"] ?? "60"));

        var token = new JwtSecurityToken(
            issuer:   config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:   claims,
            expires:  expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static AthleteProfileDto MapToProfile(Athlete a) => new()
    {
        Id             = a.Id,
        FirstName      = a.FirstName,
        LastName       = a.LastName,
        Email          = a.Email,
        DateOfBirth    = a.DateOfBirth,
        Gender         = a.Gender,
        Weight         = a.Weight,
        WeightCategory = a.WeightCategory,
        PreferredHand  = a.PreferredHand,
        PreferredStyle = a.PreferredStyle,
        Country        = a.Country,
        Club           = a.Club
    };
}
