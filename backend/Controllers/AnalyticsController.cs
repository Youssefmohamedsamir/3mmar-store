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

        var totalPiecesSold = await _context.SaleRecords.SumAsync(s => (int?)s.QuantitySold) ?? 0;
        var totalRevenue = await _context.SaleRecords.SumAsync(s => (decimal?)s.TotalRevenue) ?? 0;
        var totalProfit = await _context.SaleRecords.SumAsync(s => (decimal?)s.TotalProfit) ?? 0;

        var recentSales = await _context.SaleRecords
            .AsNoTracking()
            .OrderByDescending(s => s.SoldAt)
            .Take(20)
            .Select(s => new SaleRecordDto(
                s.Id,
                s.ProductId,
                s.ProductName,
                s.QuantitySold,
                s.SalePrice,
                s.CostPrice,
                s.TotalRevenue,
                s.TotalProfit,
                s.CustomerName,
                s.CustomerPhone,
                s.Notes,
                s.SoldAt
            ))
            .ToListAsync();

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
            totalPiecesSold,
            totalRevenue,
            totalProfit,
            recentIntents,
            recentUsers,
            recentSales
        ));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("sales")]
    public async Task<ActionResult<SaleRecordDto>> RecordSale([FromBody] RecordSaleRequest req)
    {
        if (req.QuantitySold <= 0)
        {
            return BadRequest(new { message = "يرجى تحديد كمية مباعة صحيحة (1 أو أكثر)" });
        }
        if (req.SalePrice < 0)
        {
            return BadRequest(new { message = "سعر البيع لا يمكن أن يكون سالباً" });
        }

        string productName = req.ProductName?.Trim() ?? "منتج مخصص";
        if (req.ProductId.HasValue && req.ProductId.Value > 0)
        {
            var product = await _context.Products.FindAsync(req.ProductId.Value);
            if (product != null)
            {
                productName = product.Name;
                product.Quantity = Math.Max(0, product.Quantity - req.QuantitySold);
                if (product.Quantity == 0)
                {
                    product.IsAvailable = false;
                }
            }
        }

        var totalRev = req.QuantitySold * req.SalePrice;
        var totalProf = req.QuantitySold * (req.SalePrice - req.CostPrice);

        var sale = new SaleRecord
        {
            ProductId = req.ProductId,
            ProductName = productName,
            QuantitySold = req.QuantitySold,
            SalePrice = req.SalePrice,
            CostPrice = req.CostPrice,
            TotalRevenue = totalRev,
            TotalProfit = totalProf,
            CustomerName = req.CustomerName?.Trim(),
            CustomerPhone = req.CustomerPhone?.Trim(),
            Notes = req.Notes?.Trim(),
            SoldAt = DateTime.UtcNow
        };

        _context.SaleRecords.Add(sale);
        await _context.SaveChangesAsync();

        return Ok(new SaleRecordDto(
            sale.Id,
            sale.ProductId,
            sale.ProductName,
            sale.QuantitySold,
            sale.SalePrice,
            sale.CostPrice,
            sale.TotalRevenue,
            sale.TotalProfit,
            sale.CustomerName,
            sale.CustomerPhone,
            sale.Notes,
            sale.SoldAt
        ));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("sales/{id}")]
    public async Task<IActionResult> DeleteSale(int id)
    {
        var sale = await _context.SaleRecords.FindAsync(id);
        if (sale == null)
        {
            return NotFound(new { message = "عملية البيع غير موجودة" });
        }

        // Restore inventory if associated with a product
        if (sale.ProductId.HasValue)
        {
            var product = await _context.Products.FindAsync(sale.ProductId.Value);
            if (product != null)
            {
                product.Quantity += sale.QuantitySold;
                if (product.Quantity > 0)
                {
                    product.IsAvailable = true;
                }
            }
        }

        _context.SaleRecords.Remove(sale);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public record VisitLogRequest(string? Path);
