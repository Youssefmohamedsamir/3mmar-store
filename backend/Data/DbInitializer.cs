using AmarStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Ensure SaleRecords table exists
        await context.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleRecords')
            BEGIN
                CREATE TABLE SaleRecords (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    ProductId INT NULL,
                    ProductName NVARCHAR(255) NOT NULL,
                    QuantitySold INT NOT NULL DEFAULT 1,
                    SalePrice DECIMAL(18,2) NOT NULL DEFAULT 0,
                    CostPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
                    TotalRevenue DECIMAL(18,2) NOT NULL DEFAULT 0,
                    TotalProfit DECIMAL(18,2) NOT NULL DEFAULT 0,
                    CustomerName NVARCHAR(255) NULL,
                    CustomerPhone NVARCHAR(100) NULL,
                    Notes NVARCHAR(MAX) NULL,
                    SoldAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                );
            END
        ");

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
