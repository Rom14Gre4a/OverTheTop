using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OverTheTop.Application.Interfaces;
using OverTheTop.Infrastructure.Data;
using OverTheTop.Infrastructure.Repositories;
using OverTheTop.Infrastructure.Services;

namespace OverTheTop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAthleteRepository, AthleteRepository>();
        services.AddScoped<ITrainingSessionRepository, TrainingSessionRepository>();
        services.AddScoped<ITournamentRepository, TournamentRepository>();
        services.AddScoped<IUserSettingsRepository, UserSettingsRepository>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITrainingPlanService, TrainingPlanService>();

        return services;
    }
}
