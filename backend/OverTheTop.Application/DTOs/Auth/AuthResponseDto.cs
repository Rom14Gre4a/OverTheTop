namespace OverTheTop.Application.DTOs.Auth;

public class AuthResponseDto
{
    public string           Token        { get; set; } = string.Empty;
    public string           RefreshToken { get; set; } = string.Empty;
    public AthleteProfileDto Athlete     { get; set; } = null!;
}
