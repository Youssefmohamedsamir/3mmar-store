namespace AmarStore.Api.DTOs;

public record StoreSettingsDto(
    string StoreName,
    string Phone,
    string WhatsApp,
    string FacebookUrl,
    string InstagramUrl,
    string TikTokUrl,
    string WelcomeMessage,
    string Address
);

public record UpdateSettingsRequest(
    string StoreName,
    string Phone,
    string WhatsApp,
    string FacebookUrl,
    string InstagramUrl,
    string TikTokUrl,
    string WelcomeMessage,
    string Address
);

public record AnalyticsSummaryDto(
    int TotalVisitors,
    int TotalRegisteredUsers,
    int TotalProducts,
    int TotalOrderClicks,
    int WhatsAppClicks,
    int PhoneCallClicks,
    List<RecentOrderIntentDto> RecentIntents,
    List<RegisteredUserDto> RecentUsers
);

public record RecentOrderIntentDto(
    int Id,
    string ProductName,
    string Category,
    decimal Price,
    string OrderType,
    string? CustomerName,
    string? CustomerEmail,
    DateTime CreatedAt
);

public record RegisteredUserDto(
    int Id,
    string FullName,
    string Email,
    string Provider,
    string Role,
    DateTime CreatedAt
);

public record RecordOrderIntentRequest(
    int ProductId,
    string OrderType, // "WhatsApp" or "Phone"
    string? CustomerPhone
);
