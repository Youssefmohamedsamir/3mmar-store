namespace AmarStore.Api.Models;

public class SaleRecord
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; } = 1;
    public decimal SalePrice { get; set; } // سعر البيع للقطعة
    public decimal CostPrice { get; set; } // سعر التكلفة للقطعة
    public decimal TotalRevenue { get; set; } // إجمالي المبيعات = QuantitySold * SalePrice
    public decimal TotalProfit { get; set; } // صافي الربح = QuantitySold * (SalePrice - CostPrice)
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Notes { get; set; }
    public DateTime SoldAt { get; set; } = DateTime.UtcNow;
}
