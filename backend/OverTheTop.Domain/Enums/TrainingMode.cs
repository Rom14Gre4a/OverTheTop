namespace OverTheTop.Domain.Enums;

public enum TrainingMode
{
    Strength,    // силова: 1-5 повт, великі ваги
    Volume,      // об'ємна: 8-15 повт
    Endurance,   // витривалість: 15+ повт, короткий відпочинок
    Power,       // вибухова: швидкість + сила
    Technique,   // технічна: легко, фокус на формі
    Competition, // змагальна: пікова фаза
    Deload       // розвантаження
}
