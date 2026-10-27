namespace AmarStore.Api.Models;

public class OrderIntent
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string OrderType { get; set; } = "WhatsApp"; // "WhatsApp" or "Phone"
    public string? CustomerPhone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
