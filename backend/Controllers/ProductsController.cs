using AmarStore.Api.Data;
using AmarStore.Api.DTOs;
using AmarStore.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] bool? availableOnly)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower) || p.Description.ToLower().Contains(searchLower));
        }

        if (availableOnly.HasValue && availableOnly.Value)
        {
            query = query.Where(p => p.IsAvailable);
        }

        var rawProducts = await query
            .OrderByDescending(p => p.IsFeatured)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        var products = rawProducts.Select(p => new ProductDto(
            p.Id,
            p.Name,
            p.Category,
            p.Description,
            p.Price,
            p.OldPrice,
            p.Quantity,
            p.ImageUrl,
            ParseImages(p.ImageUrl, p.ImagesJson),
            p.IsAvailable,
            p.IsFeatured,
            p.CreatedAt)).ToList();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var p = await _context.Products.FindAsync(id);
        if (p == null) return NotFound(new { message = "المنتج غير موجود" });

        return Ok(new ProductDto(
            p.Id,
            p.Name,
            p.Category,
            p.Description,
            p.Price,
            p.OldPrice,
            p.Quantity,
            p.ImageUrl,
            ParseImages(p.ImageUrl, p.ImagesJson),
            p.IsAvailable,
            p.IsFeatured,
            p.CreatedAt));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest req)
    {
        var imagesList = req.Images != null && req.Images.Count > 0 
            ? req.Images.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() 
            : new List<string>();

        var primaryImg = !string.IsNullOrWhiteSpace(req.ImageUrl)
            ? req.ImageUrl.Trim()
            : (imagesList.Count > 0 ? imagesList[0] : "logo.png");

        if (imagesList.Count > 0 && !imagesList.Contains(primaryImg))
        {
            imagesList.Insert(0, primaryImg);
        }

        var product = new Product
        {
            Name = req.Name.Trim(),
            Category = req.Category.Trim(),
            Description = req.Description.Trim(),
            Price = req.Price,
            OldPrice = req.OldPrice,
            Quantity = req.Quantity.HasValue && req.Quantity.Value >= 0 ? req.Quantity.Value : 1,
            ImageUrl = primaryImg,
            ImagesJson = System.Text.Json.JsonSerializer.Serialize(imagesList),
            IsAvailable = req.IsAvailable,
            IsFeatured = req.IsFeatured,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await contextSaveWithRetry();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.Description,
            product.Price,
            product.OldPrice,
            product.Quantity,
            product.ImageUrl,
            ParseImages(product.ImageUrl, product.ImagesJson),
            product.IsAvailable,
            product.IsFeatured,
            product.CreatedAt));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] UpdateProductRequest req)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "المنتج غير موجود" });

        var imagesList = req.Images != null && req.Images.Count > 0 
            ? req.Images.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() 
            : new List<string>();

        var primaryImg = !string.IsNullOrWhiteSpace(req.ImageUrl)
            ? req.ImageUrl.Trim()
            : (imagesList.Count > 0 ? imagesList[0] : (string.IsNullOrWhiteSpace(product.ImageUrl) ? "logo.png" : product.ImageUrl));

        if (imagesList.Count > 0 && !imagesList.Contains(primaryImg))
        {
            imagesList.Insert(0, primaryImg);
        }

        product.Name = req.Name.Trim();
        product.Category = req.Category.Trim();
        product.Description = req.Description.Trim();
        product.Price = req.Price;
        product.OldPrice = req.OldPrice;
        if (req.Quantity.HasValue)
        {
            product.Quantity = req.Quantity.Value;
        }
        product.ImageUrl = primaryImg;
        product.ImagesJson = System.Text.Json.JsonSerializer.Serialize(imagesList);
        product.IsAvailable = req.IsAvailable;
        product.IsFeatured = req.IsFeatured;

        await contextSaveWithRetry();

        return Ok(new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.Description,
            product.Price,
            product.OldPrice,
            product.Quantity,
            product.ImageUrl,
            ParseImages(product.ImageUrl, product.ImagesJson),
            product.IsAvailable,
            product.IsFeatured,
            product.CreatedAt));
    }

    private async Task contextSaveWithRetry()
    {
        await _context.SaveChangesAsync();
    }

    private static List<string> ParseImages(string imageUrl, string? imagesJson)
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
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "المنتج غير موجود" });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
