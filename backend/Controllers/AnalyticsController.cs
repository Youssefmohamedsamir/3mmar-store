using AmarStore.Api.Data;
using AmarStore.Api.DTOs;
using AmarStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AmarStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("visit")]
    public async Task<IActionResult> LogVisit([FromBody] VisitLogRequest? req)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = Request.Headers.UserAgent.ToString();
        var path = req?.Path ?? "/";

        var log = new VisitorLog
        {
            IpAddress = ip,
            UserAgent = userAgent.Length > 255 ? userAgent[..255] : userAgent,
            Path = path,
            VisitedAt = DateTime.UtcNow
        };

        _context.VisitorLogs.Add(log);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPost("order-intent")]
    public async Task<IActionResult> RecordOrderIntent([FromBody] RecordOrderIntentRequest req)
    {
        int? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var intent = new OrderIntent
        {
            ProductId = req.ProductId,
            OrderType = req.OrderType,
            CustomerPhone = req.CustomerPhone,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.OrderIntents.Add(intent);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary()
    {
        var totalVisitors = await _context.VisitorLogs.CountAsync();
        var totalUsers = await _context.Users.CountAsync();
        var totalProducts = await _context.Products.CountAsync();
        var totalOrderClicks = await _context.OrderIntents.CountAsync();
        var whatsAppClicks = await _context.OrderIntents.CountAsync(o => o.OrderType == "WhatsApp");
        var phoneCallClicks = await _context.OrderIntents.CountAsync(o => o.OrderType == "Phone");

        var recentIntents = await _context.OrderIntents
            .Include(o => o.Product)
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(15)
            .Select(o => new RecentOrderIntentDto(
                o.Id,
                o.Product != null ? o.Product.Name : "منتج غير محدد",
                o.Product != null ? o.Product.Category : "-",
                o.Product != null ? o.Product.Price : 0,
                o.OrderType,
                o.User != null ? o.User.FullName : "عميل زائر",
                o.User != null ? o.User.Email : (o.CustomerPhone ?? "-"),
                o.CreatedAt
            ))
            .ToListAsync();

        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(25)
            .Select(u => new RegisteredUserDto(
                u.Id,
                u.FullName,
                u.Email,
                u.Provider,
                u.Role,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(new AnalyticsSummaryDto(
            totalVisitors,
            totalUsers,
            totalProducts,
            totalOrderClicks,
            whatsAppClicks,
            phoneCallClicks,
            recentIntents,
            recentUsers
        ));
    }
}

public record VisitLogRequest(string? Path);
