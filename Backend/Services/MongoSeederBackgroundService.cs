namespace InventoryApi.Services;

public class MongoSeederBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MongoSeederBackgroundService> _logger;

    public MongoSeederBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MongoSeederBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Periodic retry loop until database is connected and admin is seeded
        while (!stoppingToken.IsCancellationRequested)
        {
            if (DbSeeder.IsDatabaseSeeded)
            {
                break;
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            if (DbSeeder.IsDatabaseSeeded)
            {
                break;
            }

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var seeder = scope.ServiceProvider.GetRequiredService<IDbSeeder>();
                bool succeeded = await seeder.SeedAsync();
                if (succeeded)
                {
                    // Seeding completed; stop the retry loop
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Background MongoDB seeding retry encountered an issue: {Message}", ex.Message);
            }
        }
    }
}
