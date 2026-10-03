using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InventoryApi.Models;

[BsonIgnoreExtraElements]
public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("Name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("Price")]
    public decimal Price { get; set; }

    [BsonElement("Quantity")]
    public int Quantity { get; set; }

    [BsonElement("Category")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("LowStockThreshold")]
    public int LowStockThreshold { get; set; } = 10;

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}