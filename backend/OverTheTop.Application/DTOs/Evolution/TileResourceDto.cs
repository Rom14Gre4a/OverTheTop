namespace OverTheTop.Application.DTOs.Evolution;

public sealed record TileResourceDto(
    Guid Id,
    int  X,
    int  Y,
    int  Kind,
    int  Amount,
    int  MaxAmount
);
