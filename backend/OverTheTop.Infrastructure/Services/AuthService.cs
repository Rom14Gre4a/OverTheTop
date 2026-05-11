using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OverTheTop.Application.DTOs.Auth;
using OverTheTop.Application.Interfaces;
using OverTheTop.Domain.Entities;
using OverTheTop.Infrastructure.Data;

namespace OverTheTop.Infrastructure.Services;

public class AuthService(IAthleteRepository athleteRepo, AppDbContext db, IConfiguration config) : IAuthService
{
    private static readonly int RefreshTokenDays = 30;

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await athleteRepo.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email вже використовується.");

        var athlete = new Athlete
        {
            FirstName      = dto.FirstName ?? string.Empty,
            LastName       = dto.LastName  ?? string.Empty,
            Email          = dto.Email,
            PasswordHash   = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            DateOfBirth    = dto.DateOfBirth,
            Gender         = dto.Gender,
            Weight         = dto.Weight,
            WeightCategory = dto.WeightCategory,
            PreferredHand  = dto.PreferredHand,
            PreferredStyle = dto.PreferredStyle,
            Country        = dto.Country,
            Club           = dto.Club
        };

        await athleteRepo.AddAsync(athlete);
        await athleteRepo.SaveChangesAsync();

        var refreshToken = await CreateRefreshTokenAsync(athlete.Id);

        return new AuthResponseDto
        {
            Token        = GenerateAccessToken(athlete),
            RefreshToken = refreshToken.Token,
            Athlete      = MapToProfile(athlete)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var athlete = await athleteRepo.GetByEmailAsync(dto.Email)
            ?? throw new UnauthorizedAccessException("Невірний email або пароль.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, athlete.PasswordHash))
            throw new UnauthorizedAccessException("Невірний email або пароль.");

        var refreshToken = await CreateRefreshTokenAsync(athlete.Id);

        return new AuthResponseDto
        {
            Token        = GenerateAccessToken(athlete),
            RefreshToken = refreshToken.Token,
            Athlete      = MapToProfile(athlete)
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var existing = await db.RefreshTokens
            .Include(r => r.Athlete)
            .FirstOrDefaultAsync(r => r.Token == refreshToken)
            ?? throw new UnauthorizedAccessException("Недійсний refresh token.");

        if (!existing.IsActive)
            throw new UnauthorizedAccessException("Refresh token прострочений або відкликаний.");

        // rotate: revoke old, issue new
        existing.IsRevoked = true;
        var newRefresh = await CreateRefreshTokenAsync(existing.AthleteId);

        await db.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token        = GenerateAccessToken(existing.Athlete),
            RefreshToken = newRefresh.Token,
            Athlete      = MapToProfile(existing.Athlete)
        };
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var existing = await db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken)
            ?? throw new UnauthorizedAccessException("Недійсний refresh token.");

        existing.IsRevoked = true;
        await db.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(Guid athleteId, ChangePasswordDto dto)
    {
        var athlete = await db.Athletes.FindAsync(athleteId)
            ?? throw new KeyNotFoundException("Атлета не знайдено.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, athlete.PasswordHash))
            throw new UnauthorizedAccessException("Поточний пароль невірний.");

        athlete.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        // revoke all existing refresh tokens on password change
        var tokens = db.RefreshTokens.Where(r => r.AthleteId == athleteId && !r.IsRevoked);
        await tokens.ForEachAsync(t => t.IsRevoked = true);

        await db.SaveChangesAsync();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<RefreshToken> CreateRefreshTokenAsync(Guid athleteId)
    {
        var token = new RefreshToken
        {
            AthleteId = athleteId,
            Token     = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays)
        };

        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();
        return token;
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private string GenerateAccessToken(Athlete athlete)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, athlete.Id.ToString()),
            new Claim(ClaimTypes.Email,          athlete.Email),
            new Claim(ClaimTypes.GivenName,      athlete.FirstName),
            new Claim(ClaimTypes.Role,           athlete.Role.ToString())
        };

        var expires = DateTime.UtcNow.AddMinutes(
            double.Parse(config["Jwt:ExpiresInMinutes"] ?? "60"));

        var token = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static AthleteProfileDto MapToProfile(Athlete a) => new()
    {
        Id             = a.Id,
        FirstName      = a.FirstName,
        LastName       = a.LastName,
        Email          = a.Email,
        Role           = a.Role,
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
