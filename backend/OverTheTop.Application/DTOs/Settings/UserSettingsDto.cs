namespace OverTheTop.Application.DTOs.Settings;

public class UserSettingsDto
{
    public string ThemeMode { get; set; } = "lime";
    public string? AccentColorsJson { get; set; }
    public string? WallpaperUrl { get; set; }
}
