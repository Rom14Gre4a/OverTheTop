namespace OverTheTop.Application.Factions;

/// <param name="ResourceKind">0=Food 1=Wood 2=Stone 3=Energy 4=Gems 5=Oil 6=Ore</param>
/// <param name="Multiplier">1.5 = +50% yield, 0.6 = –40% yield</param>
public sealed record FactionBonus(int ResourceKind, string ResourceName, double Multiplier);
