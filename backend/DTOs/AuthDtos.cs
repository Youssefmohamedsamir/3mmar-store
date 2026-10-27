namespace AmarStore.Api.DTOs;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string FullName, string Email, string Password);

public record SocialLoginRequest(string Provider, string ProviderId, string Email, string FullName, string? AvatarUrl);

public record AuthResponse(string Token, int UserId, string FullName, string Email, string Role, string Provider, string? AvatarUrl);

public record UpdateProfileRequest(string FullName);

public record ChangeCredentialsRequest(string CurrentPassword, string? NewEmail, string? NewPassword);
