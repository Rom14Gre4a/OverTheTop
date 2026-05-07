"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
}

const LEVEL_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  ERROR: { color: "#ff5252", bg: "rgba(255,82,82,0.12)",   label: "ERROR" },
  FATAL: { color: "#ff1744", bg: "rgba(255,23,68,0.18)",   label: "FATAL" },
  WARN:  { color: "#ffab40", bg: "rgba(255,171,64,0.12)",  label: "WARN"  },
  INFO:  { color: "#69ff8a", bg: "rgba(105,255,138,0.10)", label: "INFO"  },
  DEBUG: { color: "#90a4ae", bg: "rgba(144,164,174,0.08)", label: "DEBUG" },
  TRACE: { color: "#546e7a", bg: "rgba(84,110,122,0.06)",  label: "TRACE" },
};

const LEVELS = ["ALL", "FATAL", "ERROR", "WARN", "INFO", "DEBUG"];

function levelStyle(level: string) {
  return LEVEL_STYLE[level.toUpperCase()] ?? LEVEL_STYLE["DEBUG"];
}

export default function AdminPage() {
  const { accent } = useTheme();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lines, setLines] = useState(500);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ lines: String(lines) });
      if (filterLevel !== "ALL") params.set("level", filterLevel);
      const res = await api.get<{ entries: LogEntry[] }>(`/api/admin/logs?${params}`);
      setEntries([...res.data.entries].reverse());
      setError("");
    } catch {
      setError("Не вдалося завантажити логи. Перевір що бекенд запущено.");
    } finally {
      setLoading(false);
    }
  }, [filterLevel, lines]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchLogs, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLogs]);

  const visible = entries.filter(e => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.message.toLowerCase().includes(q) || e.logger.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleExpand = (i: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const hasException = (msg: string) => msg.includes("EXCEPTION:");

  const splitMessage = (msg: string) => {
    const idx = msg.indexOf(" | EXCEPTION:");
    if (idx === -1) return { main: msg, stack: null };
    return { main: msg.slice(0, idx), stack: msg.slice(idx + 3) };
  };

  const inputBase: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "0.5rem",
    color: "var(--foreground)",
    fontSize: "0.8125rem",
    outline: "none",
    padding: "0.5rem 0.75rem",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Логи сервера
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            {visible.length} записів · хронологія у зворотньому порядку
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>

          {/* Level filter */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                style={{
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  borderRadius: "0.375rem",
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderColor: filterLevel === l ? accent : "rgba(255,255,255,0.10)",
                  background: filterLevel === l ? `${accent}18` : "rgba(255,255,255,0.03)",
                  color: filterLevel === l ? accent : "rgba(255,255,255,0.4)",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            style={{ ...inputBase, flex: 1, minWidth: "12rem" }}
            placeholder="Пошук по повідомленню або логеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Lines */}
          <select
            style={{ ...inputBase, cursor: "pointer" }}
            value={lines}
            onChange={e => setLines(Number(e.target.value))}
          >
            {[100, 250, 500, 1000].map(n => (
              <option key={n} value={n} style={{ background: "#111113" }}>Останні {n}</option>
            ))}
          </select>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "0.5rem",
              border: `1px solid ${autoRefresh ? accent : "rgba(255,255,255,0.12)"}`,
              background: autoRefresh ? `${accent}18` : "rgba(255,255,255,0.04)",
              color: autoRefresh ? accent : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {autoRefresh ? "⟳ Авто 5с" : "⟳ Авто"}
          </button>

          {/* Manual refresh */}
          <button
            onClick={fetchLogs}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "0.5rem",
              border: `1px solid ${accent}`,
              background: `${accent}18`,
              color: accent,
              cursor: "pointer",
            }}
          >
            Оновити
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(255,82,82,0.10)",
            border: "1px solid rgba(255,82,82,0.25)",
            borderRadius: "0.75rem",
            padding: "0.875rem 1.25rem",
            color: "#ff5252",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "50%",
              border: `2px solid ${accent}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        )}

        {/* Log entries */}
        {!loading && (
          <div style={{
            background: "linear-gradient(170deg, #0f1012 0%, #0a0b0c 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "0.875rem",
            overflow: "hidden",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            {visible.length === 0 && (
              <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.875rem" }}>
                Логів не знайдено
              </div>
            )}

            {visible.map((entry, i) => {
              const ls = levelStyle(entry.level);
              const { main, stack } = splitMessage(entry.message);
              const isExpanded = expanded.has(i);
              const isError = hasException(entry.message);

              return (
                <div
                  key={i}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    transition: "background 0.1s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.5rem 1rem",
                      cursor: isError ? "pointer" : "default",
                    }}
                    onClick={() => isError && toggleExpand(i)}
                  >
                    {/* Level badge */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      padding: "0.125rem 0.375rem",
                      borderRadius: "0.25rem",
                      background: ls.bg,
                      color: ls.color,
                      marginTop: "0.125rem",
                      minWidth: "3.5rem",
                      textAlign: "center",
                    }}>
                      {ls.label}
                    </span>

                    {/* Timestamp */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: "0.6875rem",
                      color: "rgba(255,255,255,0.3)",
                      whiteSpace: "nowrap",
                      marginTop: "0.0625rem",
                    }}>
                      {entry.timestamp.replace("T", " ").slice(0, 19)}
                    </span>

                    {/* Logger */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: "0.6875rem",
                      color: accent,
                      opacity: 0.6,
                      marginTop: "0.0625rem",
                      maxWidth: "10rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {entry.logger}
                    </span>

                    {/* Message */}
                    <span style={{
                      flex: 1,
                      fontSize: "0.8125rem",
                      color: isError ? ls.color : "rgba(255,255,255,0.75)",
                      wordBreak: "break-all",
                      lineHeight: 1.45,
                    }}>
                      {main}
                    </span>

                    {/* Expand icon */}
                    {isError && (
                      <span style={{
                        flexShrink: 0,
                        fontSize: "0.75rem",
                        color: ls.color,
                        opacity: 0.7,
                        marginTop: "0.125rem",
                      }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {/* Stack trace */}
                  {isError && isExpanded && stack && (
                    <div style={{
                      margin: "0 1rem 0.75rem",
                      padding: "0.75rem 1rem",
                      background: "rgba(255,82,82,0.06)",
                      border: "1px solid rgba(255,82,82,0.15)",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                    }}>
                      {stack}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          select option { background: #111113; }
        `}</style>
      </main>
    </div>
  );
}
