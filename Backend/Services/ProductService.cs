using InventoryApi.DTOs;
using InventoryApi.Models;
using InventoryApi.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace InventoryApi.Services;

public class ProductService : IProductService
{
    private readonly IMongoCollection<Product> _productsCollection;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        IMongoDatabase database,
        IOptions<MongoDbSettings> mongoSettings,
        ILogger<ProductService> logger)
    {
        _logger = logger;
        _productsCollection = database.GetCollection<Product>(mongoSettings.Value.ProductsCollectionName);
    }

    public async Task<List<Product>> GetAllAsync(string? search = null, string? category = null)
    {
        var builder = Builders<Product>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchRegex = new BsonRegularExpression(search.Trim(), "i");
            filter &= builder.Regex(p => p.Name, searchRegex);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "All")
        {
            filter &= builder.Eq(p => p.Category, category.Trim());
        }

        return await _productsCollection.Find(filter).SortByDescending(p => p.UpdatedAt).ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        return await _productsCollection.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Product> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name.Trim(),
            Price = dto.Price,
            Quantity = dto.Quantity,
            Category = dto.Category.Trim(),
            LowStockThreshold = dto.LowStockThreshold >= 0 ? dto.LowStockThreshold : 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _productsCollection.InsertOneAsync(product);
        _logger.LogInformation("Created product {ProductName} with ID {ProductId}", product.Name, product.Id);
        return product;
    }

    public async Task<Product?> UpdateAsync(string id, UpdateProductDto dto)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        existing.Name = dto.Name.Trim();
        existing.Price = dto.Price;
        existing.Quantity = dto.Quantity;
        existing.Category = dto.Category.Trim();
        existing.LowStockThreshold = dto.LowStockThreshold >= 0 ? dto.LowStockThreshold : 10;
        existing.UpdatedAt = DateTime.UtcNow;

        var result = await _productsCollection.ReplaceOneAsync(p => p.Id == id, existing);
        if (result.MatchedCount == 0) return null;

        _logger.LogInformation("Updated product {ProductId}", id);
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _productsCollection.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<Product?> UpdateStockAsync(string id, StockUpdateDto dto)
    {
        var product = await GetByIdAsync(id);
        if (product == null) return null;

        int newQuantity = product.Quantity;

        if (!string.IsNullOrWhiteSpace(dto.Action))
        {
            int amount = dto.Amount ?? 0;
            switch (dto.Action.ToLower())
            {
                case "add":
                    newQuantity += amount;
                    break;
                case "remove":
                    newQuantity -= amount;
                    break;
                case "set":
                    newQuantity = amount;
                    break;
                default:
                    throw new ArgumentException($"Invalid stock action '{dto.Action}'. Supported: 'add', 'remove', 'set'.");
            }
        }
        else if (dto.QuantityChange.HasValue)
        {
            newQuantity += dto.QuantityChange.Value;
        }
        else
        {
            throw new ArgumentException("Either 'Action' with 'Amount' or 'QuantityChange' must be provided.");
        }

        if (newQuantity < 0)
        {
            throw new InvalidOperationException($"Stock cannot be negative. Current stock is {product.Quantity}, resulting in {newQuantity}.");
        }

        product.Quantity = newQuantity;
        product.UpdatedAt = DateTime.UtcNow;

        var updateDefinition = Builders<Product>.Update
            .Set(p => p.Quantity, newQuantity)
            .Set(p => p.UpdatedAt, product.UpdatedAt);

        await _productsCollection.UpdateOneAsync(p => p.Id == id, updateDefinition);
        _logger.LogInformation("Updated stock for product {ProductId}: new quantity is {Quantity}", id, newQuantity);

        return product;
    }

    public async Task<List<Product>> GetLowStockAsync()
    {
        // Low stock condition: Quantity <= LowStockThreshold
        var filter = Builders<Product>.Filter.Where(p => p.Quantity <= p.LowStockThreshold);
        return await _productsCollection.Find(filter).SortBy(p => p.Quantity).ToListAsync();
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        var categories = await _productsCollection.Distinct<string>("Category", Builders<Product>.Filter.Empty).ToListAsync();
        return categories.Where(c => !string.IsNullOrWhiteSpace(c)).OrderBy(c => c).ToList();
    }

    public async Task<object> GetDashboardStatsAsync()
    {
        var allProducts = await _productsCollection.Find(Builders<Product>.Filter.Empty).ToListAsync();

        int totalProducts = allProducts.Count;
        decimal totalStockValue = allProducts.Sum(p => p.Price * p.Quantity);
        int lowStockCount = allProducts.Count(p => p.Quantity <= p.LowStockThreshold);
        var categories = allProducts.Select(p => p.Category).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList();

        var recentLowStock = allProducts
            .Where(p => p.Quantity <= p.LowStockThreshold)
            .OrderBy(p => p.Quantity)
            .Take(5)
            .ToList();

        return new
        {
            TotalProducts = totalProducts,
            TotalStockValue = Math.Round(totalStockValue, 2),
            LowStockCount = lowStockCount,
            CategoriesCount = categories.Count,
            Categories = categories,
            RecentLowStock = recentLowStock
        };
    }

    public async Task SeedSampleProductsAsync()
    {
        try
        {
            var count = await _productsCollection.CountDocumentsAsync(Builders<Product>.Filter.Empty);
            if (count > 0) return;

            var sampleProducts = new List<Product>
            {
                new() { Name = "Logitech MX Master 3S Wireless Mouse", Category = "Electronics", Price = 99.99m, Quantity = 45, LowStockThreshold = 10, CreatedAt = DateTime.UtcNow.AddDays(-10), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Dell UltraSharp 27\" 4K Monitor", Category = "Electronics", Price = 489.50m, Quantity = 7, LowStockThreshold = 10, CreatedAt = DateTime.UtcNow.AddDays(-9), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Keychron K2 Mechanical Keyboard", Category = "Electronics", Price = 79.99m, Quantity = 3, LowStockThreshold = 8, CreatedAt = DateTime.UtcNow.AddDays(-8), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Ergonomic Mesh Office Chair", Category = "Furniture", Price = 249.00m, Quantity = 12, LowStockThreshold = 5, CreatedAt = DateTime.UtcNow.AddDays(-7), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Electric Standing Desk 60x30", Category = "Furniture", Price = 399.00m, Quantity = 4, LowStockThreshold = 6, CreatedAt = DateTime.UtcNow.AddDays(-6), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Premium Hardcover Notebook A5", Category = "Office Supplies", Price = 14.50m, Quantity = 120, LowStockThreshold = 25, CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Gel Pen 0.5mm Pack of 10", Category = "Office Supplies", Price = 8.99m, Quantity = 60, LowStockThreshold = 15, CreatedAt = DateTime.UtcNow.AddDays(-4), UpdatedAt = DateTime.UtcNow },
                new() { Name = "USB-C Multi-Port Hub 7-in-1", Category = "Electronics", Price = 39.99m, Quantity = 5, LowStockThreshold = 12, CreatedAt = DateTime.UtcNow.AddDays(-3), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Heavy Duty Steel Filing Cabinet", Category = "Furniture", Price = 179.99m, Quantity = 8, LowStockThreshold = 5, CreatedAt = DateTime.UtcNow.AddDays(-2), UpdatedAt = DateTime.UtcNow },
                new() { Name = "Document Shredder Cross-Cut", Category = "Office Supplies", Price = 89.95m, Quantity = 2, LowStockThreshold = 5, CreatedAt = DateTime.UtcNow.AddDays(-1), UpdatedAt = DateTime.UtcNow }
            };

            await _productsCollection.InsertManyAsync(sampleProducts);
            _logger.LogInformation("Seeded {Count} sample products successfully.", sampleProducts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Sample product seeding skipped or connection error: {Message}", ex.Message);
        }
    }
}
