using InventoryApi.Models;

namespace InventoryApi.Services;

public interface ITokenService
{
    string GenerateToken(User user, out DateTime expiresAt);
}
