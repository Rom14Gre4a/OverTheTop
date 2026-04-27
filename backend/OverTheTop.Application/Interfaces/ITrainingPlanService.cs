using OverTheTop.Application.DTOs.Training;
using OverTheTop.Domain.Enums;

namespace OverTheTop.Application.Interfaces;

public interface ITrainingPlanService
{
    Task<List<ExerciseDto>> GetExercisesAsync(ExerciseStyle? style = null);
    Task<List<MacroperiodDto>> GetMacroperiodsByAthleteAsync(Guid athleteId);
    Task<MacroperiodDto?> GetMacroperiodAsync(Guid id, Guid athleteId);
    Task<MacroperiodDto> CreateMacroperiodAsync(Guid athleteId, CreateMacroperiodDto dto);
    Task DeleteMacroperiodAsync(Guid id, Guid athleteId);
}
