using AmarStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Seed Store Settings
        if (!await context.StoreSettings.AnyAsync())
        {
            var defaultSettings = new List<StoreSetting>
            {
                new() { Key = "StoreName", Value = "3mmar Store", Description = "اسم المتجر الرسمي" },
                new() { Key = "Phone", Value = "+201044858440", Description = "رقم هاتف الاتصال المباشر" },
                new() { Key = "WhatsApp", Value = "201044858440", Description = "رقم الواتساب لاستقبال الطلبات بدون إشارات أو مسافات" },
                new() { Key = "FacebookUrl", Value = "https://facebook.com", Description = "رابط صفحة الفيسبوك الرسمية" },
                new() { Key = "InstagramUrl", Value = "https://instagram.com", Description = "رابط حساب الانستجرام الرسمي" },
                new() { Key = "TikTokUrl", Value = "https://tiktok.com", Description = "رابط حساب التيك توك الرسمي" },
                new() { Key = "WelcomeMessage", Value = "مرحباً بكم في 3mmar Store", Description = "الرسالة الترحيبية في الواجهة" },
                new() { Key = "Address", Value = "مدينة السادات", Description = "عنوان المتجر" }
            };

            await context.StoreSettings.AddRangeAsync(defaultSettings);
            await context.SaveChangesAsync();
        }

        // Seed Primary Admin User
        if (!await context.Users.AnyAsync(u => u.Role == "Admin"))
        {
            var admin = new User
            {
                FullName = "عمار (Admin)",
                Email = "amary212005@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789"),
                Role = "Admin",
                Provider = "Local",
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }
    }
}
