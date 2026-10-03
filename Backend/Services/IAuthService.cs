using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<User?> GetUserByIdAsync(string id);
    Task SeedDefaultAdminAsync();
}
