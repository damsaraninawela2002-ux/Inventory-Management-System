using System.Text.RegularExpressions;
using InventoryApi.DTOs;
using InventoryApi.Models;
using InventoryApi.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace InventoryApi.Services;

public class AuthService : IAuthService
{
    private readonly IMongoCollection<User> _usersCollection;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IMongoDatabase database,
        IOptions<MongoDbSettings> mongoSettings,
        ITokenService tokenService,
        ILogger<AuthService> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
        _usersCollection = database.GetCollection<User>(mongoSettings.Value.UsersCollectionName);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var trimmedUsername = loginDto.Username?.Trim() ?? string.Empty;
        var trimmedPassword = loginDto.Password?.Trim() ?? string.Empty;

        // Case-insensitive query using regex
        var filter = Builders<User>.Filter.Regex(
            u => u.Username,
            new BsonRegularExpression($"^{Regex.Escape(trimmedUsername)}$", "i")
        );

        var user = await _usersCollection.Find(filter).FirstOrDefaultAsync();

        if (user == null)
        {
            _logger.LogInformation("Authentication failed: User '{Username}' not found", trimmedUsername);
            return null;
        }

        bool isPasswordValid = false;
        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(trimmedPassword, user.PasswordHash);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("Authentication failed: Exception during BCrypt verify for '{Username}': {Error}", user.Username, ex.Message);
            isPasswordValid = false;
        }

        if (!isPasswordValid)
        {
            _logger.LogInformation("Authentication failed: Incorrect password provided for user '{Username}'", user.Username);
            return null;
        }

        var token = _tokenService.GenerateToken(user, out var expiresAt);
        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        var trimmedUsername = registerDto.Username?.Trim() ?? string.Empty;

        var filter = Builders<User>.Filter.Regex(
            u => u.Username,
            new BsonRegularExpression($"^{Regex.Escape(trimmedUsername)}$", "i")
        );

        var existingUser = await _usersCollection.Find(filter).FirstOrDefaultAsync();

        if (existingUser != null)
        {
            throw new InvalidOperationException($"User with username '{trimmedUsername}' already exists.");
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
        var newUser = new User
        {
            Username = trimmedUsername,
            PasswordHash = hashedPassword,
            Role = string.IsNullOrWhiteSpace(registerDto.Role) ? "Admin" : registerDto.Role,
            CreatedAt = DateTime.UtcNow
        };

        await _usersCollection.InsertOneAsync(newUser);
        _logger.LogInformation("New user '{Username}' registered with role '{Role}'", newUser.Username, newUser.Role);

        var token = _tokenService.GenerateToken(newUser, out var expiresAt);
        return new AuthResponseDto
        {
            Token = token,
            Username = newUser.Username,
            Role = newUser.Role,
            ExpiresAt = expiresAt
        };
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        return await _usersCollection.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    public async Task SeedDefaultAdminAsync()
    {
        // Delegated to DbSeeder for full startup synchronization
        await Task.CompletedTask;
    }
}
