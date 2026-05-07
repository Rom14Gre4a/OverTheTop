"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, saveToken } from "@/lib/auth";
import { Gender, WeightCategory, PreferredHand, ArmStyle } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";

const STEPS = ["Основне", "Профіль", "Стиль"] as const;

const WEIGHT_LABELS: Record<WeightCategory, string> = {
  [WeightCategory.Under60kg]: "до 60 кг",
  [WeightCategory.Under65kg]: "до 65 кг",
  [WeightCategory.Under70kg]: "до 70 кг",
  [WeightCategory.Under75kg]: "до 75 кг",
  [WeightCategory.Under80kg]: "до 80 кг",
  [WeightCategory.Under85kg]: "до 85 кг",
  [WeightCategory.Under90kg]: "до 90 кг",
  [WeightCategory.Under100kg]: "до 100 кг",
  [WeightCategory.Over100kg]: "понад 100 кг",
};

const STYLE_INFO: Record<ArmStyle, { label: string; desc: string }> = {
  [ArmStyle.TopRoll]:    { label: "Top Roll",    desc: "Пронація зап'ястка, відкат пальців суперника" },
  [ArmStyle.Hook]:       { label: "Hook",         desc: "Супінація зап'ястка, тяга до себе" },
  [ArmStyle.Press]:      { label: "Press",        desc: "Натиск плечем, King's Move" },
  [ArmStyle.Tricep]:     { label: "Tricep",       desc: "Тиск трицепсом зверху вниз" },
  [ArmStyle.Universal]:  { label: "Universal",    desc: "Комбінований стиль" },
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: Gender | "";
  weight: string;
  weightCategory: WeightCategory | "";
  preferredHand: PreferredHand | "";
  preferredStyle: ArmStyle | "";
  country: string;
  club: string;
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{
        fontSize: "0.6875rem",
        color: "rgba(255,255,255,0.4)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { accent } = useTheme();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", password: "",
    dateOfBirth: "", gender: "", weight: "", weightCategory: "",
    preferredHand: "", preferredStyle: "", country: "", club: "",
  });

  const set = (field: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const validateStep = () => {
    if (step === 0) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email.trim()) return "Введіть email";
      if (!emailRe.test(form.email.trim())) return "Невірний формат email";
      if (!form.password) return "Введіть пароль";
    }
    return null;
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    if (step === 0) {
      setLoading(true);
      try {
        const res = await import("@/lib/api").then(m =>
          m.api.get<{ taken: boolean }>(`/api/auth/check-email?email=${encodeURIComponent(form.email.trim())}`)
        );
        if (res.data.taken) {
          setError("Email вже використовується. Увійдіть або вкажіть інший.");
          return;
        }
      } catch {
        // backend unavailable — let registration attempt catch it
      } finally {
        setLoading(false);
      }
    }

    next();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender === "" ? null : form.gender,
        weight: form.weight ? parseFloat(form.weight) : null,
        weightCategory: form.weightCategory === "" ? null : form.weightCategory,
        preferredHand: form.preferredHand === "" ? null : form.preferredHand,
        preferredStyle: form.preferredStyle === "" ? null : form.preferredStyle,
        country: form.country || null,
        club: form.club || null,
      };
      const res = await register(payload);
      saveToken(res.token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; code?: string };
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Сервер недоступний. Перевір підключення.");
      } else {
        const msg = err.response?.data?.message;
        setError(msg ?? "Помилка реєстрації. Спробуй ще.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "0.625rem",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "0.5875rem 0",
    background: active ? `${accent}18` : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? accent : "rgba(255,255,255,0.10)"}`,
    borderRadius: "0.625rem",
    color: active ? accent : "rgba(255,255,255,0.55)",
    fontSize: "0.875rem",
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  const actionBtn = (primary: boolean, disabled = false): React.CSSProperties => ({
    flex: 1,
    padding: "0.6875rem",
    background: primary
      ? disabled ? "rgba(255,255,255,0.08)" : accent
      : "rgba(255,255,255,0.05)",
    color: primary
      ? disabled ? "rgba(255,255,255,0.35)" : "#000"
      : "rgba(255,255,255,0.6)",
    border: primary ? "none" : "1px solid rgba(255,255,255,0.12)",
    borderRadius: "0.625rem",
    fontSize: "0.8125rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem 1rem",
    }}>
      <div style={{ width: "100%", maxWidth: "26rem" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "3rem",
            height: "3rem",
            borderRadius: "0.75rem",
            background: accent,
            marginBottom: "0.75rem",
            boxShadow: `0 0 20px ${accent}45`,
          }}>
            <span style={{ fontSize: "1rem", fontWeight: 900, color: "#000", letterSpacing: "-0.02em" }}>OT</span>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Over The Top
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Реєстрація спортсмена
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: "1.5rem" }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                <div style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  background: i < step ? accent : i === step ? `${accent}18` : "rgba(255,255,255,0.06)",
                  border: `1px solid ${i <= step ? accent : "rgba(255,255,255,0.12)"}`,
                  color: i < step ? "#000" : i === step ? accent : "rgba(255,255,255,0.3)",
                  transition: "all 0.25s ease",
                  flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  color: i === step ? "var(--foreground)" : "rgba(255,255,255,0.28)",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: "3.5rem",
                  height: "1px",
                  background: i < step ? accent : "rgba(255,255,255,0.10)",
                  margin: "0.9375rem 0.5rem 0",
                  transition: "background 0.3s ease",
                  flexShrink: 0,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

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

            {/* Step 0 — Основне */}
            {step === 0 && (
              <>
                <h2 style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>
                  Обліковий запис
                </h2>
                <F label="Email">
                  <input type="email" style={inputBase} value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </F>
                <F label="Пароль">
                  <input type="password" style={inputBase} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Будь-який пароль" autoComplete="new-password" />
                </F>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <F label="Ім'я (необов'язково)">
                    <input style={inputBase} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Олексій" />
                  </F>
                  <F label="Прізвище (необов'язково)">
                    <input style={inputBase} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Шевченко" />
                  </F>
                </div>
              </>
            )}

            {/* Step 1 — Профіль */}
            {step === 1 && (
              <>
                <h2 style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>Профіль</h2>
                <F label="Стать">
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {([Gender.Male, Gender.Female] as const).map(g => (
                      <button key={g} type="button" onClick={() => set("gender", form.gender === g ? "" : g)} style={toggleBtn(form.gender === g)}>
                        {g === Gender.Male ? "Чоловік" : "Жінка"}
                      </button>
                    ))}
                  </div>
                </F>
                <F label="Дата народження">
                  <input type="date" style={inputBase} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
                </F>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <F label="Вага (кг)">
                    <input type="number" style={inputBase} value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="80" />
                  </F>
                  <F label="Категорія">
                    <select style={inputBase} value={form.weightCategory} onChange={e => set("weightCategory", e.target.value === "" ? "" : parseInt(e.target.value))}>
                      <option value="">— вибрати</option>
                      {Object.entries(WEIGHT_LABELS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: "#111113" }}>{v}</option>
                      ))}
                    </select>
                  </F>
                </div>
                <F label="Країна">
                  <input style={inputBase} value={form.country} onChange={e => set("country", e.target.value)} placeholder="Україна" />
                </F>
                <F label="Клуб (необов'язково)">
                  <input style={inputBase} value={form.club} onChange={e => set("club", e.target.value)} placeholder="Назва клубу" />
                </F>
              </>
            )}

            {/* Step 2 — Стиль */}
            {step === 2 && (
              <>
                <h2 style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "1rem", margin: 0 }}>Стиль боротьби</h2>
                <F label="Робоча рука">
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {([PreferredHand.Right, PreferredHand.Left, PreferredHand.Both] as const).map(h => (
                      <button key={h} type="button" onClick={() => set("preferredHand", form.preferredHand === h ? "" : h)} style={toggleBtn(form.preferredHand === h)}>
                        {h === PreferredHand.Right ? "Права" : h === PreferredHand.Left ? "Ліва" : "Обидві"}
                      </button>
                    ))}
                  </div>
                </F>
                <F label="Улюблений стиль">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {([ArmStyle.TopRoll, ArmStyle.Hook, ArmStyle.Press, ArmStyle.Tricep, ArmStyle.Universal] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("preferredStyle", form.preferredStyle === s ? "" : s)}
                        style={{
                          textAlign: "left",
                          padding: "0.75rem 1rem",
                          background: form.preferredStyle === s ? `${accent}14` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${form.preferredStyle === s ? accent : "rgba(255,255,255,0.08)"}`,
                          borderRadius: "0.625rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: form.preferredStyle === s ? accent : "var(--foreground)",
                          display: "block",
                        }}>
                          {STYLE_INFO[s].label}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.38)", display: "block", marginTop: "0.125rem" }}>
                          {STYLE_INFO[s].desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </F>
              </>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
              {step > 0 && (
                <button onClick={back} style={actionBtn(false)}>
                  Назад
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={handleNext} disabled={loading} style={actionBtn(true, loading)}>
                  {loading && step === 0 ? "Перевіряємо..." : "Далі"}
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} style={actionBtn(true, loading)}>
                  {loading ? "Реєструємо..." : "Зареєструватись"}
                </button>
              )}
            </div>

            {/* Skip link for optional steps */}
            {step === 1 && (
              <button onClick={next} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem",
                textAlign: "center", padding: 0,
                transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                Пропустити →
              </button>
            )}
            {step === 2 && (
              <button onClick={handleSubmit} disabled={loading} style={{
                background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem",
                textAlign: "center", padding: 0,
                transition: "color 0.15s",
              }}
                onMouseEnter={e => !loading && (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                Пропустити і зареєструватись →
              </button>
            )}

            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Вже є акаунт?{" "}
              <a href="/login" style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: 600 }}>
                Увійти
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
