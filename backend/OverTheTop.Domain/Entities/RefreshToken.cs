namespace OverTheTop.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid   AthleteId { get; set; }
    public string Token     { get; set; } = string.Empty;
    public DateTime ExpiresAt  { get; set; }
    public bool   IsRevoked  { get; set; }

    public Athlete Athlete { get; set; } = null!;

    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}
