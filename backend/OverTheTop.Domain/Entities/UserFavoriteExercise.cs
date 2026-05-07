namespace OverTheTop.Domain.Entities;

public class UserFavoriteExercise
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
}
