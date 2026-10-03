using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Services;

public interface IProductService
{
    Task<List<Product>> GetAllAsync(string? search = null, string? category = null);
    Task<Product?> GetByIdAsync(string id);
    Task<Product> CreateAsync(CreateProductDto dto);
    Task<Product?> UpdateAsync(string id, UpdateProductDto dto);
    Task<bool> DeleteAsync(string id);
    Task<Product?> UpdateStockAsync(string id, StockUpdateDto dto);
    Task<List<Product>> GetLowStockAsync();
    Task<List<string>> GetCategoriesAsync();
    Task<object> GetDashboardStatsAsync();
    Task SeedSampleProductsAsync();
}
