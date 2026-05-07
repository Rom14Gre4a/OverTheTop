using OverTheTop.Application.DTOs.Training;
using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.Interfaces;

public interface ITrainingPlanService
{
    Task<List<ExerciseDto>> GetExercisesAsync(ExerciseStyle? style = null, Guid? userId = null);
    Task<bool> ToggleFavoriteAsync(Guid exerciseId, Guid userId);
    Task<List<MacroperiodDto>> GetMacroperiodsByAthleteAsync(Guid athleteId);
    Task<MacroperiodDto?> GetMacroperiodAsync(Guid id, Guid athleteId);
    Task<MacroperiodDto> CreateMacroperiodAsync(Guid athleteId, CreateMacroperiodDto dto);
    Task DeleteMacroperiodAsync(Guid id, Guid athleteId);
}
