namespace AmarStore.Api.DTOs;

public record ProductDto(
    int Id,
    string Name,
    string Category,
    string Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    List<string>? Images,
    bool IsAvailable,
    bool IsFeatured,
    DateTime CreatedAt
);

public record CreateProductRequest(
    string Name,
    string Category,
    string Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    List<string>? Images,
    bool IsAvailable,
    bool IsFeatured
);

public record UpdateProductRequest(
    string Name,
    string Category,
    string Description,
    decimal Price,
    decimal? OldPrice,
    string ImageUrl,
    List<string>? Images,
    bool IsAvailable,
    bool IsFeatured
);

public record OfferDto(
    int Id,
    string Title,
    string Description,
    string BadgeText,
    string? ImageUrl,
    string? ActionUrl,
    bool IsActive
);

public record CreateOfferRequest(
    string Title,
    string Description,
    string BadgeText,
    string? ImageUrl,
    string? ActionUrl,
    bool IsActive
);
