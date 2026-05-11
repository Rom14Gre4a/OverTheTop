using OverTheTop.Application.DTOs.Auth;

namespace OverTheTop.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task RevokeTokenAsync(string refreshToken);
    Task ChangePasswordAsync(Guid athleteId, ChangePasswordDto dto);
}
