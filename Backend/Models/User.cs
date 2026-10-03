using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InventoryApi.Models;

[BsonIgnoreExtraElements]
public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("Username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("PasswordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("Role")]
    public string Role { get; set; } = "Admin";

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}