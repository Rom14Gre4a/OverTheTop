using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OverTheTop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(IWebHostEnvironment env) : ControllerBase
{
    private string LogsPath => Path.Combine(env.ContentRootPath, "logs");

    [HttpGet("logs")]
    public IActionResult GetLogs([FromQuery] int lines = 500, [FromQuery] string? level = null)
    {
        if (!Directory.Exists(LogsPath))
            return Ok(new { entries = Array.Empty<object>() });

        var files = Directory.GetFiles(LogsPath, "app-*.log")
            .OrderDescending()
            .Take(3)
            .OrderBy(f => f)
            .ToList();

        if (files.Count == 0)
            return Ok(new { entries = Array.Empty<object>() });

        var rawLines = new List<string>();
        foreach (var file in files)
        {
            using var stream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var reader = new StreamReader(stream);
            rawLines.AddRange(
                reader.ReadToEnd().Split('\n', StringSplitOptions.RemoveEmptyEntries));
        }

        var entries = rawLines
            .Select(ParseLine)
            .OfType<LogEntry>()
            .Where(e => level == null ||
                        e.Level.Equals(level, StringComparison.OrdinalIgnoreCase))
            .TakeLast(lines)
            .ToList();

        return Ok(new { entries, total = entries.Count });
    }

    private static LogEntry? ParseLine(string line)
    {
        var parts = line.Split('|', 4);
        if (parts.Length < 3) return null;

        return new LogEntry(
            parts[0].Trim(),
            parts[1].Trim(),
            parts[2].Trim(),
            parts.Length > 3 ? parts[3].Trim() : "");
    }

    private record LogEntry(string Timestamp, string Level, string Logger, string Message);
}
