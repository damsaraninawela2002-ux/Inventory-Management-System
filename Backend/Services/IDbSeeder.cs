namespace InventoryApi.Services;

public interface IDbSeeder
{
    bool IsSeeded { get; }
    Task<bool> SeedAsync();
}
