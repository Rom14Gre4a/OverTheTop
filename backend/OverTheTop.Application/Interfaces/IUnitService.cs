using OverTheTop.Application.DTOs.Evolution;

namespace OverTheTop.Application.Interfaces;

public interface IUnitService
{
    Task<UnitDto>                 CreateAsync(CreateUnitDto dto);
    Task<UnitDto?>                GetByIdAsync(Guid id);
    Task<List<UnitDto>>           GetByWorldAsync(int worldSeed);
    Task<AssignTaskResponseDto?>  AssignTaskAsync(Guid id, AssignTaskDto dto, IReadOnlyList<PathPoint>? path = null);
}
