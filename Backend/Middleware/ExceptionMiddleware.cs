using System.Net;
using System.Text.Json;
using MongoDB.Driver;

namespace InventoryApi.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message = exception.Message;

        switch (exception)
        {
            case KeyNotFoundException:
                statusCode = (int)HttpStatusCode.NotFound;
                break;
            case ArgumentException:
            case InvalidOperationException:
                statusCode = (int)HttpStatusCode.BadRequest;
                break;
            case UnauthorizedAccessException:
                statusCode = (int)HttpStatusCode.Unauthorized;
                break;
            case TimeoutException:
            case MongoException:
                statusCode = (int)HttpStatusCode.ServiceUnavailable;
                message = "Unable to connect to MongoDB. Please ensure MongoDB is running locally (e.g., 'mongod') or configure your MongoDB Atlas connection string in appsettings.json.";
                break;
            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                break;
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            statusCode,
            message,
            details = _env.IsDevelopment() ? exception.StackTrace : null,
            timestamp = DateTime.UtcNow
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
