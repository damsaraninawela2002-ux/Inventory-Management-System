namespace InventoryApi.Settings;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "InventoryDB";
    public string ProductsCollectionName { get; set; } = "Products";
    public string UsersCollectionName { get; set; } = "Users";
}
