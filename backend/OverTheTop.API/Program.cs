using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NLog;
using NLog.Web;
using OverTheTop.API.Middleware;
using OverTheTop.Application.Interfaces;
using OverTheTop.Evolution.Hubs;
using OverTheTop.Evolution.Services;
using OverTheTop.Infrastructure;
using OverTheTop.Infrastructure.Services;

var logger = LogManager.Setup()
    .LoadConfigurationFromFile("nlog.config")
    .GetCurrentClassLogger();

logger.Info("=== OverTheTop API starting ===");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Logging.ClearProviders();
    builder.Host.UseNLog();

    builder.Services.AddControllers()
        .AddApplicationPart(typeof(OverTheTop.Evolution.Controllers.EvolutionController).Assembly);
    builder.Services.AddOpenApi();

    builder.Services.AddSingleton<MapGeneratorService>();
    builder.Services.AddSingleton<OverTheTop.Evolution.Services.ColonyStartService>();
    builder.Services.AddSingleton<OverTheTop.Evolution.Services.AStarService>();
    builder.Services.AddSingleton<OverTheTop.Evolution.Services.SimulationSpeedService>();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddScoped<IEvolutionResourceService, EvolutionResourceService>();
    builder.Services.AddScoped<IUnitService, UnitService>();
    builder.Services.AddScoped<ISimulationService, SimulationService>();
    builder.Services.AddSignalR();
    builder.Services.AddHostedService<SimulationTickService>();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                ValidAudience            = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly",  p => p.RequireRole("Admin"));
        options.AddPolicy("CoachPlus",  p => p.RequireRole("Admin", "Coach"));
        options.AddPolicy("Athlete",    p => p.RequireRole("Admin", "Coach", "Athlete"));
    });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
            policy.WithOrigins(builder.Configuration["Cors:AllowedOrigins"]!.Split(","))
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials());
    });

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();

    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<SimulationHub>("/hubs/simulation");

    logger.Info("=== OverTheTop API ready ===");

    app.Run();
}
catch (Exception ex)
{
    logger.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    LogManager.Shutdown();
}
