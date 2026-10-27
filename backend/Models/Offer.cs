namespace AmarStore.Api.Models;

public class Offer
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BadgeText { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? ActionUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
