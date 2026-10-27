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
        var rawOffers = await _context.Offers
            .AsNoTracking()
            .Where(o => o.IsActive)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var offers = rawOffers.Select(o => new OfferDto(
            o.Id,
            o.Title,
            o.Description,
            o.BadgeText,
            o.ImageUrl,
            ParseImages(o.ImageUrl, o.ImagesJson),
            o.ActionUrl,
            o.IsActive)).ToList();

        return Ok(offers);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<OfferDto>>> GetAllOffersAdmin()
    {
        var rawOffers = await _context.Offers
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var offers = rawOffers.Select(o => new OfferDto(
            o.Id,
            o.Title,
            o.Description,
            o.BadgeText,
            o.ImageUrl,
            ParseImages(o.ImageUrl, o.ImagesJson),
            o.ActionUrl,
            o.IsActive)).ToList();

        return Ok(offers);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<OfferDto>> CreateOffer([FromBody] CreateOfferRequest req)
    {
        var imagesList = req.Images != null && req.Images.Count > 0 
            ? req.Images.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() 
            : new List<string>();

        var primaryImg = !string.IsNullOrWhiteSpace(req.ImageUrl)
            ? req.ImageUrl.Trim()
            : (imagesList.Count > 0 ? imagesList[0] : null);

        if (!string.IsNullOrWhiteSpace(primaryImg) && !imagesList.Contains(primaryImg))
        {
            imagesList.Insert(0, primaryImg);
        }

        var offer = new Offer
        {
            Title = req.Title.Trim(),
            Description = req.Description.Trim(),
            BadgeText = req.BadgeText.Trim(),
            ImageUrl = primaryImg,
            ImagesJson = System.Text.Json.JsonSerializer.Serialize(imagesList),
            ActionUrl = req.ActionUrl ?? "#products",
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        return Ok(new OfferDto(offer.Id, offer.Title, offer.Description, offer.BadgeText, offer.ImageUrl, imagesList, offer.ActionUrl, offer.IsActive));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<OfferDto>> UpdateOffer(int id, [FromBody] UpdateOfferRequest req)
    {
        var offer = await _context.Offers.FindAsync(id);
        if (offer == null) return NotFound(new { message = "العرض غير موجود" });

        var imagesList = req.Images != null && req.Images.Count > 0 
            ? req.Images.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() 
            : new List<string>();

        var primaryImg = !string.IsNullOrWhiteSpace(req.ImageUrl)
            ? req.ImageUrl.Trim()
            : (imagesList.Count > 0 ? imagesList[0] : offer.ImageUrl);

        if (!string.IsNullOrWhiteSpace(primaryImg) && !imagesList.Contains(primaryImg))
        {
            imagesList.Insert(0, primaryImg);
        }

        offer.Title = req.Title.Trim();
        offer.Description = req.Description.Trim();
        offer.BadgeText = req.BadgeText.Trim();
        offer.ImageUrl = primaryImg;
        offer.ImagesJson = System.Text.Json.JsonSerializer.Serialize(imagesList);
        offer.ActionUrl = req.ActionUrl;
        offer.IsActive = req.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new OfferDto(offer.Id, offer.Title, offer.Description, offer.BadgeText, offer.ImageUrl, imagesList, offer.ActionUrl, offer.IsActive));
    }

    private static List<string> ParseImages(string? imageUrl, string? imagesJson)
    {
        var list = new List<string>();
        if (!string.IsNullOrWhiteSpace(imagesJson))
        {
            try
            {
                var deserialized = System.Text.Json.JsonSerializer.Deserialize<List<string>>(imagesJson);
                if (deserialized != null)
                {
                    list.AddRange(deserialized.Where(x => !string.IsNullOrWhiteSpace(x)));
                }
            }
            catch { }
        }

        if (!string.IsNullOrWhiteSpace(imageUrl) && !list.Contains(imageUrl))
        {
            list.Insert(0, imageUrl);
        }
        return list;
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
