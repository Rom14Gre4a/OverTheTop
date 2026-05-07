using System.Net;
using System.Text.Json;
using NLog;

namespace OverTheTop.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private static readonly Logger Log = LogManager.GetCurrentClassLogger();

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Unhandled exception [{Method} {Path}]",
                context.Request.Method, context.Request.Path);

            await WriteErrorResponse(context, ex);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted) return;

        context.Response.ContentType = "application/json";

        var (status, message) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,      ex.Message),
            InvalidOperationException   => (HttpStatusCode.Conflict,          ex.Message),
            ArgumentException           => (HttpStatusCode.BadRequest,        ex.Message),
            KeyNotFoundException        => (HttpStatusCode.NotFound,          ex.Message),
            _                           => (HttpStatusCode.InternalServerError, "Внутрішня помилка сервера")
        };

        context.Response.StatusCode = (int)status;

        var body = new
        {
            statusCode = (int)status,
            message,
            timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(body,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
