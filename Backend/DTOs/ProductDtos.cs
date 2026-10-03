using System.ComponentModel.DataAnnotations;

namespace InventoryApi.DTOs;

public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Price must be greater than 0.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Quantity must be greater than or equal to 0.")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters.")]
    public string Category { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Low stock threshold cannot be negative.")]
    public int LowStockThreshold { get; set; } = 10;
}

public class UpdateProductDto
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Price must be greater than 0.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Quantity must be greater than or equal to 0.")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters.")]
    public string Category { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Low stock threshold cannot be negative.")]
    public int LowStockThreshold { get; set; } = 10;
}

public class StockUpdateDto
{
    /// <summary>
    /// Type of operation: "add", "remove", or "set". If omitted, QuantityChange is applied directly.
    /// </summary>
    public string? Action { get; set; }

    /// <summary>
    /// Positive amount to add, remove, or set.
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Amount cannot be negative.")]
    public int? Amount { get; set; }

    /// <summary>
    /// Direct change (+/- int). Used if Action is not specified.
    /// </summary>
    public int? QuantityChange { get; set; }
}

public class ProductResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string Category { get; set; } = string.Empty;
    public int LowStockThreshold { get; set; }
    public bool IsLowStock => Quantity <= LowStockThreshold;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
