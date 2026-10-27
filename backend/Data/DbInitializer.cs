using AmarStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Seed Store Settings with clean defaults
        if (!await context.StoreSettings.AnyAsync())
        {
            var defaultSettings = new List<StoreSetting>
            {
                new() { Key = "StoreName", Value = "متجر عمار للهواتف والإكسسوارات", Description = "اسم المتجر الرسمي" },
                new() { Key = "Phone", Value = "+201000000000", Description = "رقم هاتف الاتصال المباشر" },
                new() { Key = "WhatsApp", Value = "201000000000", Description = "رقم الواتساب لاستقبال الطلبات بدون إشارات أو مسافات" },
                new() { Key = "FacebookUrl", Value = "https://facebook.com", Description = "رابط صفحة الفيسبوك الرسمية" },
                new() { Key = "InstagramUrl", Value = "https://instagram.com", Description = "رابط حساب الانستجرام الرسمي" },
                new() { Key = "TikTokUrl", Value = "https://tiktok.com", Description = "رابط حساب التيك توك الرسمي" },
                new() { Key = "WelcomeMessage", Value = "مرحباً بكم في متجر عمار - الوجهة الموثوقة لأحدث الهواتف الذكية والإكسسوارات الأصلية", Description = "الرسالة الترحيبية في الواجهة" },
                new() { Key = "Address", Value = "جمهورية مصر العربية", Description = "عنوان المتجر" }
            };

            await context.StoreSettings.AddRangeAsync(defaultSettings);
            await context.SaveChangesAsync();
        }

        // Seed Admin User
        if (!await context.Users.AnyAsync(u => u.Role == "Admin"))
        {
            var admin = new User
            {
                FullName = "مدير متجر عمار",
                Email = "admin@3mmarstore.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                Role = "Admin",
                Provider = "Local",
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }

        // Keep Products & Offers completely empty as requested by user.
        // The store is clean and empty for the Admin to add their real products.
    }
}
