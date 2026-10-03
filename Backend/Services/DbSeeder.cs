using System.Net.Sockets;
using System.Text.RegularExpressions;
using InventoryApi.Models;
using InventoryApi.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace InventoryApi.Services;

public class DbSeeder : IDbSeeder
{
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _mongoSettings;
    private readonly DefaultAdminSettings _adminSettings;
    private readonly ILogger<DbSeeder> _logger;

    public static bool IsDatabaseSeeded { get; private set; }
    public bool IsSeeded => IsDatabaseSeeded;

    public DbSeeder(
        IMongoDatabase database,
        IOptions<MongoDbSettings> mongoSettings,
        IOptions<DefaultAdminSettings> adminSettings,
        ILogger<DbSeeder> logger)
    {
        _database = database;
        _mongoSettings = mongoSettings.Value;
        _adminSettings = adminSettings.Value;
        _logger = logger;
    }

    private static string? _lastLoggedError;

    public async Task<bool> SeedAsync()
    {
        if (IsSeeded) return true;

        // 1. Ping MongoDB
        try
        {
            var pingCommand = new BsonDocument("ping", 1);
            await _database.RunCommandAsync<BsonDocument>(pingCommand);
            _lastLoggedError = null;
            _logger.LogInformation("MongoDB ping successful: connected to database '{DatabaseName}'.", _mongoSettings.DatabaseName);
        }
        catch (Exception ex)
        {
            string errorMessage;
            if (IsDnsResolutionException(ex))
            {
                // Problem 2 requirement: Log ONE clear message without printing the cluster-state dump
                errorMessage = "Cannot resolve MongoDB Atlas hostname. Check internet/VPN and set the Windows DNS to 8.8.8.8 / 8.8.4.4, then run ipconfig /flushdns.";
            }
            else if (ex is MongoAuthenticationException)
            {
                errorMessage = "MongoDB connection failed: Authentication failed. Please check your username and password in ConnectionString in appsettings.json. If your password contains special characters (@, :, /, ?, #, etc.), they MUST be URL-encoded.";
            }
            else if (ex is TimeoutException || ex is MongoConnectionException)
            {
                errorMessage = "MongoDB connection failed: Connection timed out. This typically means your current IP address is not whitelisted in MongoDB Atlas under Network Access, or the local MongoDB server is not running.";
            }
            else
            {
                errorMessage = $"MongoDB connection failed: {ex.Message}";
            }

            // Only log at Error level if this is a new/changed error, avoiding flooding the console during background retries
            if (_lastLoggedError != errorMessage)
            {
                _logger.LogError("{Message}", errorMessage);
                _lastLoggedError = errorMessage;
            }
            else
            {
                _logger.LogDebug("Background retry: {Message}", errorMessage);
            }

            return false;
        }

        // 2. Admin Seeding
        try
        {
            var defaultUsername = string.IsNullOrWhiteSpace(_adminSettings.Username)
                ? "admin"
                : _adminSettings.Username.Trim().ToLowerInvariant();
            var defaultPassword = string.IsNullOrWhiteSpace(_adminSettings.Password)
                ? "Admin@123"
                : _adminSettings.Password;

            var usersCollection = _database.GetCollection<User>(_mongoSettings.UsersCollectionName);

            var adminFilter = Builders<User>.Filter.Regex(
                u => u.Username,
                new BsonRegularExpression($"^{Regex.Escape(defaultUsername)}$", "i")
            );

            var adminUser = await usersCollection.Find(adminFilter).FirstOrDefaultAsync();

            if (adminUser == null)
            {
                var newAdmin = new User
                {
                    Username = defaultUsername,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                };

                await usersCollection.InsertOneAsync(newAdmin);
                _logger.LogInformation("Admin user created");
            }
            else
            {
                bool isPasswordValid = false;
                try
                {
                    if (!string.IsNullOrWhiteSpace(adminUser.PasswordHash))
                    {
                        isPasswordValid = BCrypt.Net.BCrypt.Verify(defaultPassword, adminUser.PasswordHash);
                    }
                }
                catch
                {
                    isPasswordValid = false;
                }

                if (!isPasswordValid || adminUser.Role != "Admin" || adminUser.Username != defaultUsername)
                {
                    var newHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);
                    var update = Builders<User>.Update
                        .Set(u => u.PasswordHash, newHash)
                        .Set(u => u.Role, "Admin")
                        .Set(u => u.Username, defaultUsername);

                    await usersCollection.UpdateOneAsync(adminFilter, update);
                    _logger.LogInformation("Admin password hash repaired");
                }
                else
                {
                    _logger.LogInformation("Admin user already valid");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed during Admin seeding: {Message}", ex.Message);
            return false;
        }

        // 3. Products Seeding (only if empty)
        try
        {
            var productsCollection = _database.GetCollection<Product>(_mongoSettings.ProductsCollectionName);
            var productCount = await productsCollection.CountDocumentsAsync(Builders<Product>.Filter.Empty);

            if (productCount == 0)
            {
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

                await productsCollection.InsertManyAsync(sampleProducts);
                _logger.LogInformation("Sample products seeded successfully ({Count} products in '{CollectionName}')", sampleProducts.Count, _mongoSettings.ProductsCollectionName);
            }
            else
            {
                _logger.LogInformation("Products collection '{CollectionName}' already contains {Count} documents; skipping product seed", _mongoSettings.ProductsCollectionName, productCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed during Product seeding: {Message}", ex.Message);
            return false;
        }

        IsDatabaseSeeded = true;
        _logger.LogInformation("MongoDB connected, admin seeded");
        return true;
    }

    private static bool IsDnsResolutionException(Exception ex)
    {
        var current = ex;
        while (current != null)
        {
            if (current is SocketException sockEx)
            {
                if (sockEx.ErrorCode == 11001 || sockEx.ErrorCode == 11002 || sockEx.ErrorCode == 10022 ||
                    sockEx.NativeErrorCode == 11001 || sockEx.NativeErrorCode == 11002 || sockEx.NativeErrorCode == 10022 ||
                    sockEx.SocketErrorCode == SocketError.HostNotFound ||
                    sockEx.SocketErrorCode == SocketError.TryAgain)
                {
                    return true;
                }
            }

            var msg = current.Message;
            if (!string.IsNullOrEmpty(msg))
            {
                if (msg.Contains("hostname resolution", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("0x00002AFA", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("0x2AFA", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("No such host is known", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("Name or service not known", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            current = current.InnerException;
        }
        return false;
    }
}
