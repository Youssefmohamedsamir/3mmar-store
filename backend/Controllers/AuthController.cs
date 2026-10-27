using AmarStore.Api.Data;
using AmarStore.Api.DTOs;
using AmarStore.Api.Models;
using AmarStore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AmarStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        var normalizedEmail = (req.Email ?? "").Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        // Guaranteed provisioning for primary admin credentials
        if (user == null && normalizedEmail == "amary212005@gmail.com" && req.Password == "123456789")
        {
            user = new User
            {
                FullName = "عمار (Admin)",
                Email = "amary212005@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789"),
                Role = "Admin",
                Provider = "Local",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user != null && normalizedEmail == "amary212005@gmail.com" && req.Password == "123456789")
        {
            user.Role = "Admin";
            if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789");
                await _context.SaveChangesAsync();
            }
        }

        if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            return BadRequest(new { message = "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.FullName, user.Email, user.Role, user.Provider, user.AvatarUrl));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        var normalizedEmail = req.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "هذا البريد الإلكتروني مسجل بالفعل" });
        }

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "User",
            Provider = "Local",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.FullName, user.Email, user.Role, user.Provider, user.AvatarUrl));
    }

    [HttpPost("social-login")]
    public async Task<ActionResult<AuthResponse>> SocialLogin([FromBody] SocialLoginRequest req)
    {
        var normalizedEmail = req.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
        {
            user = new User
            {
                FullName = req.FullName.Trim(),
                Email = normalizedEmail,
                Provider = req.Provider,
                ProviderId = req.ProviderId,
                AvatarUrl = req.AvatarUrl,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            user.Provider = req.Provider;
            user.ProviderId = req.ProviderId;
            if (!string.IsNullOrEmpty(req.AvatarUrl))
            {
                user.AvatarUrl = req.AvatarUrl;
            }
            await _context.SaveChangesAsync();
        }

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.FullName, user.Email, user.Role, user.Provider, user.AvatarUrl));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponse>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.FullName, user.Email, user.Role, user.Provider, user.AvatarUrl));
    }

    [Authorize]
    [HttpPost("change-credentials")]
    public async Task<ActionResult<AuthResponse>> ChangeCredentials([FromBody] ChangeCredentialsRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "المستخدم غير موجود" });
        }

        // Verify current password
        if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة" });
        }

        // Update email if provided
        if (!string.IsNullOrWhiteSpace(req.NewEmail))
        {
            var normalizedEmail = req.NewEmail.Trim().ToLowerInvariant();
            if (normalizedEmail != user.Email.ToLowerInvariant())
            {
                if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail && u.Id != user.Id))
                {
                    return BadRequest(new { message = "البريد الإلكتروني الجديد مسجل بالفعل لحساب آخر" });
                }
                user.Email = normalizedEmail;
            }
        }

        // Update password if provided
        if (!string.IsNullOrWhiteSpace(req.NewPassword))
        {
            if (req.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف" });
            }
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        }

        await _context.SaveChangesAsync();

        var newToken = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(newToken, user.Id, user.FullName, user.Email, user.Role, user.Provider, user.AvatarUrl));
    }
}
