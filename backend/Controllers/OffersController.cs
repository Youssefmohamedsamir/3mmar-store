using AmarStore.Api.Data;
using AmarStore.Api.DTOs;
using AmarStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OffersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OffersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OfferDto>>> GetOffers()
    {
        var offers = await _context.Offers
            .Where(o => o.IsActive)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferDto(
                o.Id,
                o.Title,
                o.Description,
                o.BadgeText,
                o.ImageUrl,
                o.ActionUrl,
                o.IsActive))
            .ToListAsync();

        return Ok(offers);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<OfferDto>>> GetAllOffersAdmin()
    {
        var offers = await _context.Offers
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferDto(
                o.Id,
                o.Title,
                o.Description,
                o.BadgeText,
                o.ImageUrl,
                o.ActionUrl,
                o.IsActive))
            .ToListAsync();

        return Ok(offers);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<OfferDto>> CreateOffer([FromBody] CreateOfferRequest req)
    {
        var offer = new Offer
        {
            Title = req.Title.Trim(),
            Description = req.Description.Trim(),
            BadgeText = req.BadgeText.Trim(),
            ImageUrl = req.ImageUrl,
            ActionUrl = req.ActionUrl ?? "#products",
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        return Ok(new OfferDto(offer.Id, offer.Title, offer.Description, offer.BadgeText, offer.ImageUrl, offer.ActionUrl, offer.IsActive));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<OfferDto>> UpdateOffer(int id, [FromBody] CreateOfferRequest req)
    {
        var offer = await _context.Offers.FindAsync(id);
        if (offer == null) return NotFound(new { message = "العرض غير موجود" });

        offer.Title = req.Title.Trim();
        offer.Description = req.Description.Trim();
        offer.BadgeText = req.BadgeText.Trim();
        offer.ImageUrl = req.ImageUrl;
        offer.ActionUrl = req.ActionUrl;
        offer.IsActive = req.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new OfferDto(offer.Id, offer.Title, offer.Description, offer.BadgeText, offer.ImageUrl, offer.ActionUrl, offer.IsActive));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteOffer(int id)
    {
        var offer = await _context.Offers.FindAsync(id);
        if (offer == null) return NotFound(new { message = "العرض غير موجود" });

        _context.Offers.Remove(offer);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
