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

        var products = await query
            .OrderByDescending(p => p.IsFeatured)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Category,
                p.Description,
                p.Price,
                p.OldPrice,
                p.ImageUrl,
                p.IsAvailable,
                p.IsFeatured,
                p.CreatedAt))
            .ToListAsync();

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
            p.ImageUrl,
            p.IsAvailable,
            p.IsFeatured,
            p.CreatedAt));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest req)
    {
        var product = new Product
        {
            Name = req.Name.Trim(),
            Category = req.Category.Trim(),
            Description = req.Description.Trim(),
            Price = req.Price,
            OldPrice = req.OldPrice,
            ImageUrl = string.IsNullOrWhiteSpace(req.ImageUrl)
                ? "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80"
                : req.ImageUrl.Trim(),
            IsAvailable = req.IsAvailable,
            IsFeatured = req.IsFeatured,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.Description,
            product.Price,
            product.OldPrice,
            product.ImageUrl,
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

        product.Name = req.Name.Trim();
        product.Category = req.Category.Trim();
        product.Description = req.Description.Trim();
        product.Price = req.Price;
        product.OldPrice = req.OldPrice;
        product.ImageUrl = req.ImageUrl.Trim();
        product.IsAvailable = req.IsAvailable;
        product.IsFeatured = req.IsFeatured;

        await _context.SaveChangesAsync();

        return Ok(new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.Description,
            product.Price,
            product.OldPrice,
            product.ImageUrl,
            product.IsAvailable,
            product.IsFeatured,
            product.CreatedAt));
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
