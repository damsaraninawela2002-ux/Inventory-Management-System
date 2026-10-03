using System.Text;
using InventoryApi.Middleware;
using InventoryApi.Services;
using InventoryApi.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Bson;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuration Settings
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<DefaultAdminSettings>(builder.Configuration.GetSection("DefaultAdmin"));

// 2. MongoDB Client & Database Registration (10 seconds ServerSelectionTimeout)
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    var clientSettings = MongoClientSettings.FromConnectionString(settings.ConnectionString);
    clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
    clientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
    return new MongoClient(clientSettings);
});

builder.Services.AddSingleton<IMongoDatabase>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(settings.DatabaseName);
});

// 3. Application Services & Background Seeder
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IDbSeeder, DbSeeder>();
builder.Services.AddHostedService<MongoSeederBackgroundService>();

// 4. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
var secretKey = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// 5. Named CORS Policy "Frontend" (Allows Vite dev ports 5173-5176 & configured origins)
var corsOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>() ?? new[]
{
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:5175", "http://127.0.0.1:5175",
    "http://localhost:5176", "http://127.0.0.1:5176",
    "http://localhost:3000", "http://127.0.0.1:3000"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .SetIsOriginAllowed(origin =>
              {
                  if (builder.Environment.IsDevelopment() && Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      // Allow any localhost/127.0.0.1 port (especially 5173-5176) during Development
                      if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                          uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }
                  }
                  return corsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
              })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 6. Swagger with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Inventory Management System API",
        Version = "v1",
        Description = "ASP.NET Core .NET 8 Web API with MongoDB & JWT Authentication"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 7. Initial attempt to seed database on startup (resilient with try/catch, will not crash app)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var seeder = scope.ServiceProvider.GetRequiredService<IDbSeeder>();
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning("Initial database seeding deferred to background retry service: {Message}", ex.Message);
    }
}

// 8. HTTP Pipeline Configuration
app.UseMiddleware<ExceptionMiddleware>();

// Enable Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory Management API v1");
    c.RoutePrefix = "swagger";
});

// Only redirect to HTTPS in Production - never in Development to avoid certificate blocks
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS MUST be called BEFORE UseAuthentication and UseAuthorization
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint returning status ("ok" | "degraded") and database ("connected" | "unreachable")
app.MapGet("/api/health", async (IMongoDatabase db) =>
{
    bool isConnected = false;
    try
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        await db.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: cts.Token);
        isConnected = true;
    }
    catch
    {
        isConnected = false;
    }

    if (isConnected)
    {
        return Results.Ok(new
        {
            status = "ok",
            database = "connected"
        });
    }

    return Results.Ok(new
    {
        status = "degraded",
        database = "unreachable"
    });
}).AllowAnonymous().RequireCors("Frontend");

// Print listening and diagnostics URLs in the console on startup
app.Logger.LogInformation("=======================================================");
app.Logger.LogInformation("🚀 API is running and listening on: http://localhost:5000");
app.Logger.LogInformation("📚 Swagger Documentation: http://localhost:5000/swagger");
app.Logger.LogInformation("🩺 Health Check: http://localhost:5000/api/health");
app.Logger.LogInformation("=======================================================");

// 9. Startup port-in-use exception handling
try
{
    app.Run();
}
catch (Exception ex) when (IsAddressInUseException(ex))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("===============================================================================");
    Console.WriteLine("❌ Port 5000 is already in use.");
    Console.WriteLine("Run: netstat -ano | findstr :5000, then taskkill /PID <pid> /F");
    Console.WriteLine("Or run stop-api.bat from the Backend folder, or Backend\\stop-api.bat from the project root.");
    Console.WriteLine("===============================================================================");
    Console.ResetColor();
    Environment.Exit(1);
}

static bool IsAddressInUseException(Exception ex)
{
    var current = ex;
    while (current != null)
    {
        if (current is System.Net.Sockets.SocketException sockEx && sockEx.SocketErrorCode == System.Net.Sockets.SocketError.AddressAlreadyInUse)
            return true;
        if (current.Message.Contains("address already in use", StringComparison.OrdinalIgnoreCase))
            return true;
        current = current.InnerException;
    }
    return false;
}
