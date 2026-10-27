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
                new() { Key = "StoreName", Value = "متجر عمار للهواتف والإكسسوارات", Description = "اسم المتجر الرسمي" },
                new() { Key = "Phone", Value = "+201000000000", Description = "رقم هاتف الاتصال المباشر" },
                new() { Key = "WhatsApp", Value = "201000000000", Description = "رقم الواتساب لاستقبال الطلبات بدون إشارات أو مسافات" },
                new() { Key = "FacebookUrl", Value = "https://facebook.com", Description = "رابط صفحة الفيسبوك الرسمية" },
                new() { Key = "InstagramUrl", Value = "https://instagram.com", Description = "رابط حساب الانستجرام الرسمي" },
                new() { Key = "TikTokUrl", Value = "https://tiktok.com", Description = "رابط حساب التيك توك الرسمي" },
                new() { Key = "WelcomeMessage", Value = "مرحباً بكم في متجر عمار - بوابتك لأحدث الهواتف الذكية والإكسسوارات الأصلية بضمان شامل وأفضل الأسعار", Description = "الرسالة الترحيبية في الواجهة" },
                new() { Key = "Address", Value = "جمهورية مصر العربية - القاهرة", Description = "عنوان المتجر" }
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

        // Seed Products if none
        if (!await context.Products.AnyAsync())
        {
            var sampleProducts = new List<Product>
            {
                // iPhone
                new()
                {
                    Name = "iPhone 16 Pro Max 256GB - Desert Titanium",
                    Category = "IPhone",
                    Description = "شاشة Super Retina XDR مقاس 6.9 بوصة مع ProMotion، معالج A18 Pro الجبار، كاميرا 48MP مع تقريب بصري 5x، وزر التحكم الجديد في الكاميرا.",
                    Price = 72500m,
                    OldPrice = 75000m,
                    ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "iPhone 16 128GB - Teal",
                    Category = "IPhone",
                    Description = "شاشة OLED مقاس 6.1 بوصة، معالج A18، دعم Apple Intelligence المتقدم، كاميرا مزدوجة متطورة مع وضع الماكرو وتصميم زجاجي فريد.",
                    Price = 51000m,
                    OldPrice = 53500m,
                    ImageUrl = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "iPhone 15 Pro 128GB - Natural Titanium",
                    Category = "IPhone",
                    Description = "هيكل خفيف من التيتانيوم المتين، شاشة 120Hz ProMotion، معالج A17 Pro المخصص للألعاب الضخمة، ومنفذ USB-C فائق السرعة.",
                    Price = 58000m,
                    OldPrice = 61000m,
                    ImageUrl = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = false
                },

                // Android
                new()
                {
                    Name = "Samsung Galaxy S24 Ultra 512GB - Titanium Black",
                    Category = "Android",
                    Description = "معالج Snapdragon 8 Gen 3، شاشة Dynamic AMOLED 2X مسطحة تدعم القلم S Pen، وميزات Galaxy AI للترجمة الفورية وتعديل الصور.",
                    Price = 64000m,
                    OldPrice = 68000m,
                    ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "Google Pixel 9 Pro XL 256GB - Obsidian",
                    Category = "Android",
                    Description = "أفضل نظام تصوير وكاميرات معالجة بالذكاء الاصطناعي مع شريحة Google Tensor G4، شاشة Super Actua ساطعة وتحديثات نظام تدوم 7 سنوات.",
                    Price = 54000m,
                    OldPrice = 57000m,
                    ImageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "Xiaomi 14 Ultra 512GB - Leica Optics",
                    Category = "Android",
                    Description = "وحش التصوير الاحترافي بمستشعر كاميرا 1 إنش وعدسات Leica الألمانية، شاشة WQHD+ AMOLED، وشحن خارق 90 واط سلكي و80 واط لاسلكي.",
                    Price = 56000m,
                    OldPrice = 59500m,
                    ImageUrl = "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = false
                },

                // Accessories
                new()
                {
                    Name = "سماعات Apple AirPods Pro (الجيل الثاني) Type-C",
                    Category = "Accessories",
                    Description = "عزل ضوضاء نشط مضاعف، وضع شفافية الصوت التكيفي، صوت مكاني مخصص مع تتبع حركي للرأس، وعلبة شحن MagSafe مع مكبر صوت مدمج.",
                    Price = 11800m,
                    OldPrice = 12900m,
                    ImageUrl = "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "شاحن Anker 67W GaN ثلاثي المنافذ فائق السرعة",
                    Category = "Accessories",
                    Description = "تقنية GaNPrime الذكية لشحن اللابتوب والهاتف والملحقات في وقت واحد بكفاءة عالية وحجم مدمج وحماية متكاملة ضد ارتفاع الحرارة.",
                    Price = 2450m,
                    OldPrice = 2800m,
                    ImageUrl = "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "كفر حماية Apple MagSafe الأصلي من السيليكون",
                    Category = "Accessories",
                    Description = "ملمس ناعم كالحرير مع بطانة داخلية من المايكروفايبر، ومغناطيسات مدمجة تتوافق بسلاسة مع كافة ملحقات وشواحن MagSafe.",
                    Price = 1650m,
                    OldPrice = 1900m,
                    ImageUrl = "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = false
                },

                // Other
                new()
                {
                    Name = "ساعة Apple Watch Series 10 (مقاس 46mm)",
                    Category = "Other",
                    Description = "أنحف ساعة آبل على الإطلاق مع أكبر مساحة شاشة زجاجية، شحن سريع فائق، مراقبة متقدمة لصحة القلب ومستويات الأكسجين والنوم.",
                    Price = 23900m,
                    OldPrice = 25500m,
                    ImageUrl = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "تابلت iPad Air M2 مقاس 11 بوصة 128GB Wi-Fi",
                    Category = "Other",
                    Description = "قوة خيالية مع معالج Apple M2، شاشة Liquid Retina خلابة مضادة للانعكاس، كاميرا أمامية في الحافة الأفقية ودعم Apple Pencil Pro الجديد.",
                    Price = 36500m,
                    OldPrice = 39000m,
                    ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = true
                },
                new()
                {
                    Name = "ساعة Samsung Galaxy Watch Ultra 47mm LTE",
                    Category = "Other",
                    Description = "تصميم تيتانيوم من الفئة العسكرية يتحمل أقسى الظروف والغطس حتى 100 متر، مع بطارية تدوم حتى 100 ساعة ودقة GPS مزدوج التردد.",
                    Price = 28500m,
                    OldPrice = 31000m,
                    ImageUrl = "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
                    IsAvailable = true,
                    IsFeatured = false
                }
            };

            await context.Products.AddRangeAsync(sampleProducts);
            await context.SaveChangesAsync();
        }

        // Seed Offers
        if (!await context.Offers.AnyAsync())
        {
            var sampleOffers = new List<Offer>
            {
                new()
                {
                    Title = "عروض الإطلاق الحصرية - متجر عمار",
                    Description = "احصل على شاحن أصلي سريع مجاناً وحماية للشاشة عند شراء أي هاتف آيفون أو سامسونج فئة رائدة، مع ضمان استبدال فوري.",
                    BadgeText = "عرض حصري لفترة محدودة",
                    ImageUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
                    ActionUrl = "#products",
                    IsActive = true
                },
                new()
                {
                    Title = "خصومات تصل إلى 25% على جميع الإكسسوارات الأصلية",
                    Description = "سماعات، شواحن ذكية، بنوك طاقة، وكفرات MagSafe من أشهر الماركات العالمية (Apple, Anker, Joyroom) بأسعار تنافسية لا تقارن.",
                    BadgeText = "تخفيض 25%",
                    ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
                    ActionUrl = "#products",
                    IsActive = true
                }
            };

            await context.Offers.AddRangeAsync(sampleOffers);
            await context.SaveChangesAsync();
        }
    }
}
