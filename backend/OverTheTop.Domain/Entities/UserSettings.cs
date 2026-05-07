namespace OverTheTop.Domain.Entities;

public class UserSettings : BaseEntity
{
    public Guid AthleteId { get; set; }
    public Athlete? Athlete { get; set; }

    public string ThemeMode { get; set; } = "lime";

    // JSON: {"red":"#FF1744","lime":"#8bff00","yellow":"#eab308"}
    public string? AccentColorsJson { get; set; }

    // base64 or external URL
    public string? WallpaperUrl { get; set; }
}
