namespace InventoryApi.Settings;

public class JwtSettings
{
    public string SecretKey { get; set; } = "InventoryManagementSuperSecretSecurityKey2026!#*";
    public string Issuer { get; set; } = "InventoryApi";
    public string Audience { get; set; } = "InventoryClient";
    public int ExpirationInHours { get; set; } = 24;
}
