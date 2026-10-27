namespace AmarStore.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string Role { get; set; } = "User"; // "Admin" or "User"
    public string Provider { get; set; } = "Local"; // "Local", "Google", "Facebook"
    public string? ProviderId { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
