using AmarStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Safe column check for ImagesJson & Quantity in SQLite
        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE Products ADD COLUMN ImagesJson TEXT DEFAULT '';");
        }
        catch
        {
            // Column already exists
        }

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE Products ADD COLUMN Quantity INTEGER DEFAULT 1;");
        }
        catch
        {
            // Column already exists
        }

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

        // Ensure Primary Admin User always exists and has role Admin with password 123456789
        var primaryEmail = "amary212005@gmail.com";
        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == primaryEmail);
        if (existingAdmin == null)
        {
            var admin = new User
            {
                FullName = "عمار (Admin)",
                Email = primaryEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789"),
                Role = "Admin",
                Provider = "Local",
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }
        else
        {
            existingAdmin.Role = "Admin";
            if (!BCrypt.Net.BCrypt.Verify("123456789", existingAdmin.PasswordHash))
            {
                existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789");
            }
            await context.SaveChangesAsync();
        }
    }
}
