namespace OverTheTop.Application.DTOs.Evolution;

public record PathPoint(int X, int Y);

public record AssignTaskResponseDto(
    UnitDto                    Unit,
    IReadOnlyList<PathPoint>?  Path
);
