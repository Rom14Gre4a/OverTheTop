"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { accent } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Заповніть всі поля"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      saveToken(res.token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; code?: string };
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Сервер недоступний. Перевір підключення.");
      } else {
        setError(err.response?.data?.message ?? "Невірний email або пароль.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: focused ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${focused ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}`,
    borderRadius: "0.625rem",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.6875rem",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "0.375rem",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{ width: "100%", maxWidth: "22rem" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "0.875rem",
            background: accent,
            marginBottom: "0.875rem",
            boxShadow: `0 0 24px ${accent}50`,
          }}>
            <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "#000", letterSpacing: "-0.02em" }}>OT</span>
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Over The Top
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", marginTop: "0.375rem" }}>
            Вхід до акаунту
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {error && (
              <div style={{
                background: "rgba(255,23,68,0.10)",
                border: "1px solid rgba(255,23,68,0.25)",
                borderRadius: "0.625rem",
                padding: "0.625rem 0.875rem",
                fontSize: "0.8125rem",
                color: "#ff5252",
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={inputStyle(emailFocused)}
              />
            </div>

            <div>
              <label style={labelStyle}>Пароль</label>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                style={inputStyle(pwFocused)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.6875rem",
                background: loading ? "rgba(255,255,255,0.08)" : accent,
                color: loading ? "rgba(255,255,255,0.35)" : "#000",
                fontWeight: 700,
                fontSize: "0.8125rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "none",
                borderRadius: "0.625rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                marginTop: "0.25rem",
                boxShadow: loading ? "none" : `0 0 16px ${accent}30`,
              }}
            >
              {loading ? "Входимо..." : "Увійти"}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Немає акаунту?{" "}
              <a href="/register" style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 600 }}>
                Зареєструватись
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
