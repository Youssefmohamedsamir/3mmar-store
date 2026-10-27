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
    int TotalPiecesSold,
    decimal TotalRevenue,
    decimal TotalProfit,
    List<RecentOrderIntentDto> RecentIntents,
    List<RegisteredUserDto> RecentUsers,
    List<SaleRecordDto> RecentSales
);

public record SaleRecordDto(
    int Id,
    int? ProductId,
    string ProductName,
    int QuantitySold,
    decimal SalePrice,
    decimal CostPrice,
    decimal TotalRevenue,
    decimal TotalProfit,
    string? CustomerName,
    string? CustomerPhone,
    string? Notes,
    DateTime SoldAt
);

public record RecordSaleRequest(
    int? ProductId,
    string? ProductName,
    int QuantitySold,
    decimal SalePrice,
    decimal CostPrice,
    string? CustomerName,
    string? CustomerPhone,
    string? Notes
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
