using AmarStore.Api.Data;
using AmarStore.Api.DTOs;
using AmarStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SettingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<StoreSettingsDto>> GetSettings()
    {
        var settings = await _context.StoreSettings.ToDictionaryAsync(s => s.Key, s => s.Value);

        string GetVal(string key, string fallback) =>
            settings.TryGetValue(key, out var val) ? val : fallback;

        return Ok(new StoreSettingsDto(
            StoreName: GetVal("StoreName", "متجر عمار للهواتف والإكسسوارات"),
            Phone: GetVal("Phone", "+201000000000"),
            WhatsApp: GetVal("WhatsApp", "201000000000"),
            FacebookUrl: GetVal("FacebookUrl", "https://facebook.com"),
            InstagramUrl: GetVal("InstagramUrl", "https://instagram.com"),
            TikTokUrl: GetVal("TikTokUrl", "https://tiktok.com"),
            WelcomeMessage: GetVal("WelcomeMessage", "مرحباً بكم في متجر عمار للهواتف والإكسسوارات"),
            Address: GetVal("Address", "القاهرة، جمهورية مصر العربية")
        ));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<StoreSettingsDto>> UpdateSettings([FromBody] UpdateSettingsRequest req)
    {
        async Task Upsert(string key, string value, string desc)
        {
            var item = await _context.StoreSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (item == null)
            {
                _context.StoreSettings.Add(new StoreSetting { Key = key, Value = value, Description = desc });
            }
            else
            {
                item.Value = value;
                item.UpdatedAt = DateTime.UtcNow;
            }
        }

        await Upsert("StoreName", req.StoreName, "اسم المتجر");
        await Upsert("Phone", req.Phone, "رقم الهاتف للاتصال");
        await Upsert("WhatsApp", req.WhatsApp, "رقم الواتساب");
        await Upsert("FacebookUrl", req.FacebookUrl, "رابط فيسبوك");
        await Upsert("InstagramUrl", req.InstagramUrl, "رابط انستجرام");
        await Upsert("TikTokUrl", req.TikTokUrl, "رابط تيك توك");
        await Upsert("WelcomeMessage", req.WelcomeMessage, "رسالة الترحيب");
        await Upsert("Address", req.Address, "العنوان");

        await _context.SaveChangesAsync();

        return await GetSettings();
    }
}
